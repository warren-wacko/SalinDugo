import { useState, useEffect, lazy, Suspense, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Clock,
  Activity,
  HeartPulse,
  CheckCircle,
  Droplet,
  HandHeart,
  Phone,
  Zap,
  Map,
  Building2,
  Package,
  Loader2,
  TextSearch,
  HeartHandshake,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import Navbar from "../../../components/ui/navbar";
import { AuthContext } from "../../../context/AuthContext";
const DonationHistoryTab = lazy(() =>
  import("../components/DonationHistoryTab")
);
const NotificationTab = lazy(() => import("../components/NotificationTab"));
const RequestHistoryTab = lazy(() => import("../components/RequestHistoryTab"));
import BloodDropLoader from "../../../utils/bloodDropLoader";
import api from "../../../api/axios";
export default function UnifiedDashboard() {
  const [mode, setMode] = useState("donate");
  const { user, accessToken } = useContext(AuthContext);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [open, setOpen] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [formData, setFormData] = useState({
    id: user?.id || "",
    bloodType: user?.blood_type || "",
    unitsNeeded: "",
    urgency: "routine",
    hospital: "",
  });
  const [activeTab, setActiveTab] = useState("matches");
  const [hospitalsNeedingBlood, setHospitalsNeedingBlood] = useState([]);
  const [hospitalsWithBloodStock, setHospitalsWithBloodStock] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bloodType || !formData.unitsNeeded || !formData.hospital) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const res = await api.post("/api/requests", {
        id: user.id,
        blood_type: formData.bloodType,
        units_needed: formData.unitsNeeded,
        urgency_level: formData.urgency,
        hospital_id: formData.hospital,
      });

      console.log("Server response:", res.data);

      toast.success("Blood Request Submitted", {
        description:
          "Your blood request has been successfully sent. Our team will review it shortly.",
      });

      setOpen(false);
      setFormData({
        bloodType: user.blood_type,
        unitsNeeded: "",
        urgency: "routine",
        hospital: "",
      });

      // Optional refresh logic
      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error("Error submitting request:", err);

      // If backend sends a message
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting donation schedule...");

    try {
      const res = await api.post("/api/schedules", {
        donor_id: user.id,
        hospital_id: formData.hospital,
        scheduled_date: formData.date,
        scheduled_time: formData.time,
        blood_type: user.blood_type,
      });

      console.log("Server response:", res.data);

      toast.success("Donation Schedule Submitted", {
        description:
          "Your blood donation appointment has been scheduled successfully. Thank you for saving lives! ❤️",
      });

      // Reset form + close modal
      setOpen(false);
      setFormData({ date: "", time: "", hospital: "" });

      // ✅ Trigger notification refresh if available
      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error("Error scheduling donation:", err);

      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to schedule donation. Please try again.");
      }
    }
  };

  const totalDonations =
    user?.totalDonations ||
    parseInt(localStorage.getItem("totalDonations")) ||
    0;
  const totalRequests =
    user?.remainingUnits ||
    parseInt(localStorage.getItem("remainingUnits")) ||
    0;

  useEffect(() => {
    if (user) {
      localStorage.setItem("totalDonations", user.totalDonations);
      localStorage.setItem("remainingUnits", user.remainingUnits);
      localStorage.getItem("accessToken");
    }

    const fetchHospitals = async () => {
      try {
        const res = await api.get("/api/hospitals");
        console.log("Hospitals API Response:", res.data);
        setHospitals(res.data);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
      }
    };

    fetchHospitals();
  }, [user]);

  useEffect(() => {
    if (!accessToken || !user) return;

    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        if (mode === "donate") {
          // Donor looking for hospitals needing blood
          const res = await api.get("/api/matching/donor", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setHospitalsNeedingBlood(res.data.matches || []);
        } else {
          // Hospital looking for donors or available stock (if you implement later)
          const res = await api.get("/api/matching/hospital/1", {
            // You can dynamically pass request_id once you hook requests
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setHospitalsWithBloodStock(res.data.matches || []);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [mode, accessToken, user]);

  // Mock user profile data
  const userProfile = {
    ...user, // Spread user fields (from AuthContext or localStorage)
    name: user?.full_name || "",
    bloodType: user?.blood_type || "",
    city: user?.city || "Manila",
    province: user?.province || "Metro Manila",
    last_donation_date: user?.last_donation_date || null,
    nextEligibleDate: (() => {
      // 🩸 get from user/localStorage
      const lastDonationRaw =
        user?.last_donation_date || localStorage.getItem("last_donation_date");
      if (!lastDonationRaw) return "Not available";

      // ✅ safely parse (even if ISO UTC)
      const lastDonation = new Date(lastDonationRaw);
      if (isNaN(lastDonation.getTime())) return "Not available";

      // ➕ add 56 days
      const nextEligible = new Date(
        lastDonation.getTime() + 56 * 24 * 60 * 60 * 1000
      );
      const today = new Date();

      // ✅ compare and safely format
      if (today >= nextEligible) return "Now eligible!";

      const formatted = nextEligible.toISOString().split("T")[0];
      return formatted || "Not available";
    })(),
  };

  const daysUntilEligible = (() => {
    const nextDate = new Date(userProfile.nextEligibleDate);
    if (isNaN(nextDate.getTime())) return 0; // Not a valid date (means already eligible)
    const diffMs = nextDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar setActiveTab={setActiveTab} />

      <div className="container mx-auto px-4 py-8">
        {/* Mode Selector */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    What would you like to do?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose to donate blood or request blood
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={mode === "donate" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setMode("donate")}
                    className="gap-2"
                  >
                    <Droplet className="h-5 w-5" />
                    Donate Blood
                  </Button>
                  <Button
                    variant={mode === "request" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setMode("request")}
                    className="gap-2"
                  >
                    <HandHeart className="h-5 w-5" />
                    Request Blood
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback>
                    <AvatarInitials name={userProfile.name} />
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{userProfile.name}</CardTitle>
                <CardDescription>
                  {mode === "donate" ? "Blood Donor" : "Blood Recipient"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {userProfile.bloodType}
                  </div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                </div>

                {mode === "donate" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {userProfile.city + ", " + userProfile.province}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Completed {totalDonations} donations
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next eligible:</span>
                        <span className="font-medium">
                          {daysUntilEligible > 0
                            ? `${daysUntilEligible} days`
                            : "Now eligible!"}
                        </span>
                      </div>
                      <Progress
                        value={
                          daysUntilEligible > 0
                            ? ((56 - daysUntilEligible) / 56) * 100
                            : 100
                        }
                      />
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full mt-3"
                          disabled={daysUntilEligible > 0} // disable if not eligible yet
                          title={
                            daysUntilEligible > 0
                              ? `You can donate again in ${daysUntilEligible} day${
                                  daysUntilEligible > 1 ? "s" : ""
                                }`
                              : "You are eligible to donate now!"
                          }
                        >
                          <Droplet className="h-4 w-4 mr-2" />
                          {daysUntilEligible > 0
                            ? "Not Eligible Yet"
                            : "Schedule Donation"}
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set Donation Appointment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleDonateSubmit}>
                          <div className="space-y-3">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  date: e.target.value,
                                })
                              }
                            />
                            <Label>Time</Label>
                            <Input
                              type="time"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  time: e.target.value,
                                })
                              }
                            />
                            <Label>Hospital</Label>
                            <Select
                              onValueChange={(v) =>
                                setFormData({ ...formData, hospital: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select hospital" />
                              </SelectTrigger>
                              <SelectContent>
                                {hospitals.map((h) => (
                                  <SelectItem
                                    key={h.user_id}
                                    value={h.user_id.toString()}
                                  >
                                    {h.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full">
                              Confirm Schedule
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {mode === "request" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {userProfile.city}, {userProfile.province}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-4 w-4 text-muted-foreground" />
                        <span>Units needed:</span>
                        <span className="text-sm">{totalRequests}</span>
                      </div>
                    </div>
                    <Dialog>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Blood Request Details</DialogTitle>
                          <DialogDescription>
                            Fill in the details below to create a new blood
                            request.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3 py-4">
                          {/* Blood Type */}
                          <div className="space-y-2">
                            <Label htmlFor="blood_type">Blood Type</Label>
                            <Input
                              id="blood_type"
                              defaultValue={userProfile?.bloodType || ""}
                              className="w-full"
                            />
                          </div>

                          {/* Units Needed */}
                          <div className="space-y-2">
                            <Label htmlFor="units_needed">Units Needed</Label>
                            <Input
                              id="units_needed"
                              type="number"
                              min="1"
                              defaultValue={userProfile?.unitsNeeded || 1}
                              className="w-full"
                            />
                          </div>

                          {/* Urgency */}
                          <div className="space-y-2">
                            <Label htmlFor="urgency_level">Urgency</Label>
                            <Select defaultValue="routine">
                              <SelectTrigger
                                id="urgency_level"
                                className="w-full"
                              >
                                <SelectValue placeholder="Select urgency level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="emergency">
                                  Emergency
                                </SelectItem>
                                <SelectItem value="routine">Routine</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Hospital */}
                          <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital</Label>
                            <Select defaultValue="none">
                              <SelectTrigger id="hospital" className="w-full">
                                <SelectValue placeholder="Select hospital" />
                              </SelectTrigger>
                              <SelectContent>
                                {hospitals.length > 0 ? (
                                  hospitals.map((hospital) => (
                                    <SelectItem
                                      key={hospital.user_id}
                                      value={hospital.user_id.toString()}
                                    >
                                      {hospital.full_name} – {hospital.city},{" "}
                                      {hospital.province}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>
                                    No verified hospitals found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="submit"
                            className="w-full bg-red-700 hover:bg-red-800 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mt-3 bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Create Request
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                          <DialogTitle>Blood Request Details</DialogTitle>
                          <DialogDescription>
                            Fill in the details below to create a new blood
                            request.
                          </DialogDescription>
                        </DialogHeader>

                        <form
                          onSubmit={handleRequestSubmit}
                          className="grid gap-3 py-4"
                        >
                          {/* Blood Type */}
                          <div className="space-y-2">
                            <Label htmlFor="blood_type">Blood Type</Label>
                            <Input
                              id="blood_type"
                              value={user.blood_type}
                              onChange={(e) =>
                                setFormData({ bloodType: user.blood_type })
                              }
                              className="w-full"
                              disabled
                            />
                          </div>

                          {/* Units Needed */}
                          <div className="space-y-2">
                            <Label htmlFor="units_needed">Units Needed</Label>
                            <Input
                              id="units_needed"
                              type="number"
                              min="1"
                              value={formData.unitsNeeded}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  unitsNeeded: e.target.value,
                                })
                              }
                              className="w-full"
                            />
                          </div>

                          {/* Urgency */}
                          <div className="space-y-2">
                            <Label htmlFor="urgency">Urgency</Label>
                            <Select
                              value={formData.urgency}
                              onValueChange={(value) =>
                                setFormData({ ...formData, urgency: value })
                              }
                            >
                              <SelectTrigger id="urgency" className="w-full">
                                <SelectValue placeholder="Select urgency level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="emergency">
                                  Emergency
                                </SelectItem>
                                <SelectItem value="routine">Routine</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Hospital */}
                          <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital</Label>
                            <Select
                              value={formData.hospital}
                              onValueChange={(value) =>
                                setFormData({ ...formData, hospital: value })
                              }
                            >
                              <SelectTrigger id="hospital" className="w-full">
                                <SelectValue placeholder="Select hospital" />
                              </SelectTrigger>
                              <SelectContent>
                                {hospitals.length > 0 ? (
                                  hospitals.map((hospital) => (
                                    <SelectItem
                                      key={hospital.user_id}
                                      value={hospital.user_id.toString()}
                                    >
                                      {hospital.full_name} – {hospital.city},{" "}
                                      {hospital.province}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>
                                    No verified hospitals found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <DialogFooter className="pt-4">
                            <Button
                              type="submit"
                              className="w-full mt-3 bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Submit Request
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="w-full bg-transparent">
                      <Phone className="h-4 w-4 mr-2" />
                      Emergency Contact
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Nearby Locations Card */}
            {/*             <Card>
              <CardHeader>
                <CardTitle className="text-base">Nearby Locations</CardTitle>
                <CardDescription>
                  {mode === "donate"
                    ? "Hospitals and blood banks near you"
                    : "Blood banks and hospitals near you"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nearbyLocations.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{location.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {location.type}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.distance}
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2 bg-transparent"
                    size="sm"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {mode === "donate" ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="matches">
                    Hospitals Needing Blood
                  </TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Hospitals Needing Blood
                      </h2>
                      <p className="text-muted-foreground">
                        Find nearby hospitals and blood banks that need your
                        blood type
                      </p>
                    </div>
                    <Select
                      value={selectedUrgency}
                      onValueChange={setSelectedUrgency}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Urgency</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {loadingMatches ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : hospitalsNeedingBlood.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No matching hospitals found for your blood type.
                      </p>
                    ) : (
                      hospitalsNeedingBlood.map((hospital, index) => (
                        <Card
                          key={hospital.request_id || `hospital-${index}`}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">
                                      {hospital.hospital_name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                      {hospital.blood_type_summary?.map(
                                        (bt) => (
                                          <Badge
                                            key={bt.blood_type}
                                            className={`text-xs px-3 py-1 ${
                                              bt.units_needed ===
                                              hospital.max_units_needed
                                                ? "bg-red-600 text-white font-semibold animate-pulse"
                                                : "bg-sky-100 text-gray-700"
                                            }`}
                                          >
                                            {bt.blood_type} — {bt.units_needed}{" "}
                                            units
                                          </Badge>
                                        )
                                      )}
                                    </div>

                                    <Badge
                                      className={`text-xs px-3 py-1 ${
                                        hospital.urgency_level === "emergency"
                                          ? "destructive"
                                          : hospital.urgency_level === "routine"
                                          ? "secondary"
                                          : "outline"
                                      }`}
                                    >
                                      {hospital.urgency_level}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {hospital.address}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {hospital?.distance_km?.toFixed(1)} km
                                      away
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium">
                                        {hospital.total_units_needed ?? 0} units
                                        needed
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        {hospital.contact_number || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                {/* View More Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="w-full mb-2">
                                      <TextSearch className="h-3 w-3 mr-1" />
                                      View More
                                    </Button>
                                  </DialogTrigger>

                                  <DialogContent className="sm:max-w-[400px]">
                                    <DialogHeader>
                                      <DialogTitle>
                                        {hospital.hospital_name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Detailed breakdown of requested blood
                                        types.
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-3 mt-4">
                                      {hospital.blood_type_summary?.length >
                                      0 ? (
                                        hospital.blood_type_summary
                                          ?.sort(
                                            (a, b) =>
                                              b.units_needed - a.units_needed
                                          )
                                          .map((item, idx) => (
                                            <div
                                              key={idx}
                                              className={`flex justify-between border-b py-2 text-sm ${
                                                idx === 0
                                                  ? "text-red-600 font-semibold"
                                                  : ""
                                              }`}
                                            >
                                              <span className="font-medium">
                                                {item.blood_type}
                                              </span>
                                              <span>
                                                {item.units_needed} units
                                              </span>
                                            </div>
                                          ))
                                      ) : (
                                        <p className="text-muted-foreground text-sm">
                                          No detailed summary available.
                                        </p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Call + Directions */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full bg-transparent"
                                >
                                  <Map className="h-3 w-3 mr-1" />
                                  Get Directions
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Suspense fallback={<BloodDropLoader />}>
                    <DonationHistoryTab
                      accessToken={accessToken}
                      setOpen={setOpen}
                    />
                  </Suspense>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Suspense fallback={<BloodDropLoader />}>
                    <NotificationTab accessToken={accessToken} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="matches">
                    Blood Stock Available
                  </TabsTrigger>
                  <TabsTrigger value="history">Request History</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Blood Stock Available
                      </h2>
                      <p className="text-muted-foreground">
                        Find nearby hospitals and blood banks with your blood
                        type in stock
                      </p>
                    </div>
                    <Select
                      value={selectedLocation}
                      onValueChange={setSelectedLocation}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="manila">Manila</SelectItem>
                        <SelectItem value="quezon">Quezon City</SelectItem>
                        <SelectItem value="makati">Makati</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/*   <div className="space-y-4">
                    {loadingMatches ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : hospitalsWithBloodStock.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No compatible donors found nearby.
                      </p>
                    ) : (
                      hospitalsWithBloodStock.map((donor) => (
                        <Card
                          key={donor.user_id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <HeartPulse className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="font-semibold text-lg">
                                    {donor.full_name}
                                  </h3>
                                  <Badge variant="outline">
                                    {donor.blood_type}
                                  </Badge>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {donor.distance_km.toFixed(1)} km away
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {donor.contact_number || "N/A"}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Last donated:{" "}
                                    {donor.last_donation_date
                                      ? new Date(
                                          donor.last_donation_date
                                        ).toLocaleDateString()
                                      : "No record"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full bg-transparent"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Contact Donor
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div> */}
                  <Empty className="py-16">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <HeartHandshake className="h-8 w-8 text-red-700" />
                      </EmptyMedia>
                      <EmptyTitle className="text-lg font-semibold">
                        No blood stock records found
                      </EmptyTitle>
                      <EmptyDescription>
                        You blood bank center found at the moment.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TabsContent>

                {/* Request History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Suspense fallback={<BloodDropLoader />}>
                    <RequestHistoryTab
                      accessToken={accessToken}
                      setOpen={setOpen}
                    />
                  </Suspense>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Suspense fallback={<BloodDropLoader />}>
                    <NotificationTab accessToken={accessToken} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
