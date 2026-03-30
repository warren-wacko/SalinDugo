import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ML_BASE_URL = "http://localhost:8000";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_TYPE_COLORS = {
  "A+": "#3b82f6",
  "A-": "#1d4ed8",
  "B+": "#ef4444",
  "B-": "#b91c1c",
  "AB+": "#8b5cf6",
  "AB-": "#6d28d9",
  "O+": "#10b981",
  "O-": "#059669",
};

function KPICard({ title, value, description }) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value ?? "-"}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DemandForecastingTab({ hospitalId }) {
  const [historyTotal, setHistoryTotal] = useState([]);
  const [inventoryFlow, setInventoryFlow] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [totalForecast, setTotalForecast] = useState([]);
  const [bloodTypeForecast, setBloodTypeForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    if (!hospitalId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyRes, totalRes, detailRes, stockRes, flowRes] =
          await Promise.all([
            axios.get(`${ML_BASE_URL}/history-total/${hospitalId}`),
            axios.get(`${ML_BASE_URL}/forecast-total/${hospitalId}?days=30`),
            axios.get(`${ML_BASE_URL}/forecast/${hospitalId}?days=30`),
            axios.get(`${ML_BASE_URL}/api/stocks`),
            axios.get(`${ML_BASE_URL}/api/stocks/history`),
          ]);

        setHistoryTotal(historyRes.data || []);
        setTotalForecast(totalRes.data || []);
        setBloodTypeForecast(detailRes.data || []);
        setInventory(stockRes.data || []);
        setInventoryFlow(flowRes.data.history || []);
      } catch (err) {
        console.error("Forecast fetch error:", err);
        setError("Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hospitalId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <p className="text-muted-foreground">Loading forecast data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full p-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="30-Day Total Demand"
          value={kpis?.totalDemand}
          description="Total predicted units needed"
        />
        <KPICard
          title="Available Inventory"
          value={kpis?.totalStock}
          description="Current stock levels"
        />
        <KPICard
          title="Peak Daily Demand"
          value={kpis?.peakDemand}
          description="Highest single-day forecast"
        />
      </div>

      {/* TOTAL FORECAST */}
      <ChartCard
        title="Total Predicted Demand"
        description="30-day forecast of total blood demand"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={totalForecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_predicted_demand"
              stroke="#3b82f6"
              strokeWidth={2.5}
              name="Predicted Demand"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* DEMAND ACCELERATION */}
      <ChartCard
        title="Demand Acceleration"
        description="Day-over-day change in predicted demand"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={accelerationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="change" fill="#f97316" name="Daily Change" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* CONTRIBUTION BY BLOOD TYPE */}
      <ChartCard
        title="Demand Contribution by Blood Type"
        description="Stacked breakdown of predicted demand across all blood types"
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {BLOOD_TYPES.map((bt) => (
              <Bar
                key={bt}
                dataKey={bt}
                stackId="a"
                fill={BLOOD_TYPE_COLORS[bt]}
                name={bt}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* INVENTORY SIMULATION */}
      <ChartCard
        title="Projected Inventory Depletion"
        description="Simulation of inventory levels with and without continued donations"
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trajectory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              dataKey="no_donation"
              stroke="#ef4444"
              strokeWidth={2}
              name="Without Donations"
            />
            <Line
              dataKey="with_donation"
              stroke="#10b981"
              strokeWidth={2}
              name="With Donations"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* FORECAST PER BLOOD TYPE */}
      <ChartCard
        title="Forecast Per Blood Type"
        description="Individual forecast trends for each blood type"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {BLOOD_TYPES.map((bt) => (
              <Line
                key={bt}
                dataKey={bt}
                stroke={BLOOD_TYPE_COLORS[bt]}
                strokeWidth={2}
                name={bt}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* INVENTORY FLOW */}
      <ChartCard
        title="Inventory Flow Timeline"
        description="Incoming and outgoing inventory movements over time"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={flowChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="incoming" fill="#10b981" name="Incoming Stock" />
            <Bar dataKey="outgoing" fill="#ef4444" name="Outgoing Stock" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
