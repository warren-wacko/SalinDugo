import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api/axios";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  FileUp,
  ArrowLeft,
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
    description: "Import request records",
  },
  {
    id: "stocks",
    label: "Blood Stocks",
    description: "Import inventory levels",
  },
  {
    id: "inventory-history",
    label: "Inventory History",
    description: "Import historical changes",
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

  const currentTab = TABS.find((t) => t.id === activeTab);

  const handleFileChange = async (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setError("");
    setSuccess(false);

    try {
      const text = await selected.text();
      const rows = text.split("\n").slice(0, 6);
      setPreview(rows.filter((r) => r.trim()));
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
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/hospital-dashboard")}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Import Data
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload blood request, inventory, and historical data using CSV files
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tab.label}</CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Instructions */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">
                      How to prepare your file:
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Use CSV format (.csv or .xlsx)</li>
                      <li>Follow the template structure exactly</li>
                      <li>Dates must be valid (YYYY-MM-DD format)</li>
                      <li>Blood types must be standard (A+, O-, etc.)</li>
                    </ul>
                  </div>

                  {/* Download Template */}
                  <Button onClick={handleDownloadTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>

                  {/* Upload */}
                  <label className="block">
                    <div className="relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0"
                      />
                      <FileUp className="mx-auto mb-2" />
                      <p>{file ? file.name : "Click or drag file"}</p>
                    </div>
                  </label>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? "Uploading..." : "Upload Data"}
                  </Button>

                  {/* Alerts */}
                  {error && <Alert>{error}</Alert>}
                  {success && <Alert>Upload successful!</Alert>}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
