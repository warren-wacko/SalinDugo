import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, parseISO, isValid } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import api from "@/api/axios";
import { toast } from "sonner";
import { Plus, Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { allowNumbersOnly, allowTextOnly } from "@/utils/validationHelpers";

export default function InventoryTab({ accessToken }) {
  const [bloodStock, setBloodStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockHistory, setStockHistory] = useState([]);
  const [selectedTrendBlood, setSelectedTrendBlood] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedBlood, setSelectedBlood] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);

  const capitalizeName = (name) => {
    return name
      .split(" ")
      .map((word) =>
        word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "",
      )
      .join(" ");
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    donorAge: "",
    donorGender: "",
    units: 1,
    contactNumber: "",
    address: "",
    dateOfBirth: "",
    middleInitial: "",
    title: "",
    role: "user",
    civilStatus: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/stocks", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setBloodStock(res.data);
      // Default to first blood type for trend chart if not set
      if (res.data.length > 0 && !selectedTrendBlood) {
        setSelectedTrendBlood(res.data[0].blood_type);
      }
    } catch (err) {
      console.error(err);

      const status = err.response?.status;

      if (status === 429) {
        toast.error("Too many requests. Please wait before trying again.");
      } else if (status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (status === 500) {
        toast.error("Server error. Try again later.");
      } else {
        toast.error("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async (bloodType) => {
    if (!bloodType) return;
    try {
      setHistoryLoading(true);
      const res = await api.get(
        `/api/stocks/history/${encodeURIComponent(bloodType)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setStockHistory(res.data);
      console.log("Stock history response:", res.data);
      console.log("Selected trend blood:", selectedTrendBlood);
    } catch (err) {
      console.error("Failed to load history:", err);
      // Gracefully handle missing history endpoint
      setStockHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrendBlood && accessToken) {
      fetchStockHistory(selectedTrendBlood);
    }
  }, [selectedTrendBlood, accessToken]);

  useEffect(() => {
    if (accessToken) fetchStock();
  }, [accessToken]);

  const handleWalkInDonation = async () => {
    // FIX: Destructure variables from formData to prevent reference errors
    const { firstName, lastName, units } = formData;

    if (!firstName || !lastName || !selectedBlood || !units) {
      toast.error(
        "Please fill in required fields (First Name, Last Name, Blood Type, Units)",
      );
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();

    setIsSubmittingDonation(true);
    try {
      const res = await api.post(
        "/api/stocks/walkin",
        {
          full_name: fullName,
          age: formData.donorAge || null,
          gender: formData.donorGender || null,
          blood_type: selectedBlood,
          units: formData.units,
          contact_number: formData.contactNumber || null,
          address: formData.address || null,
          date_of_birth: formData.dateOfBirth || null,
          middle_initial: formData.middleInitial || null,
          title: formData.title || null,
          role: formData.role || "user",
          civil_status: formData.civilStatus || null,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      // Show success toast
      toast.success("Walk-in donation recorded!");

      // Fetch updated stock
      fetchStock();

      // Store generated credentials
      setGeneratedEmail(res.data.email);
      setGeneratedPassword(res.data.password);

      // Open credentials modal
      setCredentialsModalOpen(true);

      // Reset donation form
      setFormData({
        firstName: "",
        lastName: "",
        donorAge: "",
        donorGender: "",
        units: 1,
        contactNumber: "",
        address: "",
        dateOfBirth: "",
        middleInitial: "",
        title: "",
        role: "user",
        civilStatus: "",
      });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      console.log("selectedBlood:", selectedBlood);
      console.log("formData:", formData);
      toast.error("Failed to record walk-in donation");
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Chart configuration
  const chartConfig = {
    units_available: {
      label: "Units Available",
      color: "hsl(var(--chart-1))",
    },
  };

  const bloodTypeColors = {
    "O+": "#f87171", // red
    "O-": "#fca5a5", // lighter red
    "A+": "#60a5fa", // blue
    "A-": "#93c5fd", // lighter blue
    "B+": "#34d399", // green
    "B-": "#6ee7b7", // lighter green
    "AB+": "#fbbf24", // yellow
    "AB-": "#fde68a", // lighter yellow
  };

  const getStockStatus = (units) => {
    if (units <= 5) return "critical";
    if (units < 10) return "low";
    if (units >= 30) return "full";
    return "safe";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "bg-red-500 text-white";
      case "low":
        return "bg-orange-500 text-white";
      case "full":
        return "bg-green-600 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const statusLabels = {
    low: "Low",
    medium: "Moderate",
    critical: "Critical",
    safe: "Safe",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Manage Blood Donations</h2>
        <p className="text-muted-foreground">
          Track donations, update inventory, and handle walk-in donors
          efficiently.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Summary Chart */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Current Stock Levels</h3>
              <p className="text-sm text-muted-foreground">
                Overview of all blood types
              </p>
            </div>
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                  data={bloodStock}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
                  barSize={28}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="blood_type"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tick={{ fontSize: 14, fontWeight: 600 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="units_available"
                    radius={[0, 4, 4, 0]}
                    name="Units"
                  >
                    <LabelList
                      dataKey="units_available"
                      position="right"
                      className="fill-foreground font-semibold"
                      fontSize={13}
                    />
                    {bloodStock.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={bloodTypeColors[entry.blood_type] || "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Stock Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Historical changes over time
                </p>
              </div>
              <Select
                value={selectedTrendBlood}
                onValueChange={setSelectedTrendBlood}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodStock.map((stock) => (
                    <SelectItem key={stock.stock_id} value={stock.blood_type}>
                      {stock.blood_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-[300px] w-full">
              {stockHistory.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  {(() => {
                    let cumulative = 0;
                    const areaData = stockHistory.map((item) => {
                      cumulative += Number(item.units);
                      return { date: item.date, units: cumulative };
                    });
                    return (
                      <AreaChart
                        data={areaData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillUnits"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickMargin={8}
                          minTickGap={32}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                        />
                        <YAxis tickMargin={8} width={40} />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              }
                            />
                          }
                        />
                        <Area
                          dataKey="units"
                          type="monotone"
                          stroke="#f63b64ff"
                          fill="url(#fillUnits)"
                        />
                      </AreaChart>
                    );
                  })()}
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {historyLoading
                    ? "Loading history..."
                    : "No historical data available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bloodStock.map((stock) => {
          const status = getStockStatus(stock.units_available);
          const percentage = Math.min((stock.units_available / 30) * 100, 100);

          return (
            <Card
              key={stock.stock_id}
              className={`hover:shadow-md transition-shadow ${
                status === "critical"
                  ? "border-red-600 animate-pulse shadow-lg shadow-red-500/30"
                  : status === "low"
                    ? "border-orange-500 shadow-lg shadow-orange-500/20"
                    : "border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{stock.blood_type}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Blood Supply:
                      </span>

                      <Badge className={getStatusColor(status)}>
                        {statusLabels[status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Available Units</span>
                      <span className="font-medium">
                        {stock.units_available}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedBlood(stock.blood_type);
                        setModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Walk-in Donation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Donation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Walk-in Donation - {selectedBlood}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleChange("firstName", capitalizeName(e.target.value))
                  }
                  onBeforeInput={allowTextOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleChange("lastName", capitalizeName(e.target.value))
                  }
                  onBeforeInput={allowTextOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleInitial">Middle Initial</Label>
              <Input
                id="middleInitial"
                type="text"
                style={{ textTransform: "uppercase" }}
                placeholder="M."
                maxLength={1}
                value={formData.middleInitial}
                onChange={(e) => handleChange("middleInitial", e.target.value)}
                onBeforeInput={allowTextOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">
                  Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.donorAge}
                  onChange={(e) => handleChange("donorAge", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.donorGender}
                  onValueChange={(val) => handleChange("donorGender", val)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="civilStatus">Civil Status</Label>
              <Select
                value={formData.civilStatus}
                onValueChange={(val) => handleChange("civilStatus", val)}
              >
                <SelectTrigger id="civilStatus">
                  <SelectValue placeholder="Select civil status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="separated">Separated</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="title">Title</Label>
              <Select
                value={formData.title}
                onValueChange={(val) => handleChange("title", val)}
              >
                <SelectTrigger id="title">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dr">Dr.</SelectItem>
                  <SelectItem value="prof">Prof.</SelectItem>
                  <SelectItem value="engr">Engr.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactNumber"
                type="text"
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChange={(e) => handleChange("contactNumber", e.target.value)}
                onBeforeInput={allowNumbersOnly}
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter address"
                value={formData.address}
                onChange={(e) =>
                  handleChange("address", capitalizeName(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">
                Units <span className="text-red-500">*</span>
              </Label>
              <Input
                id="units"
                type="number"
                min="1"
                placeholder="Enter units"
                disabled
                value={formData.units}
                onChange={(e) => handleChange("units", e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={
                !formData.firstName ||
                !formData.lastName ||
                !selectedBlood ||
                !formData.units ||
                !formData.donorAge ||
                !formData.donorGender ||
                !formData.dateOfBirth ||
                !formData.contactNumber ||
                !formData.address ||
                isSubmittingDonation
              }
              onClick={handleWalkInDonation}
            >
              {isSubmittingDonation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Confirm Donation"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal */}
      <Dialog
        open={credentialsModalOpen}
        onOpenChange={setCredentialsModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Walk-in Donor Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Email:</span>
              <div className="flex items-center gap-2">
                <span>{generatedEmail}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedEmail)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Password:</span>
              <div className="flex items-center gap-2">
                <span>{generatedPassword}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => setCredentialsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
