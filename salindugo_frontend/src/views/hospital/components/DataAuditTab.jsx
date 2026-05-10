import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  History,
  RefreshCcw,
  Undo2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  UserCircle2,
  Calendar,
  X,
  Search,
  Filter,
  Loader2,
} from "lucide-react";

function StatCard({ title, value, description, icon: Icon, tone = "neutral" }) {
  const toneStyles = {
    neutral: "border-border bg-card text-foreground",
    red: "border-primary/20 bg-primary/5 text-primary",
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-yellow-200 bg-yellow-50 text-yellow-700",
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
        <div className="text-2xl font-bold tracking-tight text-foreground">
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

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BatchDetailModal({ batchId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/import/batches/${batchId}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled)
          setError(err.response?.data?.message || "Failed to load batch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border bg-background/70 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Import Batch Details
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Rows inserted by this Excel/CSV upload.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Uploaded by
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {data.batch.uploaded_by_name || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    File
                  </p>
                  <p
                    className="mt-1 truncate font-mono text-xs text-foreground"
                    title={data.batch.filename}
                  >
                    {data.batch.filename || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Rows
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {data.batch.row_count}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Date range
                  </p>
                  <p className="mt-1 text-xs text-foreground">
                    {formatDate(data.batch.date_min)} →{" "}
                    {formatDate(data.batch.date_max)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-background">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Blood Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Units
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr
                        key={r.request_id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 text-foreground">
                          {formatDate(r.request_date)}
                        </td>
                        <td className="px-3 py-2 font-mono text-foreground">
                          {r.blood_type}
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {r.units_needed}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.rows.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No rows found for this batch.
                  </p>
                )}
                {data.batch.row_count > data.rows.length && (
                  <p className="border-t border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                    Showing first {data.rows.length} of {data.batch.row_count}{" "}
                    rows.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmRevertModal({ batch, onCancel, onConfirm, busy }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border bg-destructive/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
              <Undo2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Revert this upload?
              </h3>
              <p className="text-sm text-muted-foreground">
                This permanently removes the inserted rows.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 px-6 py-4 text-sm">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Uploaded by
            </p>
            <p className="font-semibold text-foreground">
              {batch.uploaded_by_name || "—"} •{" "}
              {formatDateTime(batch.created_at)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {batch.row_count} rows • covering {formatDate(batch.date_min)} →{" "}
              {formatDate(batch.date_max)}
            </p>
          </div>
          <p className="text-muted-foreground">
            All <b>{batch.row_count}</b> request rows from this upload will be
            deleted from the database. This cannot be undone — you'll need to
            re-import the file if you change your mind.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-background/70 px-6 py-3">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={busy}
            className="gap-2"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
            Revert upload
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DataAuditTab() {
  const [batches, setBatches] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [viewBatchId, setViewBatchId] = useState(null);
  const [revertTarget, setRevertTarget] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [batchesRes, statusRes] = await Promise.all([
        api.get("/api/import/batches"),
        api.get("/api/import/today-status"),
      ]);
      setBatches(batchesRes.data.batches || []);
      setTodayStatus(statusRes.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    let data = [...batches];
    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter((b) => {
        const name = (b.uploaded_by_name || "").toLowerCase();
        const file = (b.filename || "").toLowerCase();
        return name.includes(term) || file.includes(term);
      });
    }
    if (dateFilter) {
      data = data.filter((b) => {
        const day = new Date(b.created_at).toISOString().slice(0, 10);
        return day === dateFilter;
      });
    }
    return data;
  }, [batches, search, dateFilter]);

  const stats = useMemo(() => {
    const totalRows = batches.reduce((s, b) => s + (b.row_count || 0), 0);
    const uniquePeople = new Set(
      batches.map((b) => b.uploaded_by_name).filter(Boolean),
    ).size;
    return {
      totalBatches: batches.length,
      totalRows,
      uniquePeople,
      lastUpload: batches[0]?.created_at || null,
    };
  }, [batches]);

  const handleRevert = async () => {
    if (!revertTarget) return;
    try {
      setReverting(true);
      const res = await api.delete(
        `/api/import/batches/${revertTarget.batch_id}`,
      );
      setToast({
        type: "success",
        message: `Reverted: ${res.data.rows_removed} rows removed.`,
      });
      setRevertTarget(null);
      fetchAll();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to revert batch",
      });
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="w-full space-y-6 bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)] p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="rounded-md border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <History className="h-6 w-6" />
            </div>
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                Trace & Revert
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Data Audit
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Every Excel/CSV upload is recorded here. Use this before
                inserting data — especially during shift changes — to avoid
                duplicate uploads, and revert any batch if something was added
                by mistake.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchAll} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* TODAY STATUS */}
      {todayStatus && todayStatus.uploaded_today ? (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Today's data is in.</span>{" "}
            {todayStatus.today_batches.length} upload
            {todayStatus.today_batches.length === 1 ? "" : "s"} today — most
            recent by{" "}
            <b>
              {todayStatus.today_batches[0].uploaded_by_name || "someone"}
            </b>{" "}
            at {formatDateTime(todayStatus.today_batches[0].created_at)}.
          </AlertDescription>
        </Alert>
      ) : todayStatus ? (
        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">No upload yet today.</span>{" "}
            {todayStatus.latest_batch
              ? `Last upload: ${
                  todayStatus.latest_batch.uploaded_by_name || "someone"
                } on ${formatDateTime(todayStatus.latest_batch.created_at)}.`
              : "No previous uploads on record."}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Uploads"
          value={stats.totalBatches}
          description="All-time imported batches"
          icon={FileSpreadsheet}
          tone="red"
        />
        <StatCard
          title="Total Rows"
          value={stats.totalRows.toLocaleString()}
          description="Across every batch"
          icon={History}
        />
        <StatCard
          title="Unique Personnel"
          value={stats.uniquePeople}
          description="Distinct uploaders on record"
          icon={UserCircle2}
          tone="green"
        />
        <StatCard
          title="Last Upload"
          value={
            stats.lastUpload
              ? new Date(stats.lastUpload).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          description={
            stats.lastUpload
              ? new Date(stats.lastUpload).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "No uploads yet"
          }
          icon={Clock}
          tone="amber"
        />
      </div>

      {/* TOAST */}
      {toast && (
        <Alert
          className={
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{toast.message}</AlertDescription>
        </Alert>
      )}

      {/* MAIN TABLE */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Import History
              </CardTitle>
              <CardDescription>
                Each row is one Excel/CSV upload. Click View to see the rows it
                inserted, or Revert to remove them.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="rounded-md border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              {(search || dateFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setDateFilter("");
                  }}
                  className="h-7 gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or filename..."
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {error && (
            <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      When
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Uploaded by
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      File
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rows
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date range
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {batches.length === 0
                            ? "No uploads yet — import your first file from the Import Data tab."
                            : "No batches match your filters."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => (
                      <tr
                        key={b.batch_id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-3">
                          <div className="text-foreground">
                            {formatDate(b.created_at)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(b.created_at).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {(b.uploaded_by_name || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-foreground">
                              {b.uploaded_by_name || (
                                <span className="italic text-muted-foreground">
                                  unspecified
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td
                          className="max-w-[180px] truncate px-3 py-3 font-mono text-xs text-muted-foreground"
                          title={b.filename}
                        >
                          {b.filename || "—"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {b.row_count}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {formatDate(b.date_min)} →{" "}
                          {formatDate(b.date_max)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewBatchId(b.batch_id)}
                              className="h-8 gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRevertTarget(b)}
                              className="h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Revert
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {batches.length} batches.
          </p>
        </CardContent>
      </Card>

      {viewBatchId && (
        <BatchDetailModal
          batchId={viewBatchId}
          onClose={() => setViewBatchId(null)}
        />
      )}
      {revertTarget && (
        <ConfirmRevertModal
          batch={revertTarget}
          busy={reverting}
          onCancel={() => (reverting ? null : setRevertTarget(null))}
          onConfirm={handleRevert}
        />
      )}
    </div>
  );
}
