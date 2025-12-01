import { useState, useEffect, useContext } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  AlertTriangle,
  Droplets,
} from "lucide-react";
import api from "../../../api/axios";
import { AuthContext } from "../../../context/AuthContext";
import { Button } from "@/components/ui/button";
import BloodDropLoader from "../../../utils/bloodDropLoader";
export default function DemandForecastingTab() {
  const { user } = useContext(AuthContext);

  const [forecastDays, setForecastDays] = useState(30); // default

  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Fetch forecast
  // -----------------------------
  const fetchForecast = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/api/demand/forecast?days=${forecastDays}`, // FIXED
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );

      setForecast(res.data.forecast || []);
      console.log("API RESPONSE:", res.data);
      setError(null);
    } catch (err) {
      console.error("Forecast Error:", err);
      setError("Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [forecastDays]);

  // -----------------------------
  // Insights Calculation
  // -----------------------------
  const getInsights = () => {
    if (!forecast || forecast.length === 0) return null;

    const values = forecast.map((f) => Number(f.forecast));
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    const max = Math.max(...values);
    const min = Math.min(...values);

    const maxDay = forecast.find((f) => Number(f.forecast) === max);
    const minDay = forecast.find((f) => Number(f.forecast) === min);

    // weekly trend
    const firstWeek = values.slice(0, 7);
    const lastWeek = values.slice(-7);

    const firstWeekAvg =
      firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;

    const trendPercent = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;

    // demand spikes
    const mean = average;
    const sd =
      Math.sqrt(
        values.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) /
          values.length
      ) || 0;

    const threshold = mean + sd;
    const highDemandDays = forecast.filter(
      (f) => Number(f.forecast) > threshold
    );

    return {
      average,
      max,
      min,
      maxDay,
      minDay,
      total: values.reduce((a, b) => a + b, 0),
      trendPercent,
      highDemandDays,
      threshold,
    };
  };

  // -----------------------------
  // Prepare chart data
  // -----------------------------
  const getChartData = () => {
    if (!forecast || forecast.length === 0) return [];

    const insights = getInsights();

    return forecast.map((f, index) => {
      const date = new Date(f.date);

      return {
        date: f.date,
        shortDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        forecast: Number(f.forecast.toFixed(2)),
        average: Number(insights.average.toFixed(2)),
        week: Math.ceil((index + 1) / 7),
      };
    });
  };

  const getWeeklyData = () => {
    const chartData = getChartData();
    const weeks = {};

    chartData.forEach((day) => {
      if (!weeks[day.week]) {
        weeks[day.week] = { week: `Week ${day.week}`, total: 0, count: 0 };
      }
      weeks[day.week].total += day.forecast;
      weeks[day.week].count++;
    });

    return Object.values(weeks).map((w) => ({
      ...w,
      total: Number(w.total.toFixed(2)),
      average: Number((w.total / w.count).toFixed(2)),
    }));
  };

  const insights = getInsights();
  const chartData = getChartData();
  const weeklyData = getWeeklyData();

  // -----------------------------
  // Loading / Error UI
  // -----------------------------
  if (loading) {
    return <BloodDropLoader />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <AlertTriangle className="inline-block w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-7 h-7 text-red-600" />
            {forecastDays}-Day Blood Demand Forecast ({user.region})
          </h2>
          <p className="text-gray-500 mt-1">
            AI-powered predictions to optimize blood inventory readiness
          </p>
        </div>

        <div className="flex gap-2">
          {/* Forecaset Range Buttons */}
          <Button onClick={() => setForecastDays(7)} variant="outline">
            7 Days
          </Button>
          <Button onClick={() => setForecastDays(14)} variant="outline">
            14 Days
          </Button>
          <Button
            onClick={() => setForecastDays(30)}
            className="bg-red-600 text-white"
          >
            30 Days
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const today = new Date();
              const nextMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                1
              );
              const endOfNextMonth = new Date(
                nextMonth.getFullYear(),
                nextMonth.getMonth() + 1,
                0
              );

              const daysToPredict = Math.ceil(
                (endOfNextMonth - today) / (1000 * 60 * 60 * 24)
              );

              setForecastDays(daysToPredict);
            }}
          >
            Next Month
          </Button>

          <Button onClick={fetchForecast} className="bg-gray-700 text-white">
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Forecasted</span>
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {insights.total.toFixed(0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Daily Mean</span>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {insights.average.toFixed(1)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Trend</span>
              {insights.trendPercent >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p
              className={`text-3xl font-bold mt-2 ${
                insights.trendPercent >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {insights.trendPercent.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Spike Days</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {insights.highDemandDays.length}
            </p>
          </div>
        </div>
      )}

      {/* Main Area Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Demand Forecast</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              {insights && (
                <ReferenceLine y={insights.average} stroke="#888" label="Avg" />
              )}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#dc2626"
                fill="#dc262644"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
