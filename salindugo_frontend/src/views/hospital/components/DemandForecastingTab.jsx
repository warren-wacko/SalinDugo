import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import ForecastMap from "./ForecastMap";
import api from "../../../api/axios";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const chartConfig = {
  total_predicted_demand: {
    label: "Total Demand: ",
    color: "hsl(217, 91%, 60%)",
  },
  change: {
    label: "Daily Change: ",
    color: "hsl(25, 95%, 53%)",
  },
  incoming: {
    label: "Incoming",
    color: "hsl(142, 71%, 45%)",
  },
  outgoing: {
    label: "Outgoing",
    color: "hsl(0, 84%, 60%)",
  },
  no_donation: {
    label: "Without Donations",
    color: "hsl(0, 84%, 60%)",
  },
  with_donation: {
    label: "With Donations",
    color: "hsl(142, 71%, 45%)",
  },
  "A+": { label: "A+", color: "hsl(0, 84%, 60%)" },
  "A-": { label: "A-", color: "hsl(15, 86%, 57%)" },
  "B+": { label: "B+", color: "hsl(30, 80%, 55%)" },
  "B-": { label: "B-", color: "hsl(45, 93%, 51%)" },
  "AB+": { label: "AB+", color: "hsl(60, 70%, 50%)" },
  "AB-": { label: "AB-", color: "hsl(120, 73%, 45%)" },
  "O+": { label: "O+", color: "hsl(200, 83%, 53%)" },
  "O-": { label: "O-", color: "hsl(270, 61%, 50%)" },
};

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
  const [expandedLevels, setExpandedLevels] = useState({});
  const [inventoryFlow, setInventoryFlow] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [totalForecast, setTotalForecast] = useState([]);
  const [bloodTypeForecast, setBloodTypeForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("live"); // "live" | "backtest"
  const [backtestData, setBacktestData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [totals, setTotals] = useState(null);
  const toggleLevel = (level) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

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
          const [historyRes, totalRes, detailRes, stockRes, flowRes] =
            await Promise.all([
              api.get(`/api/history-total/${hospitalId}`),
              api.get(`/api/forecast-total/${hospitalId}?days=30`),
              api.get(`/api/forecast/${hospitalId}?days=30`),
              api.get(`/api/stocks`),
              api.get(`/api/stocks/history`),
            ]);

          setHistoryTotal(
            Array.isArray(historyRes.data) ? historyRes.data : [],
          );
          setTotalForecast(Array.isArray(totalRes.data) ? totalRes.data : []);
          setBloodTypeForecast(
            Array.isArray(detailRes.data) ? detailRes.data : [],
          );

          setInventory(stockRes.data || []);
          setInventoryFlow(flowRes.data.history || []);

          // clear backtest
          setBacktestData([]);
          setMetrics(null);
        }

        if (mode === "backtest") {
          const res = await api.get(`/api/backtest/${hospitalId}`);

          console.log("RAW BACKTEST RESPONSE:", res.data);

          setBacktestData(Array.isArray(res.data.data) ? res.data.data : []);
          setMetrics(res.data.summary || null);
          setTotals(res.data.totals || null);
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

  const backtestGrouped = useMemo(() => {
    if (!Array.isArray(backtestData) || !backtestData.length) return [];

    const grouped = {};

    backtestData.forEach((item) => {
      const date = item.date;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          actual: 0,
          predicted: 0,
        };
      }

      grouped[date].actual += Number(item.blood_requests_actual || 0);
      grouped[date].predicted += Number(item.blood_requests_pred || 0);
    });

    // 🔥 IMPORTANT: sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [backtestData]);

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
  // INVENTORY FLOW
  // ===============================
  const flowChartData = useMemo(() => {
    const grouped = {};

    inventoryFlow.forEach((item) => {
      const date = new Date(item.changed_at).toISOString().split("T")[0];

      if (!grouped[date]) grouped[date] = { date, incoming: 0, outgoing: 0 };

      if (item.change > 0) grouped[date].incoming += item.change;
      else grouped[date].outgoing += Math.abs(item.change);
    });

    return Object.values(grouped);
  }, [inventoryFlow]);

  // ===============================
  // KPI SUMMARY
  // ===============================
  const kpis = useMemo(() => {
    if (!totalForecast.length || !inventory.length) return null;

    const totalDemand = totalForecast.reduce(
      (s, d) => s + Number(d.total_predicted_demand || 0),
      0,
    );

    const totalStock = inventory.reduce(
      (s, i) => s + Number(i.units_available || 0),
      0,
    );

    const peakDemand = Math.max(
      ...totalForecast.map((d) => d.total_predicted_demand || 0),
    );

    return {
      totalDemand: totalDemand.toFixed(1),
      totalStock,
      peakDemand: peakDemand.toFixed(1),
    };
  }, [totalForecast, inventory]);

  // ===============================
  // INVENTORY TRAJECTORY
  // ===============================
  const avgDailyIncoming = useMemo(() => {
    if (!inventoryFlow.length) return 0;

    const grouped = {};
    inventoryFlow.forEach((i) => {
      const date = new Date(i.changed_at).toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = 0;
      if (i.change > 0) grouped[date] += i.change;
    });

    const days = Object.keys(grouped).length;
    if (!days) return 0;

    return Object.values(grouped).reduce((s, v) => s + v, 0) / days;
  }, [inventoryFlow]);

  const trajectory = useMemo(() => {
    if (!totalForecast.length || !inventory.length) return [];

    let stock = inventory.reduce(
      (s, i) => s + Number(i.units_available || 0),
      0,
    );

    let stockWith = stock;

    return totalForecast.map((d) => {
      stock = Math.max(0, stock - d.total_predicted_demand);

      stockWith = Math.max(
        0,
        stockWith - d.total_predicted_demand + avgDailyIncoming,
      );

      return {
        date: d.date,
        no_donation: stock,
        with_donation: stockWith,
      };
    });
  }, [totalForecast, inventory, avgDailyIncoming]);

  // ===============================
  // STOCK RISK ANALYSIS
  // ===============================
  const stockRisk = useMemo(() => {
    if (!trajectory.length) return null;

    // when stock hits zero (WITHOUT donations)
    const stockoutIndex = trajectory.findIndex((d) => d.no_donation <= 0);

    // when stock hits zero (WITH donations)
    const stockoutWithIndex = trajectory.findIndex((d) => d.with_donation <= 0);

    const daysWithout =
      stockoutIndex === -1 ? "Safe (30d+)" : stockoutIndex + 1;

    const daysWith =
      stockoutWithIndex === -1 ? "Safe (30d+)" : stockoutWithIndex + 1;

    // risk level logic
    let risk = "LOW";
    if (stockoutIndex !== -1 && stockoutIndex <= 3) risk = "HIGH";
    else if (stockoutIndex !== -1 && stockoutIndex <= 7) risk = "MEDIUM";

    return {
      daysWithout,
      daysWith,
      risk,
      stockoutDate:
        stockoutIndex !== -1 ? trajectory[stockoutIndex].date : null,
    };
  }, [trajectory]);

  // ===============================
  // BLOOD TYPE PRIORITY (GROUPED)
  // ===============================
  const bloodRiskGroups = useMemo(() => {
    if (!bloodTypeForecast.length || !inventory.length) return null;

    const demandMap = {};

    // total demand per blood type (30 days)
    bloodTypeForecast.forEach((d) => {
      if (!demandMap[d.blood_type]) demandMap[d.blood_type] = 0;
      demandMap[d.blood_type] += Number(d.predicted_demand || 0);
    });

    // stock lookup
    const stockMap = {};
    inventory.forEach((i) => {
      stockMap[i.blood_type] = Number(i.units_available || 0);
    });

    const grouped = {
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    Object.keys(demandMap).forEach((bt) => {
      const demand = demandMap[bt];
      const stock = stockMap[bt] ?? 0;

      // days of supply logic
      const avgDaily = demand / 30;
      const daysCover = avgDaily > 0 ? stock / avgDaily : 999;

      const row = {
        blood_type: bt,
        demand: demand.toFixed(1),
        stock,
        daysCover: daysCover.toFixed(1),
      };

      if (daysCover <= 3) grouped.HIGH.push(row);
      else if (daysCover <= 7) grouped.MEDIUM.push(row);
      else grouped.LOW.push(row);
    });

    return grouped;
  }, [bloodTypeForecast, inventory]);

  const forecastWindow = useMemo(() => {
    if (mode === "backtest") return "Oct. 1 2024 - Oct. 31 2024";

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

  const highestRiskTypes = useMemo(() => {
    if (!bloodRiskGroups) return [];
    return [
      ...(bloodRiskGroups.HIGH || []),
      ...(bloodRiskGroups.MEDIUM || []),
      ...(bloodRiskGroups.LOW || []),
    ].slice(0, 4);
  }, [bloodRiskGroups]);

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

  const riskTone =
    stockRisk?.risk === "HIGH"
      ? "red"
      : stockRisk?.risk === "MEDIUM"
        ? "amber"
        : "green";

  if (loading) {
    return (
      <div className="flex min-h-[520px] w-full items-center justify-center rounded-md border border-border bg-card">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full space-y-6 bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)] p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="rounded-md border border-border bg-card px-5 py-5 shadow-sm">
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

      {/* KPI CARDS - TOP SECTION */}
      {mode === "live" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            icon={TrendingUp}
            title="30-Day Total Demand"
            value={kpis?.totalDemand}
            description="Total predicted units needed across all types"
            tone="red"
          />
          <KPICard
            icon={CheckCircle}
            title="Available Inventory"
            value={kpis?.totalStock}
            description="Current units in stock"
            tone="green"
          />
          <KPICard
            icon={AlertTriangle}
            title="Peak Daily Demand"
            value={kpis?.peakDemand}
            description="Highest single-day forecast"
            tone="amber"
          />
          <KPICard
            icon={ShieldAlert}
            title="Stock Risk"
            value={stockRisk?.risk}
            description={
              stockRisk
                ? `Stockout in ${stockRisk.daysWithout} days (no donations)`
                : ""
            }
            tone={riskTone}
          />
        </div>
      )}
      {/* PRIMARY FORECAST SECTION */}
      <div>
        {mode === "backtest" && (
          <ChartCardWithIcon
            icon={TrendingUp}
            title="Backtest: Actual vs Predicted"
            description="Model validation on unseen data"
          >
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <LineChart data={backtestGrouped}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />
                <YAxis />

                <ChartTooltip />

                {/* ACTUAL */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                />

                {/* PREDICTED */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
            {/* METRICS */}
            {metrics && (
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
        )}
        {/* MAIN TREND CHART */}
        {mode === "live" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)]">
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
          </div>
        )}
      </div>

      {/* PROJECTION & TRENDS SECTION */}
      {mode === "live" && (
        <div className="grid grid-cols-1 gap-6">
          {/* BLOOD TYPE CONTRIBUTION */}
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
        </div>
      )}

      {/* DISTRIBUTION SECTION */}
      {mode === "live" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* INVENTORY SIMULATION */}
          <ChartCardWithIcon
            icon={GitBranch}
            title="Inventory Projection"
            description="With and without continued donations over 30 days"
          >
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <ComposedChart data={trajectory}>
                <defs>
                  <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(142, 71%, 45%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(142, 71%, 45%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(0, 84%, 60%)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(0, 84%, 60%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
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
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="with_donation"
                  fill="url(#colorWith)"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="no_donation"
                  fill="url(#colorWithout)"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          </ChartCardWithIcon>

          {/* INVENTORY FLOW */}
          <ChartCardWithIcon
            icon={BarChart3}
            title="Inventory Flow Timeline"
            description="Daily incoming and outgoing inventory movements"
          >
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={flowChartData}>
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
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="incoming"
                  fill="var(--color-incoming)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outgoing"
                  fill="var(--color-outgoing)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCardWithIcon>
        </div>
      )}
      {mode === "live" && (
        <ChartCardWithIcon
          icon={AlertTriangle}
          title="Blood Type Risk Levels"
          description="Forecast demand compared with current inventory coverage"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {["HIGH", "MEDIUM", "LOW"].map((level) => {
              const styles =
                level === "HIGH"
                  ? {
                      badge: "border-red-200 bg-red-50 text-red-700",
                      border: "border-red-200",
                    }
                  : level === "MEDIUM"
                    ? {
                        badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
                        border: "border-yellow-200",
                      }
                    : {
                        badge: "border-green-200 bg-green-50 text-green-700",
                        border: "border-green-200",
                      };
              const items = bloodRiskGroups?.[level] || [];
              const isExpanded = expandedLevels[level];
              const visibleItems = isExpanded ? items : items.slice(0, 3);
              const hasMore = items.length > 3;

              return (
                <div
                  key={level}
                  className={`flex min-h-[220px] flex-col rounded-md border bg-background p-4 ${styles.border}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styles.badge}`}
                    >
                      {level} Risk
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {items.length} types
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {items.length ? (
                      <>
                        {visibleItems.map((bt) => (
                          <div
                            key={bt.blood_type}
                            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {bt.blood_type}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bt.stock} units in stock
                              </p>
                            </div>

                            <span className="text-xs font-medium text-muted-foreground">
                              {bt.daysCover} days
                            </span>
                          </div>
                        ))}

                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => toggleLevel(level)}
                            className="w-full rounded-md py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                          >
                            {isExpanded
                              ? "Show less"
                              : `View ${items.length - 3} more`}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                          No blood types in this category
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCardWithIcon>
      )}

      <ForecastMap />
    </div>
  );
}
