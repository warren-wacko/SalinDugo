import { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
  ResponsiveContainer,
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
import {
  TrendingUp,
  Activity,
  Droplet,
  BarChart3,
  LineChart as LineChartIcon,
  GitBranch,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import api from "../../../api/axios";
import ForecastMap from "./ForecastMap";
const ML_BASE_URL = "http://localhost:8000";
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

function KPICard({ title, value, description, icon: Icon, accentColor }) {
  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br from-card to-card/80 border transition-all hover:shadow-lg hover:border-primary/20`}
    >
      <div
        className={`absolute top-0 right-0 w-20 h-20 rounded-full ${accentColor} opacity-10 -mr-10 -mt-10`}
      ></div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          {Icon && (
            <div
              className={`p-2 rounded-lg bg-${accentColor}/10 text-${accentColor}`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-foreground">{value ?? "-"}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-3">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCardWithIcon({
  icon: Icon,
  title,
  description,
  accentColor,
  children,
}) {
  return (
    <Card
      className={`border-0 bg-gradient-to-br from-card/95 to-card/80 shadow-md transition-all hover:shadow-lg overflow-hidden`}
    >
      <div className={`h-1 ${accentColor}`}></div>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-sm`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
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

        const [historyRes, totalRes, detailRes, stockRes, flowRes] =
          await Promise.all([
            axios.get(`${ML_BASE_URL}/history-total/${hospitalId}`),
            axios.get(`${ML_BASE_URL}/forecast-total/${hospitalId}?days=30`),
            axios.get(`${ML_BASE_URL}/forecast/${hospitalId}?days=30`),
            api.get(`/api/stocks`),
            api.get(`/api/stocks/history`),
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
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Demand Forecasting Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Comprehensive 30-day blood demand analysis with inventory projections
          and trend insights
        </p>
      </div>

      {/* KPI CARDS - TOP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <KPICard
          icon={TrendingUp}
          title="30-Day Total Demand"
          value={kpis?.totalDemand}
          description="Total predicted units needed across all types"
          accentColor="bg-blue-500"
        />
        <KPICard
          icon={CheckCircle}
          title="Available Inventory"
          value={kpis?.totalStock}
          description="Current units in stock"
          accentColor="bg-green-500"
        />
        <KPICard
          icon={AlertTriangle}
          title="Peak Daily Demand"
          value={kpis?.peakDemand}
          description="Highest single-day forecast"
          accentColor="bg-orange-500"
        />
        <KPICard
          icon={AlertTriangle}
          title="Stock Risk"
          value={stockRisk?.risk}
          description={
            stockRisk
              ? `Stockout in ${stockRisk.daysWithout} days (no donations)`
              : ""
          }
          accentColor={
            stockRisk?.risk === "HIGH"
              ? "bg-red-500"
              : stockRisk?.risk === "MEDIUM"
                ? "bg-orange-500"
                : "bg-green-500"
          }
        />
      </div>

      {/* PRIMARY FORECAST SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5 mt-5">
        {/* MAIN TREND CHART */}
        <div className="lg:col-span-2">
          <ChartCardWithIcon
            icon={TrendingUp}
            title="Total Demand Forecast"
            description="30-day trend of total blood demand across all types"
            accentColor="from-blue-500 to-cyan-500"
          >
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <AreaChart data={totalForecast}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
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
        </div>

        {/* PEAK DEMAND & ACCELERATION */}
        <div className="flex flex-col gap-6">
          <ChartCardWithIcon
            icon={Activity}
            title="Demand Change"
            description="Daily change in demand"
            accentColor="from-orange-500 to-red-500"
          >
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={accelerationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
      </div>

      {/* PROJECTION & TRENDS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-5">
        {/* BLOOD TYPE CONTRIBUTION */}
        <ChartCardWithIcon
          icon={Droplet}
          title="Demand by Blood Type"
          description="Trend of predicted demand across blood types"
          accentColor="from-red-500 to-pink-500"
        >
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

      {/* DISTRIBUTION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* INVENTORY SIMULATION */}
        <ChartCardWithIcon
          icon={GitBranch}
          title="Inventory Projection"
          description="With and without continued donations over 30 days"
          accentColor="from-green-500 to-emerald-500"
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
          accentColor="from-indigo-500 to-purple-500"
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
      <ChartCardWithIcon
        icon={AlertTriangle}
        title="Blood Type Risk Levels"
        description="Forecast demand vs current inventory"
        accentColor="from-red-500 to-orange-500"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["HIGH", "MEDIUM", "LOW"].map((level) => {
            const styles =
              level === "HIGH"
                ? {
                    badge: "bg-red-500/15 text-red-500 border-red-500/30",
                    border: "border-red-500/30",
                    glow: "hover:shadow-red-500/20",
                  }
                : level === "MEDIUM"
                  ? {
                      badge:
                        "bg-orange-500/15 text-orange-500 border-orange-500/30",
                      border: "border-orange-500/30",
                      glow: "hover:shadow-orange-500/20",
                    }
                  : {
                      badge:
                        "bg-green-500/15 text-green-500 border-green-500/30",
                      border: "border-green-500/30",
                      glow: "hover:shadow-green-500/20",
                    };
            const items = bloodRiskGroups?.[level] || [];
            const isExpanded = expandedLevels[level];
            const visibleItems = isExpanded ? items : items.slice(0, 3);
            const hasMore = items.length > 3;

            return (
              <div
                key={level}
                className={`group rounded-xl border ${styles.border}
            bg-muted/20 backdrop-blur-sm
            p-4 flex flex-col min-h-[220px]
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-lg ${styles.glow}`}
              >
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[11px] tracking-wide font-bold px-3 py-1 rounded-full border ${styles.badge}`}
                  >
                    {level} RISK
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {bloodRiskGroups?.[level]?.length || 0} types
                  </span>
                </div>

                {/* CONTENT */}
                {/* CONTENT */}
                <div className="space-y-2 flex-1">
                  {items.length ? (
                    <>
                      {visibleItems.map((bt) => (
                        <div
                          key={bt.blood_type}
                          className="
            flex items-center justify-between
            px-3 py-2 rounded-lg
            bg-background/60
            border border-transparent
            transition-all duration-200
            group-hover:bg-background/80
            hover:border-border hover:shadow-sm
          "
                        >
                          <span className="text-sm font-semibold tracking-tight">
                            {bt.blood_type}
                          </span>

                          <span className="text-xs font-medium text-muted-foreground">
                            {bt.daysCover} days
                          </span>
                        </div>
                      ))}

                      {hasMore && (
                        <button
                          onClick={() => toggleLevel(level)}
                          className="
            w-full text-xs font-medium
            text-primary hover:text-primary/80
            py-1 rounded-md transition-colors
          "
                        >
                          {isExpanded
                            ? "Show less"
                            : `View ${items.length - 3} more`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground italic">
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

      <ForecastMap />
    </div>
  );
}
