import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Activity,
  Droplet,
  BarChart3,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Radar,
  ShieldAlert,
  Calendar,
  Printer,
  Check,
  Square,
  X,
} from "lucide-react";
import { ForecastTooltip } from "./tooltips/ForecastToolTip";
import { BacktestTooltip } from "./tooltips/BacktestToolTip";
import { chartConfig } from "./utils/chartconfig";
import { useBloodTypeTrend } from "../hooks/useBloodTypeTrend";
import BloodTypeTrendCard from "./DemandComponents/BloodTypeTrendCard";
import { useDemandBudget } from "../hooks/useDemandBudget";
import DemandBudgetCard from "./DemandComponents/DemandBudgetCard";
import { useHighDemandStreak } from "../hooks/useHighDemandStreak";
import HighDemandStreakAlert from "./DemandComponents/HighDemandStreakAlert";
import api from "../../../api/axios";
import BloodDropLoader from "../../../utils/bloodDropLoader";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// =====================================================
// PRINT SELECTION — lets the user pick individual charts
// to include in a printout (separate from the full
// Print Report tab). Context lets each chart card opt
// into the checkbox UI without prop drilling.
// =====================================================
const PrintSelectionContext = createContext(null);

function PrintableSelector({ id, note, children }) {
  const ctx = useContext(PrintSelectionContext);

  if (!ctx) return <>{children}</>;

  const { selectionMode, selectedIds, toggle } = ctx;
  const selected = selectedIds.has(id);

  return (
    <div
      data-printable="true"
      data-print-selected={selected ? "true" : undefined}
      className={`relative transition-all ${
        selectionMode
          ? selected
            ? "rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "rounded-md ring-1 ring-border ring-offset-2 ring-offset-background"
          : ""
      }`}
    >
      {children}

      {selectionMode && (
        <button
          type="button"
          onClick={() => toggle(id)}
          data-no-print="true"
          aria-pressed={selected}
          aria-label={
            selected ? "Deselect chart for printing" : "Select chart for printing"
          }
          className={`absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border-2 shadow-md transition-colors ${
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {selected ? (
            <Check className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}

      {selectionMode && note && (
        <div
          data-no-print="true"
          className="absolute left-3 top-3 z-30 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary shadow-sm"
        >
          {note}
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, description, icon: Icon, tone = "neutral" }) {
  const toneStyles = {
    neutral: "border-border bg-card text-foreground",
    red: "border-primary/20 bg-primary/5 text-primary",
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-yellow-200 bg-yellow-50 text-yellow-700",
    slate: "border-border bg-background text-foreground",
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`rounded-md border p-2 ${toneStyles[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value ?? "-"}
        </div>
        {description && (
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCardWithIcon({ icon: Icon, title, description, children }) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-background/70 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export default function DemandForecastingTab({ hospitalId }) {
  const [historyTotal, setHistoryTotal] = useState([]);
  const [historyByType, setHistoryByType] = useState([]);
  const [totalForecast, setTotalForecast] = useState([]);
  const [bloodTypeForecast, setBloodTypeForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("live"); // "live" | "backtest"
  const [backtestData, setBacktestData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [totals, setTotals] = useState(null);
  const [bloodTypeMetrics, setBloodTypeMetrics] = useState([]);
  const [selectedBacktestBloodType, setSelectedBacktestBloodType] =
    useState("ALL");
  const [selectedForecastBloodType, setSelectedForecastBloodType] =
    useState("A+");
  const [selectedCI, setSelectedCI] = useState("both");
  const [selectedBacktestCI, setSelectedBacktestCI] = useState("both");
  const [selectedBloodTypeCI, setSelectedBloodTypeCI] = useState("both");

  // ===============================
  // PRINT SELECTION (per-chart)
  // ===============================
  const [printSelectionMode, setPrintSelectionMode] = useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = useState(() => new Set());

  const togglePrintId = useCallback((id) => {
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const printContextValue = useMemo(
    () => ({
      selectionMode: printSelectionMode,
      selectedIds: selectedPrintIds,
      toggle: togglePrintId,
    }),
    [printSelectionMode, selectedPrintIds, togglePrintId],
  );

  const allPrintIds = useMemo(() => {
    if (mode === "backtest") {
      return ["backtest-total", "backtest-by-blood-type"];
    }
    return [
      "total-demand-forecast",
      "demand-change",
      "demand-budget",
      "demand-by-blood-type",
      "high-demand-streak",
      "trend-by-blood-type",
      "forecast-confidence",
    ];
  }, [mode]);

  const handleSelectAllPrintables = () => {
    setSelectedPrintIds(new Set(allPrintIds));
  };

  const handleClearPrintSelection = () => {
    setSelectedPrintIds(new Set());
  };

  const handleCancelPrintMode = () => {
    setPrintSelectionMode(false);
    setSelectedPrintIds(new Set());
  };

  const handlePrintSelected = () => {
    if (selectedPrintIds.size === 0) return;
    document.body.classList.add("printing-selected-only");
    // tiny delay so the browser applies the print CSS before opening the dialog
    setTimeout(() => window.print(), 50);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-selected-only");
      setPrintSelectionMode(false);
      setSelectedPrintIds(new Set());
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // Reset selection whenever the user flips Live ↔ Backtest, since the set
  // of available charts changes.
  useEffect(() => {
    setSelectedPrintIds(new Set());
    setPrintSelectionMode(false);
  }, [mode]);

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    if (!hospitalId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (mode === "live") {
          const [historyTotalRes, historyRes, totalRes, detailRes] =
            await Promise.all([
              api.get(`/api/history-total/${hospitalId}`), // KEEP
              api.get(`/api/history/${hospitalId}`), // ADD
              api.get(`/api/forecast-total/${hospitalId}?days=30`),
              api.get(`/api/forecast/${hospitalId}?days=30`),
            ]);

          setHistoryTotal(
            Array.isArray(historyTotalRes.data) ? historyTotalRes.data : [],
          );
          setHistoryByType(
            Array.isArray(historyRes.data) ? historyRes.data : [],
          );
          setTotalForecast(Array.isArray(totalRes.data) ? totalRes.data : []);
          setBloodTypeForecast(
            Array.isArray(detailRes.data) ? detailRes.data : [],
          );

          // clear backtest
          setBacktestData([]);
          setMetrics(null);
          setTotals(null);
          setBloodTypeMetrics([]);
          setSelectedBacktestBloodType("ALL");
          setSelectedForecastBloodType("A+");
        }

        if (mode === "backtest") {
          const res = await api.get(`/api/backtest/${hospitalId}`);

          console.log("RAW BACKTEST RESPONSE:", res.data);

          setBacktestData(Array.isArray(res.data.data) ? res.data.data : []);
          setMetrics(res.data.summary || null);
          setTotals(res.data.totals || null);
          const summaries = Array.isArray(res.data.blood_type_summary)
            ? res.data.blood_type_summary
            : [];
          setBloodTypeMetrics(summaries);
          setSelectedBacktestBloodType(summaries[0]?.blood_type || "A+");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hospitalId, mode]);

  const { demandBudget30Days, rankedBudget } = useDemandBudget(
    bloodTypeForecast,
    BLOOD_TYPES,
  );

  const selectedBacktestMetrics = useMemo(() => {
    return (
      bloodTypeMetrics.find(
        (item) => item.blood_type === selectedBacktestBloodType,
      ) || null
    );
  }, [bloodTypeMetrics, selectedBacktestBloodType]);

  const backtestGrouped = useMemo(() => {
    if (!Array.isArray(backtestData) || !backtestData.length) {
      return [];
    }

    const grouped = {};

    backtestData.forEach((item) => {
      const date = item.date;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          actual: 0,
          predicted: 0,

          ci_80_lower: 0,
          ci_80_upper: 0,

          ci_95_lower: 0,
          ci_95_upper: 0,
        };
      }

      grouped[date].actual += Number(item.blood_requests_actual || 0);
      grouped[date].predicted += Number(item.blood_requests_pred || 0);

      const ci80 = item.ci_80 || [0, 0];
      const ci95 = item.ci_95 || [0, 0];

      grouped[date].ci_80_lower += Number(ci80[0] || 0);
      grouped[date].ci_80_upper += Number(ci80[1] || 0);

      grouped[date].ci_95_lower += Number(ci95[0] || 0);
      grouped[date].ci_95_upper += Number(ci95[1] || 0);
    });

    // 🔥 IMPORTANT: sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [backtestData]);

  const bloodTypeBacktestGrouped = useMemo(() => {
    if (!Array.isArray(backtestData) || !backtestData.length) return [];

    return backtestData
      .filter((item) => item.blood_type === selectedBacktestBloodType)
      .map((item) => ({
        date: item.date,
        actual: Number(item.blood_requests_actual || 0),
        predicted: Number(item.blood_requests_pred || 0),
        ci_80_lower: Math.max(0, Number(item.ci_80?.[0] || 0)),
        ci_80_upper: Number(item.ci_80?.[1] || 0),
        ci_95_lower: Math.max(0, Number(item.ci_95?.[0] || 0)),
        ci_95_upper: Number(item.ci_95?.[1] || 0),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [backtestData, selectedBacktestBloodType]);

  const formatMetric = (value, suffix = "") =>
    value === null || value === undefined || Number.isNaN(Number(value))
      ? "-"
      : `${value}${suffix}`;

  console.log("BACKTEST GROUPED:", backtestGrouped);

  // ===============================
  // GROUP BY DATE
  // ===============================
  const groupedData = useMemo(() => {
    if (!bloodTypeForecast.length) return [];

    return Object.values(
      bloodTypeForecast.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = { date: item.date };
        acc[item.date][item.blood_type] = item.predicted_demand;
        return acc;
      }, {}),
    );
  }, [bloodTypeForecast]);

  const forecastIntervalData = useMemo(() => {
    if (!bloodTypeForecast.length) return [];

    return bloodTypeForecast
      .filter((item) => item.blood_type === selectedForecastBloodType)
      .map((item) => {
        const lower80Raw = Number(item.ci_80?.[0]);
        const upper80 = Number(item.ci_80?.[1]);
        const lower80 = Number.isFinite(lower80Raw)
          ? Math.max(0, lower80Raw)
          : 0;

        const lower95Raw = Number(item.ci_95?.[0]);
        const upper95 = Number(item.ci_95?.[1]);
        const lower95 = Number.isFinite(lower95Raw)
          ? Math.max(0, lower95Raw)
          : 0;

        return {
          date: item.date,
          prediction: Number(item.prediction ?? 0),

          ci_80_lower: lower80,
          ci_80_upper: Number.isFinite(upper80) ? upper80 : 0,
          ci_80_range: Number.isFinite(upper80) ? upper80 - lower80 : 0,

          ci_95_lower: lower95,
          ci_95_upper: Number.isFinite(upper95) ? upper95 : 0,
          ci_95_range: Number.isFinite(upper95) ? upper95 - lower95 : 0,
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [bloodTypeForecast, selectedForecastBloodType]);

  const hasForecastIntervals = useMemo(() => {
    return forecastIntervalData.some(
      (item) =>
        item.ci_80_lower != null &&
        item.ci_80_upper != null &&
        item.ci_95_lower != null &&
        item.ci_95_upper != null,
    );
  }, [forecastIntervalData]);

  console.log("forecast interval:", forecastIntervalData);

  // ===============================
  // DEMAND ACCELERATION
  // ===============================
  const accelerationData = useMemo(() => {
    return totalForecast.map((d, i) => ({
      date: d.date,
      change:
        i === 0
          ? 0
          : d.total_predicted_demand -
            totalForecast[i - 1].total_predicted_demand,
    }));
  }, [totalForecast]);

  // ===============================
  // KPI SUMMARY
  // ===============================
  const kpis = useMemo(() => {
    if (!totalForecast.length) return null;

    const totalDemand = totalForecast.reduce(
      (s, d) => s + Number(d.total_predicted_demand || 0),
      0,
    );

    const peakDemand = Math.max(
      ...totalForecast.map((d) => d.total_predicted_demand || 0),
    );

    return {
      totalDemand: totalDemand.toFixed(1),
      peakDemand: peakDemand.toFixed(1),
    };
  }, [totalForecast]);

  const forecastWindow = useMemo(() => {
    if (mode === "backtest") return "Oct. 1 2025 - Oct. 31 2025";

    if (!totalForecast.length) return "30-day horizon";

    const firstDate = new Date(totalForecast[0].date).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    );
    const lastDate = new Date(
      totalForecast[totalForecast.length - 1].date,
    ).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${firstDate} - ${lastDate}`;
  }, [mode, totalForecast]);

  const mostInDemandBloodType = useMemo(() => {
    if (!bloodTypeForecast.length) return null;

    const totalsByType = {};

    bloodTypeForecast.forEach((item) => {
      if (!totalsByType[item.blood_type]) totalsByType[item.blood_type] = 0;
      totalsByType[item.blood_type] += Number(item.predicted_demand || 0);
    });

    const [bloodType, demand] =
      Object.entries(totalsByType).sort((a, b) => b[1] - a[1])[0] || [];

    if (!bloodType) return null;

    return {
      bloodType,
      demand: demand.toFixed(1),
    };
  }, [bloodTypeForecast]);

  const topBloodType7 = useMemo(() => {
    if (!bloodTypeForecast.length) return null;

    const grouped = {};

    // group by blood type
    bloodTypeForecast.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push({
        date: item.date,
        value: Number(item.predicted_demand || 0),
      });
    });

    let best = null;

    Object.entries(grouped).forEach(([bt, arr]) => {
      const total7 = arr
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 7)
        .reduce((sum, d) => sum + d.value, 0);

      if (!best || total7 > best.value) {
        best = { bloodType: bt, value: total7 };
      }
    });

    return best;
  }, [bloodTypeForecast]);
  console.log("history:", historyTotal);

  const last7DayActual = useMemo(() => {
    if (!historyByType.length) return {};

    const grouped = {};

    historyByType.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push(Number(item.blood_requests || 0));
    });

    const result = {};

    Object.keys(grouped).forEach((bt) => {
      const last7 = grouped[bt].slice(-7);
      const avg = last7.reduce((s, v) => s + v, 0) / (last7.length || 1);

      result[bt] = avg;
    });

    return result;
  }, [historyByType]);

  const next7DayForecast = useMemo(() => {
    if (!bloodTypeForecast.length) return {};

    const grouped = {};

    bloodTypeForecast.forEach((item) => {
      if (!grouped[item.blood_type]) {
        grouped[item.blood_type] = [];
      }

      grouped[item.blood_type].push({
        date: item.date,
        value: Number(item.predicted_demand || 0),
      });
    });

    const result = {};

    Object.keys(grouped).forEach((bt) => {
      const first7 = grouped[bt]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 7);

      const avg =
        first7.reduce((s, d) => s + d.value, 0) / (first7.length || 1);

      result[bt] = avg;
    });

    return result;
  }, [bloodTypeForecast]);

  const trendByBloodType = useBloodTypeTrend({
    historyByType,
    bloodTypeForecast,
    BLOOD_TYPES,
  });

  const streaks = useHighDemandStreak({
    bloodTypeForecast,
    historyByType,
  });

  const forecastTotal = useMemo(() => {
    if (!totalForecast.length) return null;

    return totalForecast.reduce(
      (sum, d) => sum + Number(d.total_predicted_demand || 0),
      0,
    );
  }, [totalForecast]);

  const lastYearTotal = useMemo(() => {
    if (!historyTotal.length || !totalForecast.length) return null;

    // get forecast date range
    const dates = totalForecast.map((d) => new Date(d.date));
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);

    // shift 1 year back
    const startLastYear = new Date(start);
    startLastYear.setFullYear(start.getFullYear() - 1);

    const endLastYear = new Date(end);
    endLastYear.setFullYear(end.getFullYear() - 1);

    // filter history
    const filtered = historyTotal.filter((d) => {
      const date = new Date(d.date);
      return date >= startLastYear && date <= endLastYear;
    });

    if (!filtered.length) return null;

    return filtered.reduce((sum, d) => sum + Number(d.blood_requests || 0), 0);
  }, [historyTotal, totalForecast]);

  const yoyChange = useMemo(() => {
    if (!forecastTotal || !lastYearTotal) return null;

    if (lastYearTotal === 0) return null;

    return ((forecastTotal - lastYearTotal) / lastYearTotal) * 100;
  }, [forecastTotal, lastYearTotal]);

  const formatRange = (start, end) => {
    const s = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const e = new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${s} – ${e}`;
  };

  const yoyDisplay = useMemo(() => {
    if (yoyChange === null || forecastTotal == null || lastYearTotal == null)
      return null;

    const current = Math.round(forecastTotal);
    const previous = Math.round(lastYearTotal);

    // ✅ FIX: compute range here
    const range =
      totalForecast.length > 0
        ? formatRange(
            totalForecast[0].date,
            totalForecast[totalForecast.length - 1].date,
          )
        : null;

    return {
      value: `${yoyChange > 0 ? "+" : ""}${yoyChange.toFixed(1)}%`,
      trend:
        yoyChange > 5 ? "Increasing" : yoyChange < -5 ? "Decreasing" : "Stable",
      tone: yoyChange > 5 ? "red" : yoyChange < -5 ? "green" : "slate",

      comparison: `${previous} → ${current} units`,
      range, // ✅ now defined
    };
  }, [yoyChange, forecastTotal, lastYearTotal, totalForecast]);

  if (error) {
    return (
      <div className="flex min-h-[420px] w-full items-center justify-center rounded-md border border-destructive/25 bg-destructive/5 p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">{error}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Refresh the page or check the forecasting service connection.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] w-full items-center justify-center">
        <BloodDropLoader />
      </div>
    );
  }

  return (
    <PrintSelectionContext.Provider value={printContextValue}>
    <div className="w-full space-y-6 bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)] p-4 sm:p-6 lg:p-8">
      {/* PRINT-ONLY CSS — applied when body has .printing-selected-only */}
      <style>{`
        @media print {
          /* Hide global chrome (navbar uses <header>, sidebar uses <aside>) */
          body.printing-selected-only [data-no-print="true"],
          body.printing-selected-only nav,
          body.printing-selected-only header,
          body.printing-selected-only aside {
            display: none !important;
          }

          /* CRITICAL: defeat scroll containers, viewport-locked heights, AND
             padding/margin on every ancestor of a printable. Without the
             height/overflow part, the h-screen + overflow-y-auto wrapper
             clamps printing to whatever was visible. Without the padding/
             margin reset, the outer p-4/py-8 paddings push content past the
             last page boundary, creating a trailing empty page. */
          body.printing-selected-only,
          body.printing-selected-only :has([data-printable="true"]) {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Flatten any grid/flex container that holds a printable, so
             page-break-after on the printable items actually works.
             Browsers ignore page-break on grid/flex children. */
          body.printing-selected-only div:has(> [data-printable="true"]) {
            display: block !important;
            grid-template-columns: none !important;
            grid-template-rows: none !important;
            gap: 0 !important;
          }

          /* Hide unselected printables */
          body.printing-selected-only [data-printable="true"]:not([data-print-selected="true"]) {
            display: none !important;
          }

          /* Each selected printable: fill (almost) one page and center the
             chart on it. No explicit page-break-after — the min-height plus
             page-break-inside: avoid is enough to force the next chart onto
             the next page naturally, without the blank-page side-effect that
             page-break-after: always causes when the content already fills
             nearly the whole page. */
          body.printing-selected-only [data-printable="true"][data-print-selected="true"] {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: stretch !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 95vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Direct child (the Card) fills width; it'll be centered vertically
             by the flex parent above. */
          body.printing-selected-only [data-printable="true"][data-print-selected="true"] > * {
            width: 100% !important;
            margin: 0 auto !important;
          }

          body.printing-selected-only {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div data-no-print="true" className="rounded-md border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <Radar className="h-6 w-6" />
            </div>
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                Forecast Window: {forecastWindow}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Demand Forecasting
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Monitor 30-day blood demand, inventory runway, model validation,
                and blood type risk from one operations view.
              </p>
            </div>
          </div>

          <div className="flex rounded-md border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setMode("live")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === "live"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Live Forecast
            </button>
            <button
              type="button"
              onClick={() => setMode("backtest")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === "backtest"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Backtest
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-CUSTOM TOOLBAR */}
      <div
        data-no-print="true"
        className={`flex flex-col gap-3 rounded-md border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          printSelectionMode
            ? "sticky top-0 z-40 border-primary/30 bg-primary/5"
            : "border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-md border ${
              printSelectionMode
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            <Printer className="h-4 w-4" />
          </div>
          <div>
            {printSelectionMode ? (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {selectedPrintIds.size} chart
                  {selectedPrintIds.size === 1 ? "" : "s"} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap the checkbox on each chart to include it in the printout.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  Print specific charts
                </p>
                <p className="text-xs text-muted-foreground">
                  Pick exactly which charts to include — for example, just the
                  O+ confidence interval.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {printSelectionMode ? (
            <>
              <button
                type="button"
                onClick={handleSelectAllPrintables}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearPrintSelection}
                disabled={selectedPrintIds.size === 0}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCancelPrintMode}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintSelected}
                disabled={selectedPrintIds.size === 0}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
                {selectedPrintIds.size > 0 ? ` (${selectedPrintIds.size})` : ""}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPrintSelectionMode(true)}
              className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Printer className="h-4 w-4" />
              Print Custom Charts
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS - TOP SECTION */}
      {mode === "live" && (
        <div data-no-print="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KPICard
            icon={TrendingUp}
            title="30-Day Total Demand"
            value={kpis?.totalDemand}
            description="Total predicted units needed across all types"
            tone="red"
          />
          <KPICard
            icon={AlertTriangle}
            title="Peak Daily Demand"
            value={kpis?.peakDemand}
            description="Highest single-day forecast"
            tone="amber"
          />
          <KPICard
            icon={Droplet}
            title="Top Blood Type (30 Days)"
            value={mostInDemandBloodType?.bloodType || "-"}
            description={
              mostInDemandBloodType
                ? `${Math.round(mostInDemandBloodType.demand)} units expected`
                : "No data"
            }
            tone="red"
          />
          <KPICard
            icon={AlertTriangle}
            title="Top Blood Type (7 Days)"
            value={topBloodType7?.bloodType || "-"}
            description={
              topBloodType7
                ? `${Math.round(topBloodType7.value)} units expected`
                : "No data"
            }
            tone="amber"
          />
          <KPICard
            icon={TrendingUp}
            title="Year-over-Year Demand"
            value={yoyDisplay?.value || "-"}
            description={
              yoyDisplay ? (
                <>
                  <span
                    className={
                      yoyDisplay.trend === "Increasing"
                        ? "text-red-600 font-medium"
                        : yoyDisplay.trend === "Decreasing"
                          ? "text-green-600 font-medium"
                          : "text-muted-foreground"
                    }
                  >
                    {yoyDisplay.comparison} • {yoyDisplay.trend}
                  </span>
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {yoyDisplay.range} vs last year
                  </span>
                </>
              ) : (
                "No comparison data"
              )
            }
            tone={yoyDisplay?.tone || "neutral"}
          />
        </div>
      )}
      {/* PRIMARY FORECAST SECTION */}
      <div className="space-y-6">
        {mode === "backtest" && (
          <>
            <PrintableSelector id="backtest-total">
            <ChartCardWithIcon
              icon={TrendingUp}
              title="Total Demand Backtest"
              description="Actual vs predicted demand across all blood types"
            >
              <div className="mb-4 flex justify-end">
                <div className="flex rounded-md border border-border bg-background p-0.5">
                  {[
                    {
                      key: "80",
                      label: "80% CI",
                      active: "bg-green-600 text-white",
                    },
                    {
                      key: "95",
                      label: "95% CI",
                      active: "bg-blue-600 text-white",
                    },
                    {
                      key: "both",
                      label: "Both",
                      active: "bg-primary text-primary-foreground",
                    },
                  ].map(({ key, label, active }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedBacktestCI(key)}
                      className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedBacktestCI === key
                          ? `${active} shadow-sm`
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <ChartContainer config={chartConfig} className="h-72 w-full">
                <ComposedChart data={backtestGrouped}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<BacktestTooltip />} />

                  {/* 95% CI band */}
                  {(selectedBacktestCI === "95" ||
                    selectedBacktestCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_95_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_95_lower)
                          ? d.ci_95_lower
                          : d.predicted
                      }
                      fill="rgba(147,197,253,0.25)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* 80% CI band */}
                  {(selectedBacktestCI === "80" ||
                    selectedBacktestCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_80_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_80_lower)
                          ? d.ci_80_lower
                          : d.predicted
                      }
                      fill="rgba(34,197,94,0.35)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* Lower bound lines */}
                  {(selectedBacktestCI === "80" ||
                    selectedBacktestCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_80_lower"
                      stroke="#16a34a"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {(selectedBacktestCI === "95" ||
                    selectedBacktestCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_95_lower"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* ACTUAL */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />

                  {/* PREDICTED */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartContainer>
              {metrics && totals && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Model Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE: <b>{formatMetric(metrics.RMSE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE: <b>{formatMetric(metrics.MAE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE: <b>{formatMetric(metrics.MAPE_model, "%")}</b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Baseline Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE: <b>{formatMetric(metrics.RMSE_baseline)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE: <b>{formatMetric(metrics.MAE_baseline)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE: <b>{formatMetric(metrics.MAPE_baseline, "%")}</b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Actual vs Predicted
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Actual: <b>{formatMetric(totals.actual_total)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      Predicted: <b>{formatMetric(totals.predicted_total)}</b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Difference
                    </p>
                    <p
                      className={`mt-2 text-lg font-bold ${
                        totals.difference > 0
                          ? "text-blue-600"
                          : totals.difference < 0
                            ? "text-red-600"
                            : "text-foreground"
                      }`}
                    >
                      {totals.difference > 0 ? "+" : ""}
                      {formatMetric(totals.difference)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMetric(totals.percentage_error, "%")} error
                    </p>
                  </div>
                </div>
              )}
              {false && selectedBacktestMetrics && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Model Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE:{" "}
                      <b>{formatMetric(selectedBacktestMetrics.RMSE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE:{" "}
                      <b>{formatMetric(selectedBacktestMetrics.MAE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.MAPE_model, "%")}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Baseline Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.RMSE_baseline)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.MAE_baseline)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE:{" "}
                      <b>
                        {formatMetric(
                          selectedBacktestMetrics.MAPE_baseline,
                          "%",
                        )}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Actual vs Predicted
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Actual:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.actual_total)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      Predicted:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.predicted_total)}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Difference
                    </p>
                    <p
                      className={`mt-2 text-lg font-bold ${
                        selectedBacktestMetrics.difference > 0
                          ? "text-blue-600"
                          : selectedBacktestMetrics.difference < 0
                            ? "text-red-600"
                            : "text-foreground"
                      }`}
                    >
                      {selectedBacktestMetrics.difference > 0 ? "+" : ""}
                      {formatMetric(selectedBacktestMetrics.difference)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMetric(
                        selectedBacktestMetrics.percentage_error,
                        "%",
                      )}{" "}
                      error
                    </p>
                  </div>
                </div>
              )}
              {/* METRICS */}
              {false && metrics && (
                <div className="mt-4 text-sm">
                  RMSE (Model): <b>{metrics.RMSE_model}</b> | MAE (Model):{" "}
                  <b>{metrics.MAE_model}</b> | MAPE (Model):{" "}
                  <b>{metrics.MAPE_model}%</b>
                  <br />
                  RMSE (Baseline): <b>{metrics.RMSE_baseline}</b> | MAE
                  (Baseline): <b>{metrics.MAE_baseline}</b> | MAPE (Baseline):{" "}
                  <b>{metrics.MAPE_baseline}%</b>
                  {/* 🔥 NEW SECTION */}
                  {totals && (
                    <>
                      <hr className="my-2 opacity-30" />
                      Total Actual: <b>{totals.actual_total}</b> | Predicted:{" "}
                      <b>{totals.predicted_total}</b>
                      <br />
                      Difference:{" "}
                      <b
                        className={
                          totals.difference > 0
                            ? "text-blue-500"
                            : totals.difference < 0
                              ? "text-red-500"
                              : ""
                        }
                      >
                        {totals.difference > 0 ? "+" : ""}
                        {totals.difference}
                      </b>{" "}
                      ({totals.percentage_error}%)
                    </>
                  )}
                </div>
              )}
            </ChartCardWithIcon>
            </PrintableSelector>
            <PrintableSelector
              id="backtest-by-blood-type"
              note={`Currently: ${selectedBacktestBloodType}`}
            >
            <ChartCardWithIcon
              icon={Droplet}
              title="Backtest by Blood Type"
              description="Actual vs predicted demand for each individual blood type"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {BLOOD_TYPES.map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setSelectedBacktestBloodType(bt)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedBacktestBloodType === bt
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-md border border-border bg-background p-0.5">
                  {[
                    {
                      key: "80",
                      label: "80% CI",
                      active: "bg-green-600 text-white",
                    },
                    {
                      key: "95",
                      label: "95% CI",
                      active: "bg-blue-600 text-white",
                    },
                    {
                      key: "both",
                      label: "Both",
                      active: "bg-primary text-primary-foreground",
                    },
                  ].map(({ key, label, active }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedBloodTypeCI(key)}
                      className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedBloodTypeCI === key
                          ? `${active} shadow-sm`
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <ChartContainer config={chartConfig} className="h-72 w-full">
                <ComposedChart data={bloodTypeBacktestGrouped}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<BacktestTooltip />} />

                  {/* 95% CI band */}
                  {(selectedBloodTypeCI === "95" ||
                    selectedBloodTypeCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_95_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_95_lower)
                          ? d.ci_95_lower
                          : d.predicted
                      }
                      fill="rgba(147,197,253,0.25)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* 80% CI band */}
                  {(selectedBloodTypeCI === "80" ||
                    selectedBloodTypeCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_80_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_80_lower)
                          ? d.ci_80_lower
                          : d.predicted
                      }
                      fill="rgba(34,197,94,0.35)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* Lower bound lines */}
                  {(selectedBloodTypeCI === "80" ||
                    selectedBloodTypeCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_80_lower"
                      stroke="#16a34a"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {(selectedBloodTypeCI === "95" ||
                    selectedBloodTypeCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_95_lower"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartContainer>

              {selectedBacktestMetrics && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Model Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE:{" "}
                      <b>{formatMetric(selectedBacktestMetrics.RMSE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE:{" "}
                      <b>{formatMetric(selectedBacktestMetrics.MAE_model)}</b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.MAPE_model, "%")}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Baseline Error
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      RMSE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.RMSE_baseline)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAE:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.MAE_baseline)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      MAPE:{" "}
                      <b>
                        {formatMetric(
                          selectedBacktestMetrics.MAPE_baseline,
                          "%",
                        )}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Actual vs Predicted
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Actual:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.actual_total)}
                      </b>
                    </p>
                    <p className="text-sm text-foreground">
                      Predicted:{" "}
                      <b>
                        {formatMetric(selectedBacktestMetrics.predicted_total)}
                      </b>
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Difference
                    </p>
                    <p
                      className={`mt-2 text-lg font-bold ${
                        selectedBacktestMetrics.difference > 0
                          ? "text-blue-600"
                          : selectedBacktestMetrics.difference < 0
                            ? "text-red-600"
                            : "text-foreground"
                      }`}
                    >
                      {selectedBacktestMetrics.difference > 0 ? "+" : ""}
                      {formatMetric(selectedBacktestMetrics.difference)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatMetric(
                        selectedBacktestMetrics.percentage_error,
                        "%",
                      )}{" "}
                      error
                    </p>
                  </div>
                </div>
              )}
            </ChartCardWithIcon>
            </PrintableSelector>
          </>
        )}
        {/* MAIN TREND CHART */}
        {mode === "live" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)]">
            <PrintableSelector id="total-demand-forecast">
            <ChartCardWithIcon
              icon={TrendingUp}
              title="Total Demand Forecast"
              description="30-day trend of total blood demand across all types"
            >
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <AreaChart data={totalForecast}>
                  <defs>
                    <linearGradient
                      id="colorDemand"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(217, 91%, 60%)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total_predicted_demand"
                    stroke="hsl(217, 91%, 60%)"
                    fillOpacity={1}
                    fill="url(#colorDemand)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </ChartCardWithIcon>
            </PrintableSelector>

            <PrintableSelector id="demand-change">
            <ChartCardWithIcon
              icon={Activity}
              title="Demand Change"
              description="Daily change in demand"
            >
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={accelerationData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) =>
                      new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(value))
                    }
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="change"
                    fill="var(--color-change)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </ChartCardWithIcon>
            </PrintableSelector>
          </div>
        )}
      </div>

      {/* PROJECTION & TRENDS SECTION */}
      {mode === "live" && (
        <div className="grid grid-cols-1 gap-6">
          <PrintableSelector id="demand-budget">
          <ChartCardWithIcon
            icon={Calendar}
            title="30-Day Demand Budget by Blood Type"
            description="Forecasted total demand for planning"
          >
            <DemandBudgetCard
              demandBudget30Days={demandBudget30Days}
              rankedBudget={rankedBudget}
              trendByBloodType={trendByBloodType} // 👈 ADD THIS
              BLOOD_TYPES={BLOOD_TYPES}
            />
          </ChartCardWithIcon>
          </PrintableSelector>
          {/* BLOOD TYPE CONTRIBUTION */}
          <PrintableSelector id="demand-by-blood-type">
          <ChartCardWithIcon
            icon={Droplet}
            title="Demand by Blood Type"
            description="Trend of predicted demand across blood types"
          >
            {mostInDemandBloodType && (
              <div className="mb-4 flex flex-col gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                    Most in demand this month
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Highest total predicted demand across the forecast window.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/25 bg-background text-lg font-bold text-primary">
                    {mostInDemandBloodType.bloodType}
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight text-foreground">
                      {Math.round(mostInDemandBloodType.demand)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      predicted units
                    </p>
                  </div>
                </div>
              </div>
            )}
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <LineChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />

                <YAxis className="text-xs" />

                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                  }
                />

                <ChartLegend
                  content={<ChartLegendContent />}
                  wrapperStyle={{ paddingTop: "16px" }}
                />

                {BLOOD_TYPES.map((bt) => (
                  <Line
                    key={bt}
                    type="monotone"
                    dataKey={bt}
                    stroke={chartConfig[bt].color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </ChartCardWithIcon>
          </PrintableSelector>

          <PrintableSelector id="high-demand-streak">
          <div className="space-y-2">
            <HighDemandStreakAlert streaks={streaks} />
          </div>
          </PrintableSelector>

          <PrintableSelector id="trend-by-blood-type">
          <ChartCardWithIcon
            icon={GitBranch}
            title="7-Day Demand Trend by Blood Type"
            description="Forecast vs recent demand direction"
          >
            <BloodTypeTrendCard
              trendByBloodType={trendByBloodType}
              BLOOD_TYPES={BLOOD_TYPES}
            />
          </ChartCardWithIcon>
          </PrintableSelector>

          <PrintableSelector
            id="forecast-confidence"
            note={`Currently: ${selectedForecastBloodType}`}
          >
          <ChartCardWithIcon
            icon={Activity}
            title="Forecast Confidence Intervals"
            description="Residual-based 80% and 95% prediction intervals by blood type"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map((bt) => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setSelectedForecastBloodType(bt)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedForecastBloodType === bt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-border bg-background p-0.5">
                {[
                  {
                    key: "80",
                    label: "80% CI",
                    active: "bg-green-600 text-white",
                  },
                  {
                    key: "95",
                    label: "95% CI",
                    active: "bg-blue-600 text-white",
                  },
                  {
                    key: "both",
                    label: "Both",
                    active: "bg-primary text-primary-foreground",
                  },
                ].map(({ key, label, active }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCI(key)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCI === key
                        ? `${active} shadow-sm`
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {hasForecastIntervals ? (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <ComposedChart data={forecastIntervalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />

                  {/* 🔴 FIX: NEVER use function domain here */}
                  <YAxis domain={[0, "dataMax"]} />

                  <ChartTooltip content={<ForecastTooltip />} />

                  {/* =========================
        95% CI (background)
       ========================= */}
                  {(selectedCI === "95" || selectedCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_95_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_95_lower)
                          ? d.ci_95_lower
                          : d.prediction
                      }
                      fill="rgba(147,197,253,0.25)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* =========================
        80% CI (foreground)
       ========================= */}
                  {(selectedCI === "80" || selectedCI === "both") && (
                    <Area
                      type="linear"
                      dataKey="ci_80_upper"
                      baseValue={(d) =>
                        Number.isFinite(d.ci_80_lower)
                          ? d.ci_80_lower
                          : d.prediction
                      }
                      fill="rgba(34,197,94,0.35)"
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* Lower bound lines */}
                  {(selectedCI === "80" || selectedCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_80_lower"
                      stroke="#16a34a"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {(selectedCI === "95" || selectedCI === "both") && (
                    <Line
                      type="linear"
                      dataKey="ci_95_lower"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Prediction */}
                  <Line
                    type="monotone"
                    dataKey="prediction"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
                <p>No confidence interval data</p>
              </div>
            )}
          </ChartCardWithIcon>
          </PrintableSelector>
        </div>
      )}
    </div>
    </PrintSelectionContext.Provider>
  );
}
