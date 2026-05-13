import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api/axios";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Table2,
  Upload,
  Clock,
  UserCircle2,
  X,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ImportData({ onSwitchToAudit }) {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadedBy, setUploadedBy] = useState(
    () => sessionStorage.getItem("salindugo_uploaded_by") || "",
  );
  const [todayStatus, setTodayStatus] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [overlapConflicts, setOverlapConflicts] = useState(null);
  const fileInputRef = useRef(null);

  // Constants specific to Blood Requests
  const REQUIRED_COLUMNS = [
    "request_date",
    "blood_type",
    "units_needed",
    "status",
  ];

  const fetchTodayStatus = async () => {
    try {
      // Pass the browser's timezone so "today" is computed in the user's
      // local time (not the server's UTC), otherwise an upload made at
      // 2 AM Manila time looks like "yesterday" to the server.
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.get(
        `/api/import/today-status?tz=${encodeURIComponent(tz)}`,
      );
      setTodayStatus(res.data);
    } catch (err) {
      // Silent — status banner is informational, not critical
      setTodayStatus(null);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handleFileChange = async (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setError("");
    setSuccess(false);

    try {
      const text = await selected.text();
      const rows = text.split("\n").slice(0, 6);
      setPreview(rows.filter((row) => row.trim()));
    } catch (err) {
      setPreview([]);
    }
  };

  const handleDownloadTemplate = () => {
    const csv =
      "request_date,blood_type,units_needed,status\n" +
      "2026-03-01,O+,3,fulfilled\n" +
      "2026-03-02,A+,2,fulfilled\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blood-requests-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // First step: validate inputs, then open the confirmation modal.
  // The actual POST happens in performUpload once the user confirms.
  const handleUploadClick = () => {
    setError("");
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    if (!uploadedBy.trim()) {
      setError("Please enter your name so we can trace this upload");
      return;
    }
    setShowConfirmModal(true);
  };

  const performUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", uploadedBy.trim());

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      await api.post(`/api/import/requests`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      sessionStorage.setItem("salindugo_uploaded_by", uploadedBy.trim());
      setSuccess(true);
      setFile(null);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowConfirmModal(false);
      fetchTodayStatus();
    } catch (err) {
      // Special handling: 409 with date-overlap details opens the overlap
      // modal instead of dropping into the generic error alert.
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 409 &&
        err.response?.data?.code === "DATE_OVERLAP"
      ) {
        setOverlapConflicts(err.response.data.conflicts || []);
        setShowConfirmModal(false);
      } else {
        setError(
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Upload failed. Please check your file and try again.",
        );
        setShowConfirmModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)]sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="space-y-6">
            <div className="rounded-md border border-border bg-card px-6 py-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                    Data Intake
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Import Blood Requests
                  </h1>
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    Upload request records to update your dashboard's historical
                    data and forecasting context.
                  </p>
                </div>
              </div>
            </div>

            {/* SHIFT-CHANGE STATUS BANNER */}
            {todayStatus && todayStatus.uploaded_today ? (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">
                    Data already uploaded today.
                  </span>{" "}
                  {todayStatus.today_batches.length} upload
                  {todayStatus.today_batches.length === 1 ? "" : "s"} so far —
                  latest by{" "}
                  <b>
                    {todayStatus.today_batches[0].uploaded_by_name ||
                      "someone"}
                  </b>{" "}
                  at {formatTime(todayStatus.today_batches[0].created_at)} (
                  {todayStatus.today_batches[0].row_count} rows). Check the{" "}
                  <i>Data Audit</i> tab before uploading again.
                </AlertDescription>
              </Alert>
            ) : todayStatus ? (
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">
                    No upload yet today.
                  </span>{" "}
                  {todayStatus.latest_batch ? (
                    <>
                      Last upload was by{" "}
                      <b>
                        {todayStatus.latest_batch.uploaded_by_name ||
                          "someone"}
                      </b>{" "}
                      on {formatTime(todayStatus.latest_batch.created_at)}.
                    </>
                  ) : (
                    <>No previous uploads found.</>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border bg-background/70">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle>Blood Requests</CardTitle>
                    <CardDescription className="mt-1">
                      Use this for fulfilled or tracked blood request activity.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Required columns
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {REQUIRED_COLUMNS.map((column) => (
                        <Badge
                          key={column}
                          variant="outline"
                          className="bg-card font-mono text-[11px]"
                        >
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">
                      File rules
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        CSV or XLSX format
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        Dates use YYYY-MM-DD
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        Standard blood types (e.g., A+, O-)
                      </li>
                    </ul>
                  </div>
                </div>

                {/* UPLOADED BY — required for trace */}
                <div className="rounded-md border border-border bg-background p-4">
                  <label
                    htmlFor="uploaded_by"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <UserCircle2 className="h-4 w-4 text-primary" />
                    Your name (for trace)
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Since the hospital account is shared, your name is recorded
                    with this upload so other personnel can see who added it.
                  </p>
                  <Input
                    id="uploaded_by"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    placeholder="e.g., Maria Santos"
                    className="mt-3"
                    maxLength={120}
                  />
                </div>

                <label className="block">
                  <div
                    className={`relative rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                      file
                        ? "border-primary/35 bg-primary/5"
                        : "border-border bg-background hover:border-primary/35 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="mt-4 font-semibold text-foreground">
                      {file ? file.name : "Choose a file to import"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Drop a CSV/XLSX file here or click to browse.
                    </p>
                  </div>
                </label>

                {preview.length > 0 && (
                  <div className="overflow-hidden rounded-md border border-border bg-background">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                      <Table2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        File Preview
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <tbody>
                          {preview.map((row, index) => (
                            <tr
                              key={`${row}-${index}`}
                              className="border-b border-border last:border-b-0"
                            >
                              <td className="w-12 bg-muted/50 px-3 py-2 font-mono text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">
                                {row}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Upload successful. Your dashboard data is ready.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handleUploadClick}
                    disabled={!file || loading || !uploadedBy.trim()}
                    className="h-11 gap-2 sm:min-w-44"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {loading ? "Uploading..." : "Upload Requests Data"}
                  </Button>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="h-11 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Import Checklist</CardTitle>
                <CardDescription>
                  Ensure data accuracy before uploading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Ensure column headers match exactly.
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Keep one header row at the top.
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Remove blank rows before uploading.
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Check the Data Audit tab if you're unsure whether today's
                  data was already uploaded.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmUploadModal
          file={file}
          uploadedBy={uploadedBy.trim()}
          todayStatus={todayStatus}
          loading={loading}
          onCancel={() => !loading && setShowConfirmModal(false)}
          onConfirm={performUpload}
        />
      )}

      {overlapConflicts && (
        <OverlapBlockModal
          conflicts={overlapConflicts}
          onClose={() => setOverlapConflicts(null)}
          onGoToAudit={() => {
            setOverlapConflicts(null);
            if (onSwitchToAudit) onSwitchToAudit();
          }}
        />
      )}
    </div>
  );
}

function ConfirmUploadModal({
  file,
  uploadedBy,
  todayStatus,
  loading,
  onCancel,
  onConfirm,
}) {
  const alreadyUploaded = todayStatus?.uploaded_today === true;
  const latestToday = alreadyUploaded ? todayStatus.today_batches?.[0] : null;

  const fileSizeKB = file ? (file.size / 1024).toFixed(1) : "0";

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic header — color depends on whether already uploaded today */}
        <div
          className={`border-b px-6 py-4 ${
            alreadyUploaded
              ? "border-destructive/30 bg-destructive/5"
              : "border-border bg-background/70"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                alreadyUploaded
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {alreadyUploaded ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <ClipboardCheck className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {alreadyUploaded
                  ? "Data already imported today"
                  : "Confirm first import of the day"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {alreadyUploaded
                  ? "Please double-check before continuing — uploading again may duplicate data."
                  : "No upload has been recorded for today yet. Please verify the details below."}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Strong warning banner when already uploaded today */}
          {alreadyUploaded && latestToday && (
            <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-destructive">
                <span className="font-semibold">
                  {todayStatus.today_batches.length} upload
                  {todayStatus.today_batches.length === 1 ? "" : "s"} already
                  recorded for today.
                </span>
                <br />
                Most recent: <b>{latestToday.uploaded_by_name || "someone"}</b>
                {" "}at {formatTime(latestToday.created_at)} —{" "}
                {latestToday.row_count} rows. If this is the same data,
                continuing will create duplicate request records.
              </AlertDescription>
            </Alert>
          )}

          {/* What you're about to upload */}
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              You are about to upload
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">File</span>
                <span
                  className="max-w-[60%] truncate font-mono text-foreground"
                  title={file?.name}
                >
                  {file?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Size</span>
                <span className="text-foreground">{fileSizeKB} KB</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Uploading as</span>
                <span className="font-semibold text-foreground">
                  {uploadedBy || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Friendly checklist */}
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Before continuing, confirm
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                The file covers the correct date range.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                Blood types and units look right.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {alreadyUploaded
                  ? "This is NOT the same file someone uploaded earlier today."
                  : "No one else has uploaded today (check the banner above)."}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-background/70 px-6 py-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={alreadyUploaded ? "destructive" : "default"}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading
              ? "Uploading..."
              : alreadyUploaded
                ? "Upload anyway"
                : "Confirm upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Group sorted YYYY-MM-DD strings into contiguous ranges so the modal can
// render "Mar 1 – Mar 31 (31 days)" instead of 31 separate rows.
function groupConsecutiveDates(conflicts) {
  const sorted = [...conflicts].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  const ranges = [];
  let current = null;

  for (const c of sorted) {
    if (!current) {
      current = {
        start: c.date,
        end: c.date,
        days: 1,
        rows: c.row_count,
      };
      continue;
    }

    // Is c.date exactly one day after current.end?
    const prev = new Date(current.end + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() + 1);
    const expectedNext = prev.toISOString().slice(0, 10);

    if (c.date === expectedNext) {
      current.end = c.date;
      current.days += 1;
      current.rows += c.row_count;
    } else {
      ranges.push(current);
      current = {
        start: c.date,
        end: c.date,
        days: 1,
        rows: c.row_count,
      };
    }
  }
  if (current) ranges.push(current);
  return ranges;
}

function OverlapBlockModal({ conflicts, onClose, onGoToAudit }) {
  const [showAllBatches, setShowAllBatches] = useState(false);

  const formatDate = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const totalRows = conflicts.reduce((s, c) => s + c.row_count, 0);
  const ranges = groupConsecutiveDates(conflicts);

  // Collect unique batches across all conflicts (one date may share a batch
  // with another date, so dedupe by batch_id).
  const uniqueBatches = [];
  const seen = new Set();
  conflicts.forEach((c) => {
    c.batches.forEach((b) => {
      if (!seen.has(b.batch_id)) {
        seen.add(b.batch_id);
        uniqueBatches.push(b);
      }
    });
  });

  const BATCH_PREVIEW_LIMIT = 5;
  const visibleBatches = showAllBatches
    ? uniqueBatches
    : uniqueBatches.slice(0, BATCH_PREVIEW_LIMIT);
  const hiddenBatchCount = uniqueBatches.length - visibleBatches.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-hidden rounded-lg border border-destructive/30 bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-destructive/30 bg-destructive/5 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                Upload blocked — date conflict
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {conflicts.length} date
                {conflicts.length === 1 ? "" : "s"} in this file already have
                data in the system ({totalRows} existing row
                {totalRows === 1 ? "" : "s"}). Re-uploading would duplicate
                that data and bias the forecast.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conflicting date{conflicts.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground">
                {ranges.length === conflicts.length
                  ? `${conflicts.length} date${conflicts.length === 1 ? "" : "s"}`
                  : `${ranges.length} range${ranges.length === 1 ? "" : "s"} (${conflicts.length} dates)`}
              </p>
            </div>
            <div className="mt-2 space-y-2">
              {ranges.map((r) => (
                <div
                  key={`${r.start}-${r.end}`}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span className="font-medium text-foreground">
                    {r.days === 1
                      ? formatDate(r.start)
                      : `${formatDate(r.start)} – ${formatDate(r.end)}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {r.days === 1
                      ? `${r.rows} row${r.rows === 1 ? "" : "s"}`
                      : `${r.days} days, ${r.rows} rows`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Batches you'd need to revert
              </p>
              <p className="text-xs text-muted-foreground">
                {uniqueBatches.length} batch
                {uniqueBatches.length === 1 ? "" : "es"}
              </p>
            </div>
            {uniqueBatches.length === 0 ? (
              <p className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                <span className="font-semibold">Legacy data — no batch.</span>
                {" "}These dates contain rows from before the audit feature
                existed, so they can't be reverted from the UI. Contact your
                admin to remove them manually before re-uploading.
              </p>
            ) : (
              <>
                <div className="mt-2 space-y-2">
                  {visibleBatches.map((b) => (
                    <div
                      key={b.batch_id}
                      className="rounded-md border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">
                          {b.uploaded_by_name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(b.created_at)}
                        </span>
                      </div>
                      <div
                        className="mt-1 truncate font-mono text-xs text-muted-foreground"
                        title={b.filename}
                      >
                        {b.filename} • {b.row_count} rows
                      </div>
                    </div>
                  ))}
                </div>
                {uniqueBatches.length > BATCH_PREVIEW_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllBatches((v) => !v)}
                    className="mt-2 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    {showAllBatches
                      ? "Show fewer"
                      : `Show all ${uniqueBatches.length} batches (${hiddenBatchCount} more)`}
                  </button>
                )}
              </>
            )}
          </div>

          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">To proceed:</span> open the{" "}
              <b>Data Audit</b> tab, revert the batch
              {uniqueBatches.length === 1 ? "" : "es"} above, then re-upload
              your file.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-background/70 px-6 py-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {uniqueBatches.length > 0 && (
            <Button onClick={onGoToAudit} className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Go to Data Audit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
