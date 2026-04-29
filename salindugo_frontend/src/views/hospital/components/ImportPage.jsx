import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api/axios";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const TABS = [
  {
    id: "requests",
    label: "Blood Requests",
    shortLabel: "Requests",
    description: "Import request records",
    guidance: "Use this for fulfilled or tracked blood request activity.",
    icon: ClipboardCheck,
    columns: ["request_date", "blood_type", "units_needed", "status"],
  },
  {
    id: "stocks",
    label: "Blood Stocks",
    shortLabel: "Stocks",
    description: "Import inventory levels",
    guidance: "Use this when updating available units by blood type.",
    icon: Database,
    columns: ["blood_type", "units_available"],
  },
  {
    id: "inventory-history",
    label: "Inventory History",
    shortLabel: "History",
    description: "Import historical changes",
    guidance: "Use this for stock movement history and forecasting context.",
    icon: History,
    columns: ["changed_at", "blood_type", "change"],
  },
];

export default function ImportData() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("requests");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const currentTab = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const CurrentIcon = currentTab.icon;

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
    let csv = "";

    if (activeTab === "requests") {
      csv =
        "request_date,blood_type,units_needed,status\n" +
        "2026-03-01,O+,3,fulfilled\n" +
        "2026-03-02,A+,2,fulfilled\n";
    } else if (activeTab === "stocks") {
      csv = "blood_type,units_available\nO+,20\nA+,15\n";
    } else if (activeTab === "inventory-history") {
      csv =
        "changed_at,blood_type,change\n" +
        "2026-03-01,O+,5\n" +
        "2026-03-02,O+,-2\n";
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab}-template.csv`;
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

      await api.post(`/api/import/${activeTab}`, formData, {
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
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/hospital-dashboard")}
          className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="space-y-6">
            <div className="rounded-md border border-border bg-card px-6 py-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">
                      Data Intake
                    </Badge>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      Import Data
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                      Upload prepared CSV or spreadsheet files for requests,
                      blood stock, and inventory history without changing the
                      rest of your dashboard workflow.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                setFile(null);
                setPreview([]);
                setError("");
                setSuccess(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="space-y-5"
            >
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/70 p-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;

                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="h-auto flex-col items-start gap-1 rounded-md px-3 py-3 text-left data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                      </span>
                      <span className="hidden text-xs font-normal text-muted-foreground md:block">
                        {tab.description}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {TABS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="space-y-5">
                  <Card className="overflow-hidden border-border bg-card shadow-sm">
                    <CardHeader className="border-b border-border bg-background/70">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                          <CurrentIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle>{tab.label}</CardTitle>
                          <CardDescription className="mt-1">
                            {tab.guidance}
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
                            {tab.columns.map((column) => (
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
                              Blood types use standard labels like A+ or O-
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
                          {file && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB selected
                            </p>
                          )}
                        </div>
                      </label>

                      {preview.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-border bg-background">
                          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                            <Table2 className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">
                              File Preview
                            </p>
                            <span className="text-xs text-muted-foreground">
                              First {preview.length} rows
                            </span>
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
                            Upload successful. Your dashboard data is ready to
                            review.
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
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Data
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleDownloadTemplate}
                          variant="outline"
                          className="h-11 gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download {tab.shortLabel} Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </section>

          <aside className="space-y-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Import Checklist</CardTitle>
                <CardDescription>
                  A quick pass before sending data into the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Match the selected import type to the file content.
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Keep one header row at the top of the file.
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Remove blank rows before uploading large files.
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Current target</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <CurrentIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {currentTab.label}
                  </p>
                  <p className="text-xs">{currentTab.description}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
