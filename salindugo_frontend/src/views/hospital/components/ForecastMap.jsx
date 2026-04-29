import { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ---------------------------
   LEAFLET ICON FIX
---------------------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ---------------------------
   RISK CONFIG (UNCHANGED)
---------------------------- */
const RISK_CONFIG = {
  critical: {
    color: "#dc2626",
    bgColor: "#fee2e2",
    darkColor: "#7f1d1d",
    icon: AlertCircle,
    label: "Critical",
    description: "Demand exceeds stock",
  },
  warning: {
    color: "#ea580c",
    bgColor: "#fed7aa",
    darkColor: "#7c2d12",
    icon: AlertTriangle,
    label: "Warning",
    description: "High pressure (60-100%)",
  },
  safe: {
    color: "#16a34a",
    bgColor: "#dcfce7",
    darkColor: "#15803d",
    icon: CheckCircle2,
    label: "Safe",
    description: "Stock available",
  },
};

/* ---------------------------
   AUTO ZOOM COMPONENT
---------------------------- */
function AutoZoom({ hospitals }) {
  const map = useMap();

  useEffect(() => {
    if (!hospitals.length) return;

    const priority =
      hospitals.filter((h) => h.risk_level === "critical").length > 0
        ? hospitals.filter((h) => h.risk_level === "critical")
        : hospitals.filter((h) => h.risk_level === "warning").length > 0
          ? hospitals.filter((h) => h.risk_level === "warning")
          : hospitals;

    const bounds = L.latLngBounds(
      priority.map((h) => [h.latitude, h.longitude]),
    );

    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
  }, [hospitals, map]);

  return null;
}

/* ---------------------------
   MARKER SIZE BY URGENCY
---------------------------- */
const getMarkerRadius = (daysCover, isHovered) => {
  let base = 10;

  if (daysCover <= 3) base = 18;
  else if (daysCover <= 7) base = 14;
  else base = 10;

  return isHovered ? base + 4 : base;
};

export default function MedicalSystemMap() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ critical: 0, warning: 0, safe: 0 });
  const [hoveredHospital, setHoveredHospital] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ITEMS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/forecast-map`,
      );

      setHospitals(response.data);
      calculateStats(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load hospital data. Please ensure the backend is running.",
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    const s = { critical: 0, warning: 0, safe: 0 };
    data.forEach((h) => s[h.risk_level]++);
    setStats(s);
  };

  /* ---------------------------
     FILTER (NOW USES BACKEND RISK)
  ---------------------------- */
  const filteredHospitals = hospitals.filter((h) => {
    const matchesRisk =
      selectedRiskLevel === "all" || h.risk_level === selectedRiskLevel;

    const matchesSearch = h.hospital_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const totalPages = Math.ceil(filteredHospitals.length / ITEMS_PER_PAGE);

  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRiskLevel]);

  /* ---------------------------
     LOADING UI (UNCHANGED)
  ---------------------------- */
  if (loading && hospitals.length === 0) {
    return (
      <div className="flex min-h-[620px] w-full items-center justify-center rounded-md border border-border bg-card">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="h-6 w-6 text-primary" />
          <span className="text-sm">Loading forecast map...</span>
        </div>
      </div>
    );
  }

  const StatCard = ({ level, count }) => {
    const config = RISK_CONFIG[level];
    const IconComponent = config.icon;

    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="rounded-md border p-2.5"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <IconComponent
                className="h-5 w-5"
                style={{ color: config.color }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {config.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {count}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mt-5 flex min-h-[760px] w-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border bg-background/70">
        <div className="px-5 py-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/10">
                  Regional Forecast View
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Forecast Map
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Real-time demand pressure and stock coverage by facility.
                </p>
              </div>
            </div>
            <Button
              onClick={fetchData}
              disabled={isRefreshing}
              variant="outline"
              className="gap-2 self-start"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard level="critical" count={stats.critical} />
            <StatCard level="warning" count={stats.warning} />
            <StatCard level="safe" count={stats.safe} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 bg-muted/25 p-4 xl:flex-row">
        {/* Sidebar */}
        <div className="flex min-h-[460px] flex-shrink-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm xl:w-80">
          <Tabs defaultValue="search" className="w-full h-full flex flex-col">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b border-border bg-muted/50 p-1">
              <TabsTrigger
                value="search"
                className="rounded-md py-2.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Search
              </TabsTrigger>
              <TabsTrigger
                value="filter"
                className="rounded-md py-2.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Filter
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="search"
              className="flex-1 min-h-0 flex flex-col overflow-hidden p-0"
            >
              <div className="flex-shrink-0 border-b border-border p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search hospitals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 w-full [&>div]:!block [&>div]:w-full">
                <div className="p-4 space-y-3 w-full">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Facilities ({filteredHospitals.length})
                  </p>

                  {paginatedHospitals.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border bg-muted/30 py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No facilities match your search
                      </p>
                    </div>
                  ) : (
                    paginatedHospitals.map((h) => {
                      const ratio =
                        h.current_stock === 0
                          ? "∞"
                          : (
                              h.total_predicted_demand / h.current_stock
                            ).toFixed(2);

                      const level = h.risk_level;

                      const config = RISK_CONFIG[level];

                      return (
                        <div
                          key={h.hospital_id}
                          onMouseEnter={() => setHoveredHospital(h.hospital_id)}
                          onMouseLeave={() => setHoveredHospital(null)}
                          className="w-full cursor-pointer rounded-md border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="flex items-start gap-2 mb-2 w-full">
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                              {h.hospital_name}
                            </p>

                            <Badge
                              variant="outline"
                              className="flex-shrink-0 whitespace-nowrap bg-card"
                              style={{
                                borderColor: config.color,
                                color: config.color,
                              }}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md bg-muted/45 px-2 py-2">
                              <p className="font-medium text-muted-foreground">
                                Stock
                              </p>
                              <p className="font-semibold text-foreground">
                                {h.current_stock}
                              </p>
                            </div>

                            <div className="rounded-md bg-muted/45 px-2 py-2">
                              <p className="font-medium text-muted-foreground">
                                Days Cover
                              </p>
                              <p
                                className="font-semibold"
                                style={{ color: config.color }}
                              >
                                {h.days_cover == null
                                  ? "No forecasted demand"
                                  : `${h.days_cover} days`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              {/* PAGINATION */}
              {totalPages > 1 && (
                <Pagination className="p-5">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>

            <TabsContent
              value="filter"
              className="flex-1 flex flex-col overflow-hidden p-0"
            >
              <div className="flex-shrink-0 border-b border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Filter by Status
                </p>
              </div>

              <div className="flex-1 p-4 space-y-2">
                {[
                  { value: "all", label: "All Facilities", config: null },
                  {
                    value: "critical",
                    label: "Critical",
                    config: RISK_CONFIG.critical,
                  },
                  {
                    value: "warning",
                    label: "Warning",
                    config: RISK_CONFIG.warning,
                  },
                  { value: "safe", label: "Safe", config: RISK_CONFIG.safe },
                ].map((option) => {
                  const isSelected = selectedRiskLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRiskLevel(option.value)}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {option.config && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.config.color }}
                        />
                      )}
                      {option.label}
                      {option.value !== "all" && (
                        <span className="ml-auto text-xs font-normal text-muted-foreground">
                          {option.value === "critical"
                            ? stats.critical
                            : option.value === "warning"
                              ? stats.warning
                              : stats.safe}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-shrink-0 border-t border-border p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Legend
                </p>
                <div className="space-y-2.5">
                  {Object.entries(RISK_CONFIG).map(([key, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <div key={key} className="flex items-start gap-3">
                        <div
                          className="p-1.5 rounded-md flex-shrink-0"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          <IconComponent
                            className="w-4 h-4"
                            style={{ color: config.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {config.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* MAP CONTAINER */}
        <div className="relative min-h-[560px] flex-1 overflow-hidden rounded-md border border-border bg-card shadow-sm">
          {error ? (
            <div className="flex h-full w-full items-center justify-center bg-destructive/5 p-8 text-center">
              <div>
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                <p className="font-medium text-destructive">{error}</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[14.5995, 120.9842]}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <AutoZoom hospitals={filteredHospitals} />

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {filteredHospitals.map((h) => {
                const isHovered = hoveredHospital === h.hospital_id;
                const config = RISK_CONFIG[h.risk_level];

                const radius = getMarkerRadius(
                  Number(h.days_cover ?? 30),
                  isHovered,
                );

                const isCritical = h.risk_level === "critical";

                return (
                  <CircleMarker
                    key={h.hospital_id}
                    center={[h.latitude, h.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: config.color,
                      fillColor: config.color,
                      fillOpacity: isHovered ? 0.95 : 0.8,
                      weight: isHovered ? 3 : 2,
                      className: isCritical ? "pulse-marker" : "",
                    }}
                  >
                    <Popup className="forecast-map-popup">
                      <div className="min-w-52 py-1">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h4 className="max-w-48 text-sm font-semibold text-foreground">
                          {h.hospital_name}
                          </h4>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: config.color,
                              color: config.color,
                            }}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-muted px-2 py-2">
                            <p className="text-muted-foreground">
                              Current Stock
                            </p>
                            <p className="font-semibold text-foreground">
                              {h.current_stock}
                            </p>
                          </div>
                          <div className="rounded-md bg-muted px-2 py-2">
                            <p className="text-muted-foreground">
                              30-Day Demand
                            </p>
                            <p className="font-semibold text-foreground">
                              {h.total_predicted_demand}
                            </p>
                          </div>
                          <div className="col-span-2 rounded-md bg-muted px-2 py-2">
                            <p className="text-muted-foreground">
                              Days Cover
                            </p>
                            <p
                              className="font-semibold"
                              style={{ color: config.color }}
                            >
                              {h.days_cover == null
                                ? "No forecasted demand"
                                : `${h.days_cover} days`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
