import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api/axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Table2,
  Upload,
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

export default function ImportData() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Constants specific to Blood Requests
  const REQUIRED_COLUMNS = [
    "request_date",
    "blood_type",
    "units_needed",
    "status",
  ];

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

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      // Endpoint changed to strictly use 'requests'
      await api.post(`/api/import/requests`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setFile(null);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Upload failed. Please check your file and try again.",
      );
    } finally {
      setLoading(false);
    }
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
                    onClick={handleUpload}
                    disabled={!file || loading}
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
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
