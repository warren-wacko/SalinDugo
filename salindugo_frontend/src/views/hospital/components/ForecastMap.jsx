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
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Spinner className="mx-auto h-12 w-12" />
      </div>
    );
  }

  const StatCard = ({ level, count }) => {
    const config = RISK_CONFIG[level];
    const IconComponent = config.icon;

    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <IconComponent
                className="w-6 h-6"
                style={{ color: config.color }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 font-medium">
                {config.label}
              </p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-1">
                {config.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full min-h-[700px] bg-slate-50 flex flex-col mt-5">
      {/* Header */}
      <div className="border-0 bg-gradient-to-br from-card/95 to-card/80 shadow-md transition-all hover:shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-8 h-8 text-red-600" />
                Forecast Map
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Real-time demand forecast and inventory analysis
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard level="critical" count={stats.critical} />
            <StatCard level="warning" count={stats.warning} />
            <StatCard level="safe" count={stats.safe} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden gap-4 p-4">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <Tabs defaultValue="search" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 border-0 rounded-none border-b border-slate-200 bg-slate-50 p-0 h-auto">
              <TabsTrigger
                value="search"
                className="rounded-none py-3 text-xs font-medium"
              >
                Search
              </TabsTrigger>
              <TabsTrigger
                value="filter"
                className="rounded-none py-3 text-xs font-medium"
              >
                Filter
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="search"
              className="flex-1 min-h-0 flex flex-col overflow-hidden p-0"
            >
              <div className="p-4 border-b border-slate-100 flex-shrink-0">
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
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                    Facilities ({filteredHospitals.length})
                  </p>

                  {paginatedHospitals.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">
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
                          className="w-full p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-start gap-2 mb-2 w-full">
                            <p className="text-sm font-semibold text-slate-900 flex-1 min-w-0 truncate">
                              {h.hospital_name}
                            </p>

                            <Badge
                              variant="outline"
                              className="flex-shrink-0 whitespace-nowrap"
                              style={{
                                borderColor: config.color,
                                color: config.color,
                              }}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500 font-medium">
                                Stock
                              </p>
                              <p className="text-slate-900 font-semibold">
                                {h.current_stock}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-500 font-medium">
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
              <div className="p-4 border-b border-slate-100 flex-shrink-0">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
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
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-700 border border-slate-200 hover:bg-slate-50"
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
                        <span className="ml-auto text-xs text-slate-500 font-normal">
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

              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
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
                          <p className="text-sm font-medium text-slate-900">
                            {config.label}
                          </p>
                          <p className="text-xs text-slate-500">
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
        <div className="flex-1 rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
          {error ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <p>{error}</p>
            </div>
          ) : (
            <MapContainer
              center={[14.5995, 120.9842]}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
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
                    <Popup>
                      <div className="min-w-max py-2">
                        <h4 className="font-semibold mb-2">
                          {h.hospital_name}
                        </h4>
                        <p>Current Stock: {h.current_stock}</p>
                        <p>30-Day Demand: {h.total_predicted_demand}</p>
                        <p>
                          Days Cover:{" "}
                          {h.days_cover == null
                            ? "No forecasted demand"
                            : `${h.days_cover} days`}
                        </p>
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
