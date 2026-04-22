import { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Gift,
  AlertTriangle,
  Building2,
  TrendingUp,
  Droplets,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CHART_COLORS = {
  primary: "#4ade80",
  secondary: "#60a5fa",
  warning: "#fbbf24",
  danger: "#f87171",
  yellow: "#f59e0b", // Tailwind amber-500
};

const STATUS_COLORS = {
  fulfilled: "#4ade80", // green
  open: "#60a5fa", // blue
  matched: "#fbbf24", // yellow
  cancelled: "#f87171", // red
};

const REGION_COLORS = {
  NCR: "#60a5fa",
  "Region III": "#facc15",
  "Region IV-A": "#fb7185",
  "Region VI": "#f97316",
  "Region VII": "#2dd4bf",
};

function SummaryCard({ title, value, icon: Icon, trend, trendValue, color }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value || 0}
            </p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">{trendValue}</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground text-lg font-semibold">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm font-semibold"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function LowStockSection({ lowStock }) {
  const [selectedHospital, setSelectedHospital] = useState("all");

  const hospitals = useMemo(() => {
    const uniqueHospitals = [
      ...new Set(lowStock.map((item) => item.hospital_name)),
    ];
    return uniqueHospitals;
  }, [lowStock]);

  const filteredStock = useMemo(() => {
    if (selectedHospital === "all") return lowStock;
    return lowStock.filter((item) => item.hospital_name === selectedHospital);
  }, [lowStock, selectedHospital]);

  const getUrgencyColor = (units) => {
    if (units <= 2)
      return "bg-destructive/20 text-destructive border-destructive/30";
    if (units <= 4)
      return "bg-yellow-400/20 text-yellow-400 border-yellow-500/30";
    return "bg-primary/20 text-primary border-primary/30";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Droplets className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-foreground text-lg font-semibold">
                Low Blood Stock Alerts
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Blood Centers with critically low inventory
              </p>
            </div>
          </div>

          <Select value={selectedHospital} onValueChange={setSelectedHospital}>
            <SelectTrigger className="w-full sm:w-[220px] bg-white border-border text-foreground">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select hospital" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-foreground">
                All Blood Centers ({hospitals.length})
              </SelectItem>
              {hospitals.map((hospital) => (
                <SelectItem
                  key={hospital}
                  value={hospital}
                  className="text-foreground"
                >
                  {hospital}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStock.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Droplets className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">No low stock alerts</p>
            <p className="text-sm text-muted-foreground mt-1">
              All blood types are adequately stocked
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredStock.map((stock, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white border border-border hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className={`font-bold text-sm px-3 py-1 ${getUrgencyColor(
                      stock.units_available,
                    )}`}
                  >
                    {stock.blood_type}
                  </Badge>
                  <span className="text-2xl font-bold text-foreground">
                    {stock.units_available}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      units
                    </span>
                  </span>
                </div>
                {selectedHospital === "all" && (
                  <p className="text-xs text-muted-foreground truncate">
                    {stock.hospital_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewTab() {
  const [summary, setSummary] = useState(null);
  const [donationTrend, setDonationTrend] = useState([]);
  const [requestTrend, setRequestTrend] = useState([]);
  const [requestBreakdown, setRequestBreakdown] = useState([]);
  const [donPerHospital, setDonPerHospital] = useState([]);
  const [reqPerHospital, setReqPerHospital] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regionStock, setRegionStock] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const getChartSVG = (id) => {
    const el = document.getElementById(id);
    if (!el) return "";

    const svg = el.querySelector("svg");
    if (!svg) return "";

    return svg.outerHTML;
  };

  const statusColor = (status) => {
    if (status === "fulfilled")
      return 'style="color:#4ade80;font-weight:bold;"';
    if (status === "open") return 'style="color:#60a5fa;font-weight:bold;"';
    if (status === "matched") return 'style="color:#fbbf24;font-weight:bold;"';
    if (status === "cancelled")
      return 'style="color:#f87171;font-weight:bold;"';
    return "";
  };

  // 🔹 MOVE PRINT HERE so it can see summary, regionStock, lowStock
  const handlePrintReport = () => {
    if (!summary) return; // safety

    const donationChart = getChartSVG("chart-donation-trend");
    const requestStatusChart = getChartSVG("chart-request-status");
    const requestTrendChart = getChartSVG("chart-request-trend");
    const donationsHospitalChart = getChartSVG("chart-donations-hospital");
    const requestsHospitalChart = getChartSVG("chart-requests-hospital");
    const regionStockChart = getChartSVG("chart-region-stock");

    const win = window.open("", "_blank", "width=1024,height=900");
    if (!win) {
      alert("Please allow popups to print the report.");
      return;
    }

    const lowStockGrouped = {};
    lowStock.forEach((item) => {
      if (!lowStockGrouped[item.hospital_name]) {
        lowStockGrouped[item.hospital_name] = [];
      }
      lowStockGrouped[item.hospital_name].push(item);
    });

    const lowColor = (u) =>
      u < 5 ? `style="color:red;font-weight:bold;"` : "";

    // Pivot + initialize
    const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

    const pivot = {};
    regionStock.forEach((r) => {
      if (!pivot[r.region]) {
        pivot[r.region] = { region: r.region };
        bloodTypes.forEach((bt) => (pivot[r.region][bt] = 0));
      }
      pivot[r.region][r.blood_type] = r.units;
    });

    // Row totals
    Object.values(pivot).forEach((row) => {
      row.total = bloodTypes.reduce((sum, bt) => sum + row[bt], 0);
    });

    // Column totals
    const columnTotals = {};
    bloodTypes.forEach((bt) => {
      columnTotals[bt] = Object.values(pivot).reduce(
        (sum, row) => sum + row[bt],
        0,
      );
    });
    columnTotals.total = Object.values(columnTotals).reduce((a, b) => a + b, 0);

    // Conditional color helper
    const colorCell = (value) =>
      value < 10 ? `style="color:red;font-weight:bold;"` : "";

    win.document.write(`
      <html>
        <head>
          <title>Admin Summary Report</title>
        <style>
  body { font-family: Arial, sans-serif; padding: 20px; }

  h1 { font-size: 22px; margin-bottom: 10px; }
  h2 { margin-top: 30px; font-size: 18px; }

  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
  th { background: #f2f2f2; }

  .month {
    margin-top: 1000px;
  }

  .chart-section {
    margin-bottom: 40px;
    page-break-inside: avoid;
  }

  .chart-section h3 {
    margin-bottom: 10px;
  }

  svg {
    width: 100% !important;
    height: 300px !important;
    display: block;
  }
</style>
        </head>
        <body>

          <h1>Admin Summary Report</h1>

          <h2>General Statistics</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Users</td><td>${summary.total_users}</td></tr>
            <tr><td>Total Donations</td><td>${summary.total_donations}</td></tr>
            <tr><td>Unfulfilled Requests</td><td>${
              summary.unfulfilled_requests
            }</td></tr>
            <tr><td>Total Hospitals</td><td>${summary.total_hospitals}</td></tr>
          </table>

          <h2>Blood Stock by Region</h2>
<table>
  <tr>
    <th>Region</th>
    ${bloodTypes.map((bt) => `<th>${bt}</th>`).join("")}
    <th>Total</th>
  </tr>

  ${Object.values(pivot)
    .map(
      (row) => `
      <tr>
        <td>${row.region}</td>
        ${bloodTypes
          .map((bt) => `<td ${colorCell(row[bt])}>${row[bt]}</td>`)
          .join("")}
        <td style="font-weight:bold;">${row.total}</td>
      </tr>`,
    )
    .join("")}

  <tr style="background:#f2f2f2;font-weight:bold;">
    <td>Total</td>
    ${bloodTypes.map((bt) => `<td>${columnTotals[bt]}</td>`).join("")}
    <td>${columnTotals.total}</td>
  </tr>
</table>



        <h2>Low Stock Alerts</h2>

<table>
  <tr>
    <th>Hospital</th>
    <th>Blood Type</th>
    <th>Units</th>
  </tr>

  ${Object.entries(lowStockGrouped)
    .map(([hospital, stocks]) =>
      stocks
        .map(
          (s, idx) => `
          <tr>
            ${
              idx === 0
                ? `<td rowspan="${stocks.length}" style="font-weight:bold;">${hospital}</td>`
                : ""
            }
            <td>${s.blood_type}</td>
            <td ${lowColor(s.units_available)}>${s.units_available}</td>
          </tr>`,
        )
        .join(""),
    )
    .join("")}
</table>

<h2>Charts</h2>

<div class="chart-section">
  <h3>Monthly Donation Trend</h3>
  ${donationChart}
</div>

<div class="chart-section">
  <h3>Request Status Distribution</h3>
  ${requestStatusChart}

  <p style="margin-top:10px; font-size:12px;">
    <span ${statusColor("fulfilled")}>● fulfilled</span>
    <span ${statusColor("open")}>● open</span>
    <span ${statusColor("matched")}>● matched</span>
    <span ${statusColor("cancelled")}>● cancelled</span>
  </p>
</div>

<div class="chart-section">
  <h3>Monthly Blood Requests</h3>
  ${requestTrendChart}
</div>

<div class="chart-section">
  <h3>Donations per Blood Center</h3>
  ${donationsHospitalChart}
</div>

<div class="chart-section">
  <h3>Requests per Blood Center</h3>
  ${requestsHospitalChart}
</div>

<div class="chart-section">
  <h3>Blood Stock by Region</h3>
  ${regionStockChart}
</div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
    // win.close(); // optional
  };

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardRes,
        monthlyDonRes,
        monthlyReqRes,
        breakdownRes,
        donHospRes,
        reqHospRes,
        lowStockRes,
        regionStockRes,
      ] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get("/api/admin/donations/monthly"),
        api.get("/api/admin/requests/monthly"),
        api.get("/api/admin/requests/breakdown"),
        api.get("/api/admin/performance/donations"),
        api.get("/api/admin/performance/requests"),
        api.get("/api/admin/performance/low-stock"),
        api.get("/api/admin/stocks/regions"),
      ]);

      const dashboard = dashboardRes.data || {};
      const donationsMonthly = monthlyDonRes.data || [];
      const requestsMonthly = monthlyReqRes.data || [];
      const breakdown = breakdownRes.data || [];
      const donationsHosp = donHospRes.data?.hospitals || [];
      const requestsHosp = reqHospRes.data?.hospitals || [];
      const lowStockData = lowStockRes.data?.low_stock || [];

      // Summary (derive total_hospitals from hospital performance)
      setSummary({
        total_users: dashboard.total_users || 0,
        total_donations: dashboard.total_donations || 0,
        unfulfilled_requests: dashboard.unfulfilled_requests || 0,
        total_hospitals: donationsHosp.length || 0,
      });

      // Format monthly trends
      setDonationTrend(
        donationsMonthly.map((r) => ({
          month: new Date(r.month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: Number(r.count),
        })),
      );

      setRequestTrend(
        requestsMonthly.map((r) => ({
          month: new Date(r.month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: Number(r.count),
        })),
      );

      console.log("BREAKDOWN RAW:", breakdown);

      // Request breakdown
      setRequestBreakdown(
        breakdown
          .filter((r) => r.status !== null && r.status !== "") // ⬅ remove NULL
          .map((r) => ({
            name: r.status.toLowerCase(),
            value: Number(r.count),
          })),
      );

      // Per-hospital charts
      setDonPerHospital(
        donationsHosp.map((h) => ({
          name: h.hospital_name,
          count: Number(h.total_donations),
        })),
      );

      setReqPerHospital(
        requestsHosp.map((h) => ({
          name: h.hospital_name,
          count: Number(h.total_requests),
        })),
      );

      // Low stock alerts
      setLowStock(lowStockData);

      setRegionStock(
        regionStockRes.data.region_stock.map((r) => ({
          region: r.region,
          blood_type: r.blood_type,
          units: Number(r.total_units),
        })),
      );
    } catch (err) {
      console.error("[Admin Dashboard Error]", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-card animate-pulse rounded-xl border border-border"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 bg-card animate-pulse rounded-xl border border-border"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/20">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  Error loading dashboard
                </p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <button
                  onClick={fetchAll}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div id="report-content">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Blood donation management overview
            </p>
          </div>
          <Button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            Print Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Users"
            value={summary.total_users}
            icon={Users}
            color={CHART_COLORS.secondary}
          />
          <SummaryCard
            title="Total Donations"
            value={summary.total_donations}
            icon={Gift}
            color={CHART_COLORS.primary}
          />
          <SummaryCard
            title="Unfulfilled Requests"
            value={summary.unfulfilled_requests}
            icon={AlertTriangle}
            color={CHART_COLORS.danger}
          />
          <SummaryCard
            title="Partner Hospitals"
            value={summary.total_hospitals}
            icon={Building2}
            color={CHART_COLORS.yellow}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donation Trend - Takes 2 columns */}
          <ChartCard
            title="Monthly Donation Trend"
            subtitle="Last months performance"
            className="lg:col-span-2"
          >
            <div id="chart-donation-trend" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationTrend}>
                  <defs>
                    <linearGradient
                      id="donationGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    fill="url(#donationGradient)"
                    name="Donations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Request Breakdown Pie */}
          <ChartCard title="Request Status" subtitle="Distribution by status">
            <div id="chart-request-status" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestBreakdown}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {requestBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          STATUS_COLORS[(entry.name || "").toLowerCase()] ||
                          "#94a3b8"
                        }
                        stroke="transparent"
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    formatter={(value) => (
                      <span className="text-muted-foreground text-xs">
                        {value.toLowerCase()}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Blood Requests Trend */}
          <ChartCard
            title="Monthly Blood Requests"
            subtitle="Request volume trend"
          >
            <div id="chart-request-trend" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                    name="Requests"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Donations Per Hospital */}
          <ChartCard
            title="Donations per Blood Center"
            subtitle="Top performing Blood Centers"
          >
            <div id="chart-donations-hospital" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donPerHospital} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    name="Donations"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Requests Per Hospital */}
          <ChartCard
            title="Requests per Blood Center"
            subtitle="Demand distribution"
          >
            <div id="chart-requests-hospital" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reqPerHospital} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.warning}
                    radius={[0, 4, 4, 0]}
                    name="Requests"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Region Stock Chart */}
        <ChartCard
          title="Blood Stock by Region"
          subtitle="Total units available per region"
        >
          <div id="chart-region-stock" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.values(
                  regionStock.reduce((acc, cur) => {
                    if (!acc[cur.region])
                      acc[cur.region] = { region: cur.region };
                    acc[cur.region][cur.blood_type] = cur.units;
                    return acc;
                  }, {}),
                )}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="region" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />

                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                  (type) => (
                    <Bar key={type} dataKey={type} stackId="stock">
                      {Object.values(
                        regionStock.reduce((acc, cur) => {
                          if (!acc[cur.region])
                            acc[cur.region] = { region: cur.region };
                          acc[cur.region][cur.blood_type] = cur.units;
                          return acc;
                        }, {}),
                      ).map((row, idx) => (
                        <Cell
                          key={idx}
                          fill={REGION_COLORS[row.region] || "#94a3b8"} // fallback color
                        />
                      ))}
                    </Bar>
                  ),
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Low Stock Section with Hospital Dropdown */}
        <LowStockSection lowStock={lowStock} />
      </div>
    </div>
  );
}
