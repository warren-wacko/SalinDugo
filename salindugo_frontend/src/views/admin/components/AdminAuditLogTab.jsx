import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  Calendar,
  Activity,
  Shield,
  Package,
  FileText,
  Heart,
  Filter,
  X,
} from "lucide-react";

const ACTION_TYPE_CONFIG = {
  admin: {
    color: "bg-primary/20 text-primary border-primary/30",
    icon: Shield,
  },
  inventory: {
    color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    icon: Package,
  },
  request: {
    color: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    icon: FileText,
  },
  schedule: {
    color: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    icon: Activity,
  },
  donation: {
    color: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    icon: Heart,
  },
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ActionTypeBadge({ type }) {
  const config = ACTION_TYPE_CONFIG[type] || {
    color: "bg-muted text-muted-foreground border-border",
    icon: Activity,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {type || "unknown"}
    </span>
  );
}

function DetailsCell({ details }) {
  const [expanded, setExpanded] = useState(false);
  const detailsStr =
    typeof details === "string"
      ? details
      : JSON.stringify(details ?? {}, null, 2);
  const isLong = detailsStr.length > 100;

  return (
    <div className="max-w-xs">
      <pre
        className={`bg-background border border-border p-2 rounded-lg text-xs text-muted-foreground whitespace-pre-wrap overflow-hidden ${
          !expanded && isLong ? "max-h-16" : ""
        }`}
      >
        {detailsStr}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:text-primary/80 mt-1"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export default function AdminAuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState(""); // name + action + action_type
  const [actionType, setActionType] = useState("all");
  const [date, setDate] = useState(""); // single date selector (YYYY-MM-DD)

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/audit-logs");
      setLogs(response.data.logs || []);
      setPage(1);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derived filters (reactive – no Apply button)
  const filtered = useMemo(() => {
    let data = [...logs];

    // 🔍 Search: full_name + action + action_type
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((log) => {
        const name = (log.full_name || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        const type = (log.action_type || "").toLowerCase();
        return (
          name.includes(term) || action.includes(term) || type.includes(term)
        );
      });
    }

    // 🎯 Action type filter
    if (actionType !== "all") {
      data = data.filter((log) => log.action_type === actionType);
    }

    // 📅 Single date filter (exact day)
    if (date) {
      data = data.filter((log) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
        return logDate === date;
      });
    }

    return data;
  }, [logs, searchTerm, actionType, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const currentPageData = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage]
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setActionType("all");
    setDate("");
    setPage(1);
  };

  // Stats from ALL logs (unfiltered)
  const stats = useMemo(
    () => ({
      total: logs.length,
      admin: logs.filter((l) => l.action_type === "admin").length,
      inventory: logs.filter((l) => l.action_type === "inventory").length,
      request: logs.filter((l) => l.action_type === "request").length,
      donation: logs.filter((l) => l.action_type === "donation").length,
    }),
    [logs]
  );

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Logs"
          value={stats.total}
          icon={Activity}
          color="bg-chart-2/20 text-chart-2"
        />
        <StatCard
          title="Admin Actions"
          value={stats.admin}
          icon={Shield}
          color="bg-primary/20 text-primary"
        />
        <StatCard
          title="Inventory"
          value={stats.inventory}
          icon={Package}
          color="bg-chart-2/20 text-chart-2"
        />
        <StatCard
          title="Requests"
          value={stats.request}
          icon={FileText}
          color="bg-chart-3/20 text-chart-3"
        />
        <StatCard
          title="Donations"
          value={stats.donation}
          icon={Heart}
          color="bg-chart-1/20 text-chart-1"
        />
      </div>

      {/* Main Card */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-chart-2" />
              Audit Logs
            </CardTitle>
            <Button
              variant="outline"
              onClick={fetchLogs}
              className="bg-background border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Filters */}
          <div className="bg-background border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Filter className="w-4 h-4" />
                Filters
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Search (name + action + action_type) */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by user name, action, or type..."
                  className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Action Type */}
              <Select
                value={actionType}
                onValueChange={(value) => {
                  setActionType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>

              {/* Single Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 bg-card border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="p-4 text-left text-muted-foreground font-medium">
                      Timestamp
                    </th>
                    <th className="p-4 text-left text-muted-foreground font-medium">
                      User
                    </th>
                    <th className="p-4 text-left text-muted-foreground font-medium">
                      Action
                    </th>
                    <th className="p-4 text-left text-muted-foreground font-medium">
                      Type
                    </th>
                    <th className="p-4 text-left text-muted-foreground font-medium">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-12">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No logs found</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentPageData.map((log) => (
                      <tr
                        key={log.log_id}
                        className="border-b border-border hover:bg-background/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="text-foreground text-sm">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleDateString()
                              : "-"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleTimeString()
                              : ""}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground text-xs font-medium">
                              {(log.full_name || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-foreground font-medium">
                                {log.full_name || "Unknown User"}
                              </div>
                              {log.email && (
                                <div className="text-muted-foreground text-xs">
                                  {log.email}
                                </div>
                              )}
                              {log.role && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-chart-2/20 text-chart-2 text-xs rounded-full capitalize">
                                  {log.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-foreground font-medium">
                            {log.action}
                          </span>
                        </td>

                        <td className="p-4">
                          <ActionTypeBadge type={log.action_type} />
                        </td>

                        <td className="p-4">
                          <DetailsCell details={log.details} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filtered.length)} of{" "}
              {filtered.length} logs
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-transparent border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="bg-transparent border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
