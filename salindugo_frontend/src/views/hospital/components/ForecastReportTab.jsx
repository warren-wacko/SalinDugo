import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Printer, Loader2 } from "lucide-react";
import api from "../../../api/axios";
import BloodDropLoader from "../../../utils/bloodDropLoader";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BT_COLORS = {
  "A+": "#2563eb",
  "A-": "#60a5fa",
  "B+": "#16a34a",
  "B-": "#34d399",
  "AB+": "#7c3aed",
  "AB-": "#a78bfa",
  "O+": "#dc2626",
  "O-": "#f87171",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtLongDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtWeekday(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { weekday: "long" });
}

export default function ForecastReportTab({
  hospitalId,
  hospitalName,
  hospitalLocation,
}) {
  const [totalForecast, setTotalForecast] = useState([]);
  const [bloodTypeForecast, setBloodTypeForecast] = useState([]);
  const [historyTotal, setHistoryTotal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hospitalId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [totalRes, detailRes, histTotalRes] = await Promise.all([
          api.get(`/api/forecast-total/${hospitalId}?days=30`),
          api.get(`/api/forecast/${hospitalId}?days=30`),
          api.get(`/api/history-total/${hospitalId}`),
        ]);
        setTotalForecast(Array.isArray(totalRes.data) ? totalRes.data : []);
        setBloodTypeForecast(
          Array.isArray(detailRes.data) ? detailRes.data : [],
        );
        setHistoryTotal(
          Array.isArray(histTotalRes.data) ? histTotalRes.data : [],
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hospitalId]);

  const totalChartData = useMemo(() => {
    return totalForecast.map((d) => ({
      date: d.date,
      label: fmtShortDate(d.date),
      predicted: Number(d.total_predicted_demand || 0),
    }));
  }, [totalForecast]);

  const bloodTypePivoted = useMemo(() => {
    const byDate = {};
    bloodTypeForecast.forEach((item) => {
      if (!byDate[item.date]) {
        byDate[item.date] = {
          date: item.date,
          label: fmtShortDate(item.date),
        };
      }
      byDate[item.date][item.blood_type] = Number(item.predicted_demand || 0);
    });
    return Object.values(byDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [bloodTypeForecast]);

  const bloodTypeBreakdown = useMemo(() => {
    const grouped = {};
    bloodTypeForecast.forEach((item) => {
      if (!grouped[item.blood_type]) grouped[item.blood_type] = [];
      grouped[item.blood_type].push({
        date: item.date,
        value: Number(item.predicted_demand || 0),
      });
    });
    return BLOOD_TYPES.map((bt) => {
      const entries = grouped[bt] || [];
      const total = entries.reduce((s, e) => s + e.value, 0);
      const days = entries.length || 1;
      const avg = total / days;
      let peak = { date: null, value: 0 };
      entries.forEach((e) => {
        if (e.value > peak.value) peak = e;
      });
      return { bloodType: bt, total, avg, peak, days };
    }).sort((a, b) => b.total - a.total);
  }, [bloodTypeForecast]);

  const dayOfWeekData = useMemo(() => {
    const buckets = WEEKDAYS.map((day) => ({ day, total: 0, count: 0 }));
    totalForecast.forEach((d) => {
      const dow = new Date(d.date).getDay();
      buckets[dow].total += Number(d.total_predicted_demand || 0);
      buckets[dow].count += 1;
    });
    return buckets.map((b) => ({
      day: b.day,
      avg: b.count > 0 ? b.total / b.count : 0,
    }));
  }, [totalForecast]);

  const top5Days = useMemo(() => {
    return [...totalForecast]
      .sort(
        (a, b) =>
          Number(b.total_predicted_demand || 0) -
          Number(a.total_predicted_demand || 0),
      )
      .slice(0, 5)
      .map((d) => ({
        date: d.date,
        total: Number(d.total_predicted_demand || 0),
      }));
  }, [totalForecast]);

  const yoy = useMemo(() => {
    if (!historyTotal.length || !totalForecast.length) return null;
    const start = new Date(totalForecast[0].date);
    const end = new Date(totalForecast[totalForecast.length - 1].date);
    const startLY = new Date(start);
    startLY.setFullYear(start.getFullYear() - 1);
    const endLY = new Date(end);
    endLY.setFullYear(end.getFullYear() - 1);

    const lastYearSum = historyTotal
      .filter((d) => {
        const dt = new Date(d.date);
        return dt >= startLY && dt <= endLY;
      })
      .reduce((s, d) => s + Number(d.blood_requests || 0), 0);

    if (lastYearSum === 0) return null;
    const forecastSum = totalForecast.reduce(
      (s, d) => s + Number(d.total_predicted_demand || 0),
      0,
    );
    const change = ((forecastSum - lastYearSum) / lastYearSum) * 100;
    return { lastYearSum, forecastSum, change };
  }, [historyTotal, totalForecast]);

  const summary = useMemo(() => {
    if (!totalForecast.length) return null;
    const values = totalForecast.map((d) =>
      Number(d.total_predicted_demand || 0),
    );
    const totalDemand = values.reduce((s, v) => s + v, 0);
    const avgDaily = totalDemand / values.length;
    const peak = Math.max(...values);
    const min = Math.min(...values);
    const peakDay = totalForecast.find(
      (d) => Number(d.total_predicted_demand) === peak,
    );
    const minDay = totalForecast.find(
      (d) => Number(d.total_predicted_demand) === min,
    );
    const variance =
      values.reduce((s, v) => s + (v - avgDaily) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    const highDays = values.filter((v) => v > avgDaily * 1.2).length;

    return {
      totalDemand,
      avgDaily,
      peak,
      peakDay: peakDay?.date,
      min,
      minDay: minDay?.date,
      std,
      highDays,
      dateRange: {
        start: totalForecast[0].date,
        end: totalForecast[totalForecast.length - 1].date,
      },
    };
  }, [totalForecast]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex min-h-[420px] w-full items-center justify-center">
        <BloodDropLoader />
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }
  if (!totalForecast.length || !summary) {
    return (
      <div className="p-6 text-muted-foreground">
        No forecast data available. Generate a forecast first in the Forecasting
        tab.
      </div>
    );
  }

  const topBT = bloodTypeBreakdown[0];
  const topBTPct =
    summary.totalDemand > 0 ? (topBT.total / summary.totalDemand) * 100 : 0;
  const days = totalForecast.length;
  const busiestDow = [...dayOfWeekData].sort((a, b) => b.avg - a.avg)[0];

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 1.2cm; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
          .recharts-wrapper { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Forecast Report
          </h2>
          <p className="text-sm text-muted-foreground">
            Print-friendly summary of the {days}-day demand forecast.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>

      <div className="print-area space-y-6 rounded-md border border-border bg-white p-6 text-black shadow-sm">
        <header className="border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold">Blood Demand Forecast Report</h1>
          <p className="mt-1 text-sm">
            <span className="font-semibold">{hospitalName || "Hospital"}</span>
            {hospitalLocation && (
              <span className="text-gray-700"> | {hospitalLocation}</span>
            )}
          </p>
          <p className="mt-1 text-sm">
            Forecast period:{" "}
            <span className="font-medium">
              {fmtLongDate(summary.dateRange.start)}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {fmtLongDate(summary.dateRange.end)}
            </span>{" "}
            <span className="text-gray-600">({days} days)</span>
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Generated: {new Date().toLocaleString()}
          </p>
        </header>

        <section>
          <h2 className="mb-2 text-base font-semibold">Executive Summary</h2>
          <p className="text-sm leading-6 text-gray-800">
            Total forecasted demand for the next {days} days is{" "}
            <b>{summary.totalDemand.toFixed(1)} units</b>, averaging{" "}
            <b>{summary.avgDaily.toFixed(1)} units/day</b>. Peak demand of{" "}
            <b>{summary.peak.toFixed(1)} units</b> is expected on{" "}
            <b>
              {fmtLongDate(summary.peakDay)} ({fmtWeekday(summary.peakDay)})
            </b>
            , while the quietest day is forecasted for{" "}
            <b>{fmtLongDate(summary.minDay)}</b> with{" "}
            <b>{summary.min.toFixed(1)} units</b>. <b>{topBT.bloodType}</b> is
            the most in-demand blood type, accounting for{" "}
            <b>{topBT.total.toFixed(1)} units</b> ({topBTPct.toFixed(1)}% of
            total).{" "}
            {summary.highDays > 0 && (
              <>
                {summary.highDays} day{summary.highDays === 1 ? "" : "s"} are
                expected to exceed average demand by 20% or more.
              </>
            )}{" "}
            {yoy && (
              <>
                Compared to the same period last year, demand is forecasted to{" "}
                {yoy.change >= 0 ? "increase" : "decrease"} by{" "}
                <b>{Math.abs(yoy.change).toFixed(1)}%</b> (
                {yoy.lastYearSum.toFixed(0)} {"->"} {yoy.forecastSum.toFixed(0)}{" "}
                units).
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Total Demand ({days}d)
              </div>
              <div className="mt-1 text-xl font-bold">
                {summary.totalDemand.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">units</div>
            </div>
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Avg Daily Demand
              </div>
              <div className="mt-1 text-xl font-bold">
                {summary.avgDaily.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                units/day (std {summary.std.toFixed(1)})
              </div>
            </div>
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Peak Demand Day
              </div>
              <div className="mt-1 text-xl font-bold">
                {summary.peak.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                {fmtShortDate(summary.peakDay)} ({fmtWeekday(summary.peakDay)})
              </div>
            </div>
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Lowest Demand Day
              </div>
              <div className="mt-1 text-xl font-bold">
                {summary.min.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                {fmtShortDate(summary.minDay)} ({fmtWeekday(summary.minDay)})
              </div>
            </div>
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Top Blood Type
              </div>
              <div className="mt-1 text-xl font-bold">{topBT.bloodType}</div>
              <div className="text-xs text-gray-600">
                {topBT.total.toFixed(1)} units ({topBTPct.toFixed(1)}%)
              </div>
            </div>
            <div className="rounded-md border border-gray-300 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                YoY Change
              </div>
              <div
                className={`mt-1 text-xl font-bold ${
                  yoy
                    ? yoy.change > 5
                      ? "text-red-700"
                      : yoy.change < -5
                        ? "text-green-700"
                        : "text-gray-800"
                    : "text-gray-800"
                }`}
              >
                {yoy
                  ? `${yoy.change >= 0 ? "+" : ""}${yoy.change.toFixed(1)}%`
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-600">
                {yoy
                  ? `vs ${yoy.lastYearSum.toFixed(0)} units last year`
                  : "no historical data"}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            Total Demand Forecast
          </h2>
          <p className="mb-2 text-xs text-gray-600">
            Predicted total daily demand across all blood types over the next{" "}
            {days} days.
          </p>
          <div
            className="rounded-md border border-gray-300 p-3"
            style={{ width: "100%", height: 280 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={totalChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#374151" }}
                  angle={-45}
                  textAnchor="end"
                  height={55}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#374151" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Predicted Units"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            {days}-Day Demand by Blood Type
          </h2>
          <p className="mb-2 text-xs text-gray-600">
            Total forecasted units for each blood type, ranked highest to
            lowest.
          </p>
          <div
            className="rounded-md border border-gray-300 p-3"
            style={{ width: "100%", height: 260 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bloodTypeBreakdown}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="bloodType"
                  tick={{ fontSize: 12, fill: "#374151" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#374151" }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} units`,
                    "",
                  ]}
                />
                <Bar dataKey="total" name="30-day Total Units">
                  {bloodTypeBreakdown.map((entry) => (
                    <Cell
                      key={entry.bloodType}
                      fill={BT_COLORS[entry.bloodType]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">
            Average Demand by Day of Week
          </h2>
          <p className="mb-2 text-xs text-gray-600">
            {busiestDow && busiestDow.avg > 0 ? (
              <>
                Busiest day on average: <b>{busiestDow.day}</b> with{" "}
                {busiestDow.avg.toFixed(1)} units/day forecasted.
              </>
            ) : (
              "Average forecasted demand grouped by weekday."
            )}
          </p>
          <div
            className="rounded-md border border-gray-300 p-3"
            style={{ width: "100%", height: 220 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayOfWeekData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#374151" }} />
                <YAxis tick={{ fontSize: 10, fill: "#374151" }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} units`,
                    "Avg",
                  ]}
                />
                <Bar dataKey="avg" fill="#6366f1" name="Avg Units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="print-page-break">
          <h2 className="mb-2 text-base font-semibold">
            Forecast Trend by Blood Type
          </h2>
          <p className="mb-2 text-xs text-gray-600">
            Daily forecasted demand for each individual blood type.
          </p>
          <div
            className="rounded-md border border-gray-300 p-3"
            style={{ width: "100%", height: 320 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bloodTypePivoted}
                margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#374151" }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#374151" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {BLOOD_TYPES.map((bt) => (
                  <Line
                    key={bt}
                    type="monotone"
                    dataKey={bt}
                    stroke={BT_COLORS[bt]}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">
            Detailed Blood Type Breakdown
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Rank
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Blood Type
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Total (units)
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Avg/Day
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Peak
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Peak Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody>
              {bloodTypeBreakdown.map((row, idx) => {
                const pct =
                  summary.totalDemand > 0
                    ? (row.total / summary.totalDemand) * 100
                    : 0;
                return (
                  <tr key={row.bloodType}>
                    <td className="border border-gray-300 px-3 py-2">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                        style={{ backgroundColor: BT_COLORS[row.bloodType] }}
                      />
                      {row.bloodType}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {row.total.toFixed(1)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {row.avg.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {row.peak.value.toFixed(1)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {fmtShortDate(row.peak.date)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">
            Top {top5Days.length} Highest Demand Days
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Rank
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Day
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Forecast (units)
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  vs Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {top5Days.map((d, idx) => {
                const diffPct =
                  summary.avgDaily > 0
                    ? ((d.total - summary.avgDaily) / summary.avgDaily) * 100
                    : 0;
                return (
                  <tr key={d.date}>
                    <td className="border border-gray-300 px-3 py-2">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {fmtLongDate(d.date)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {fmtWeekday(d.date)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {d.total.toFixed(1)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      <span
                        className={
                          diffPct > 0
                            ? "font-semibold text-red-700"
                            : "text-gray-700"
                        }
                      >
                        {diffPct >= 0 ? "+" : ""}
                        {diffPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="border-t border-gray-300 pt-3 text-xs text-gray-600">
          <p>
            Forecast generated by the SalinDugo demand forecasting engine using
            historical blood request patterns. Use this report alongside current
            inventory levels and donation schedules to plan replenishment.
          </p>
        </footer>
      </div>
    </div>
  );
}
