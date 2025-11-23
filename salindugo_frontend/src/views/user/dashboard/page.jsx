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
  CheckCircle2,
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
  X,
  AlertCircle,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "../../../components/ui/navbar";
import { AuthContext } from "../../../context/AuthContext";
const DonationHistoryTab = lazy(() =>
  import("../components/DonationHistoryTab")
);
const NotificationTab = lazy(() => import("../components/NotificationTab"));
const RequestHistoryTab = lazy(() => import("../components/RequestHistoryTab"));
import DirectionsMapDialog from "../components/DirectionsMapDialog";
import BloodDropLoader from "../../../utils/bloodDropLoader";
import api from "../../../api/axios";
export default function UnifiedDashboard() {
  const [mode, setMode] = useState("donate");
  const { user, accessToken } = useContext(AuthContext);
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

  const [donationFormData, setDonationFormData] = useState({
    date: "",
    time: "",
    hospital_id: "",
  });
  const [activeTab, setActiveTab] = useState("matches");
  const [hospitalsNeedingBlood, setHospitalsNeedingBlood] = useState([]);
  const [hospitalsWithBloodStock, setHospitalsWithBloodStock] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showDirectionsMap, setShowDirectionsMap] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [pendingSchedule, setPendingSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const [bloodCentersAvailable, setBloodCentersAvailable] = useState([]);
  const [selectedCenterForRequest, setSelectedCenterForRequest] =
    useState(null);

  const [pendingRequest, setPendingRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loadingRequestHistory, setLoadingRequestHistory] = useState(false);

  const userLocation = {
    latitude: user?.latitude || "14.5995",
    longitude: user?.longitude || "120.9842",
    address: user?.address || "Your Location",
  };

  useEffect(() => {
    if (!user?.id || mode !== "request") return;

    const checkPendingRequest = async () => {
      setLoadingRequest(true);
      try {
        const res = await api.get(`/api/requests/pending/${user.id}`);
        console.log("Pending request check:", res.data);
        setPendingRequest(res.data.request || null);
      } catch (err) {
        console.error("Error checking pending request:", err);
      } finally {
        setLoadingRequest(false);
      }
    };

    checkPendingRequest();
  }, [user?.id, mode]);

  const handleCancelRequest = async (requestId) => {
    if (
      !window.confirm("Are you sure you want to cancel this blood request?")
    ) {
      return;
    }

    try {
      await api.delete(`/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Blood request cancelled successfully");
      setPendingRequest(null);

      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  useEffect(() => {
    if (!accessToken || !user || mode !== "request") return;

    const fetchBloodCenters = async () => {
      setLoadingMatches(true);
      try {
        const res = await api.get("/api/matching/recipient", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBloodCentersAvailable(res.data.matches || []);
      } catch (err) {
        console.error("Error fetching blood centers:", err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchBloodCenters();
  }, [mode, accessToken, user]);

  // 🆕 Fetch pending schedule on mount
  useEffect(() => {
    if (!user?.id) return;

    const checkPendingSchedule = async () => {
      try {
        const res = await api.get(`/api/schedules/pending/${user.id}`);
        console.log("Pending schedule check:", res.data);
        setPendingSchedule(res.data.schedule || null);
      } catch (err) {
        console.error("Error checking pending schedule:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    checkPendingSchedule();
  }, [user?.id]);

  // 🆕 Cancel schedule function
  const handleCancelSchedule = async (scheduleId) => {
    if (
      !window.confirm("Are you sure you want to cancel this donation schedule?")
    ) {
      return;
    }

    try {
      await api.delete(`/api/schedules/${scheduleId}`);
      toast.success("Schedule cancelled successfully");
      setPendingSchedule(null);

      // Refresh matches
      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error("Error cancelling schedule:", err);
      toast.error(err.response?.data?.message || "Failed to cancel schedule");
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    console.log("Form Data:", formData);
    console.log("Selected Center:", selectedCenterForRequest);

    if (
      !formData.bloodType ||
      !formData.unitsNeeded ||
      !selectedCenterForRequest
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const res = await api.post("/api/requests", {
        id: user.id,
        blood_type: user.blood_type,
        units_needed: formData.unitsNeeded,
        urgency_level: formData.urgency,
        hospital_id: selectedCenterForRequest.hospital_id,
      });

      console.log("Server response:", res.data);

      toast.success("Blood Request Submitted", {
        description:
          "Your blood request has been successfully sent. Our team will review it shortly.",
      });

      setOpen(false);
      setSelectedCenterForRequest(null);
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
    console.log("Selected Hospital:", selectedHospital);
    console.log("Form Data:", donationFormData);

    // 🆕 Fixed: Use hospital_id instead of user_id
    const hospitalId = selectedHospital?.hospital_id;

    if (!donationFormData.date) {
      toast.error("Please select a date");
      return;
    }

    if (!donationFormData.time) {
      toast.error("Please select a time");
      return;
    }

    if (!hospitalId) {
      toast.error("Hospital ID is missing");
      return;
    }

    try {
      const payload = {
        donor_id: user.id,
        hospital_id: parseInt(hospitalId), // ✅ Now this will work
        scheduled_date: donationFormData.date,
        scheduled_time: donationFormData.time,
        blood_type: user.blood_type,
      };

      console.log("Sending payload:", payload);

      const res = await api.post("/api/schedules", payload);

      console.log("Server response:", res.data);

      toast.success("Donation Schedule Submitted", {
        description:
          "Your blood donation appointment has been scheduled successfully. Thank you for saving lives! ❤️",
      });

      // Reset form + close modal
      setOpen(false);
      setDonationFormData({ date: "", time: "", hospital_id: "" });
      setSelectedHospital(null);

      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error("Error scheduling donation:", err);
      console.error("Error response data:", err.response?.data);

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

      // ➕ add 35 days
      const nextEligible = new Date(
        lastDonation.getTime() + 35 * 24 * 60 * 60 * 1000
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

      {selectedHospital && (
        <DirectionsMapDialog
          hospital={selectedHospital}
          userLocation={userLocation}
          open={showDirectionsMap}
          onOpenChange={setShowDirectionsMap}
        />
      )}

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
                        <span className="text-sm">Units needed:</span>
                        <span className="text-sm">{totalRequests}</span>
                      </div>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Blood Request Details</DialogTitle>
                          <DialogDescription>
                            Fill in the details below to create a new blood
                            request.
                          </DialogDescription>

                          <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                              <AccordionTrigger className="font-bold text-lg text-primary mt-4">
                                Requesting Blood Requirements
                              </AccordionTrigger>

                              <AccordionContent>
                                <p>
                                  Kindly get a blood request form from the
                                  hospital where the patient is admitted. The
                                  following details are needed:
                                </p>

                                <ul className="list-disc ml-5 mt-3">
                                  <li>Full name of the patient</li>
                                  <li>Age, Sex, Civil status</li>
                                  <li>Blood type, Rh group</li>
                                  <li>Blood component</li>
                                  <li>Amount/Unit(s) needed</li>
                                  <li>Diagnosis/Indication for transfusion</li>
                                  <li>
                                    Printed name and signature of the attending
                                    physician
                                  </li>
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
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
                              readOnly
                              disabled
                              className="w-full bg-muted"
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

                          {/* Hospital - 🆕 Auto-selected, read-only */}
                          <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital</Label>
                            <Input
                              id="hospital"
                              value={
                                selectedCenterForRequest?.hospital_name ||
                                "Select a blood center first"
                              }
                              readOnly
                              disabled
                              className="w-full bg-muted font-semibold"
                            />
                            {selectedCenterForRequest && (
                              <p className="text-xs text-muted-foreground">
                                📍 {selectedCenterForRequest.address}
                              </p>
                            )}
                          </div>

                          <DialogFooter className="pt-4">
                            <Button
                              type="submit"
                              className="w-full bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                              disabled={!selectedCenterForRequest}
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
                    {pendingSchedule
                      ? "Active Schedule"
                      : "Blood Centers Needing Blood"}
                  </TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-6">
                  {/* 🆕 Show pending schedule if exists */}
                  {!loadingSchedule && pendingSchedule ? (
                    <div className="space-y-6">
                      <Card className="border-2">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                                  <Clock className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold">
                                    Active Donation Schedule
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Your appointment is scheduled
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  pendingSchedule.status === "approved"
                                    ? "default"
                                    : pendingSchedule.status === "pending"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                              >
                                {pendingSchedule.status}
                              </Badge>
                            </div>

                            {/* Hospital Info */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-4 border">
                              {/* Hospital Name */}
                              <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Hospital
                                  </p>
                                  <p className="font-semibold">
                                    {pendingSchedule.hospital_name}
                                  </p>
                                </div>
                              </div>

                              {/* Date and Time */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Date */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Date
                                    </p>
                                    <p className="font-semibold">
                                      {new Date(
                                        pendingSchedule.scheduled_date
                                      ).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Time
                                    </p>
                                    <p className="font-semibold">
                                      {pendingSchedule.scheduled_time}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Blood Type */}
                              <div className="flex items-center gap-3 pt-3 border-t">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Droplet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Blood Type
                                  </p>
                                  <p className="font-semibold">
                                    {pendingSchedule.blood_type}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Status Messages */}
                            {pendingSchedule.status === "pending" && (
                              <div className="bg-muted rounded-lg p-4 flex items-start gap-3 border">
                                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold">
                                    Awaiting Hospital Approval
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    The hospital will review your appointment
                                    and confirm shortly.
                                  </p>
                                </div>
                              </div>
                            )}

                            {pendingSchedule.status === "approved" && (
                              <div className="bg-muted rounded-lg p-4 flex items-start gap-3 border">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold">
                                    Appointment Confirmed ✓
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Please arrive 15 minutes early on your
                                    scheduled date.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 md:w-133">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setSelectedHospital(pendingSchedule);
                                  setShowDirectionsMap(true);
                                }}
                              >
                                <Map className="h-4 w-4 mr-2" />
                                Get Directions
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                                onClick={() =>
                                  handleCancelSchedule(
                                    pendingSchedule.schedule_id
                                  )
                                }
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Continue Donating Section */}
                      <div className="space-y-4 pt-4">
                        <div className="border-l-4 border-red-500 pl-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Other Hospitals
                          </h3>
                          <p className="text-sm text-gray-600">
                            After your scheduled donation, you can help other
                            hospitals
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 🆕 Show this when no pending schedule
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {/* Hospital List */}
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
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              {/* Left side: icon + main info */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-2 flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {hospital.hospital_name}
                                  </h3>

                                  <div className="flex flex-wrap gap-2">
                                    {hospital.blood_type_summary?.map((bt) => (
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
                                    ))}
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {hospital.address}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {hospital?.distance_km?.toFixed(1)} km
                                      away
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      {hospital.total_units_needed ?? 0} units
                                      needed
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {hospital.contact_number || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right side: buttons */}
                              <div className="flex flex-col gap-2 md:w-40">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHospital(hospital);
                                    setShowDirectionsMap(true);
                                  }}
                                >
                                  <Map className="h-3 w-3 mr-1" />
                                  Get Directions
                                </Button>

                                {/* View More Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="w-full">
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

                                <Dialog open={open} onOpenChange={setOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="w-full"
                                      disabled={
                                        daysUntilEligible > 0 ||
                                        !!pendingSchedule
                                      }
                                      title={
                                        pendingSchedule
                                          ? "You already have a pending donation schedule"
                                          : daysUntilEligible > 0
                                          ? `You can donate again in ${daysUntilEligible} day${
                                              daysUntilEligible > 1 ? "s" : ""
                                            }`
                                          : "You are eligible to donate now!"
                                      }
                                      onClick={() => {
                                        setSelectedHospital(hospital);
                                        setOpen(true);
                                      }}
                                    >
                                      <Droplet className="h-3 w-3 mr-1" />
                                      {pendingSchedule
                                        ? "Schedule Pending"
                                        : daysUntilEligible > 0
                                        ? "Not Eligible Yet"
                                        : "Schedule Donation"}
                                    </Button>
                                  </DialogTrigger>

                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Set Donation Appointment
                                      </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleDonateSubmit}>
                                      <div className="space-y-3">
                                        <Label>Date</Label>
                                        <Input
                                          type="date"
                                          value={donationFormData.date}
                                          onChange={(e) =>
                                            setDonationFormData({
                                              ...donationFormData,
                                              date: e.target.value,
                                            })
                                          }
                                        />
                                        <Label>Time</Label>
                                        <Input
                                          type="time"
                                          value={donationFormData.time}
                                          onChange={(e) =>
                                            setDonationFormData({
                                              ...donationFormData,
                                              time: e.target.value,
                                            })
                                          }
                                        />
                                        <Label>Hospital</Label>
                                        <Input
                                          value={
                                            selectedHospital?.hospital_name ||
                                            ""
                                          }
                                          readOnly
                                          disabled
                                        />
                                      </div>
                                      <DialogFooter className="pt-4">
                                        <Button
                                          type="submit"
                                          className="w-full"
                                        >
                                          Confirm Schedule
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </DialogContent>
                                </Dialog>
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
                  {/* 🆕 Show pending request if exists */}
                  {!loadingRequest && pendingRequest ? (
                    <div className="space-y-6">
                      <Card className="border-2 border-blue-500">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                  <HeartPulse className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold">
                                    Active Blood Request
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Your request is being processed
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  pendingRequest.status === "fulfilled"
                                    ? "default"
                                    : pendingRequest.status === "open" ||
                                      pendingRequest.status === "matched"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                              >
                                {pendingRequest.status}
                              </Badge>
                            </div>

                            {/* Request Info */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-4 border">
                              {/* Hospital Name */}
                              <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Hospital
                                  </p>
                                  <p className="font-semibold">
                                    {pendingRequest.hospital_name}
                                  </p>
                                </div>
                              </div>

                              {/* Blood Type and Units */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Blood Type */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Droplet className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Blood Type
                                    </p>
                                    <p className="font-semibold">
                                      {pendingRequest.blood_type}
                                    </p>
                                  </div>
                                </div>

                                {/* Units Needed */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Units Needed
                                    </p>
                                    <p className="font-semibold">
                                      {pendingRequest.units_needed} units
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Urgency and Request Date */}
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                {/* Urgency */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Urgency
                                    </p>
                                    <p className="font-semibold capitalize">
                                      {pendingRequest.urgency_level}
                                    </p>
                                  </div>
                                </div>

                                {/* Request Date */}
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Requested
                                    </p>
                                    <p className="font-semibold">
                                      {new Date(
                                        pendingRequest.request_date
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status Messages */}
                            {(pendingRequest.status === "open" ||
                              pendingRequest.status === "matched") && (
                              <div className="bg-yellow-50 rounded-lg p-4 flex items-start gap-3 border border-yellow-200">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-yellow-900">
                                    Request Under Review
                                  </p>
                                  <p className="text-xs text-yellow-800 mt-1">
                                    The blood center is checking their
                                    inventory. They will contact you if they can
                                    fulfill this request.
                                  </p>
                                </div>
                              </div>
                            )}

                            {pendingRequest.status === "fulfilled" && (
                              <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3 border border-green-200">
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-green-900">
                                    Request Fulfilled ✓
                                  </p>
                                  <p className="text-xs text-green-800 mt-1">
                                    Your blood request has been successfully
                                    fulfilled. Thank you for your patience!
                                  </p>
                                </div>
                              </div>
                            )}

                            {pendingRequest.status === "cancelled" && (
                              <div className="bg-red-50 rounded-lg p-4 flex items-start gap-3 border border-red-200">
                                <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-red-900">
                                    Request Cancelled
                                  </p>
                                  <p className="text-xs text-red-800 mt-1">
                                    This blood request has been cancelled.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 md:w-133">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setSelectedHospital({
                                    hospital_id: pendingRequest.hospital_id,
                                    hospital_name: pendingRequest.hospital_name,
                                    address: pendingRequest.address,
                                    latitude: pendingRequest.latitude,
                                    longitude: pendingRequest.longitude,
                                    contact_number:
                                      pendingRequest.contact_number,
                                  });
                                  setShowDirectionsMap(true);
                                }}
                              >
                                <Map className="h-4 w-4 mr-2" />
                                Get Directions
                              </Button>
                              {(pendingRequest.status === "open" ||
                                pendingRequest.status === "matched") && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-full bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                                  onClick={() =>
                                    handleCancelRequest(
                                      pendingRequest.request_id
                                    )
                                  }
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Request
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Continue Requesting Section */}
                      <div className="space-y-4 pt-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Other Blood Centers
                          </h3>
                          <p className="text-sm text-gray-600">
                            View other blood centers that have your blood type
                            in stock
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show this when no pending request
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">
                            Blood Stock Available
                          </h2>
                          <p className="text-muted-foreground">
                            Find nearby blood centers with your blood type in
                            stock
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blood Centers List */}
                  {loadingMatches ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : bloodCentersAvailable.length === 0 ? (
                    <Empty className="py-16">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <HeartHandshake className="h-8 w-8 text-red-700" />
                        </EmptyMedia>
                        <EmptyTitle className="text-lg font-semibold">
                          No blood stock records found
                        </EmptyTitle>
                        <EmptyDescription>
                          No blood bank centers with your blood type in stock at
                          the moment.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="space-y-4">
                      {bloodCentersAvailable.map((center, index) => (
                        <Card
                          key={center.hospital_id || `center-${index}`}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              {/* Left side: icon + main info */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-2 flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {center.hospital_name}
                                  </h3>

                                  <div className="flex flex-wrap gap-2">
                                    {center.blood_type_summary?.map((bt) => (
                                      <Badge
                                        key={bt.blood_type}
                                        className={`text-xs px-3 py-1 ${
                                          bt.units_available >= 10
                                            ? "bg-green-600 text-white font-semibold"
                                            : bt.units_available >= 5
                                            ? "bg-yellow-600 text-white"
                                            : "bg-red-600 text-white"
                                        }`}
                                      >
                                        {bt.blood_type} — {bt.units_available}{" "}
                                        units
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {center.address}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {center?.distance_km?.toFixed(1)} km away
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      {center.total_units_available ?? 0} units
                                      available
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {center.contact_number || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right side: buttons */}
                              <div className="flex flex-col gap-2 md:w-40">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHospital(center);
                                    setShowDirectionsMap(true);
                                  }}
                                >
                                  <Map className="h-4 w-4 mr-1" />
                                  Get Directions
                                </Button>

                                {/* Stock Details Dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                                    >
                                      <TextSearch className="h-4 w-4 mr-1" />
                                      Stock Details
                                    </Button>
                                  </DialogTrigger>

                                  <DialogContent className="sm:max-w-[400px]">
                                    <DialogHeader>
                                      <DialogTitle>
                                        {center.hospital_name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Available blood stock details
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-3 mt-4">
                                      {center.blood_type_summary?.length > 0 ? (
                                        center.blood_type_summary
                                          ?.sort(
                                            (a, b) =>
                                              b.units_available -
                                              a.units_available
                                          )
                                          .map((item, idx) => (
                                            <div
                                              key={idx}
                                              className={`flex justify-between items-center p-3 rounded-lg border ${
                                                idx === 0
                                                  ? "bg-green-50 border-green-200"
                                                  : "bg-gray-50 border-gray-200"
                                              }`}
                                            >
                                              <div>
                                                <span
                                                  className={`font-semibold ${
                                                    idx === 0
                                                      ? "text-green-700"
                                                      : "text-gray-700"
                                                  }`}
                                                >
                                                  {item.blood_type}
                                                </span>
                                              </div>
                                              <Badge
                                                className={
                                                  idx === 0
                                                    ? "bg-green-600"
                                                    : "bg-gray-500"
                                                }
                                              >
                                                {item.units_available} units
                                              </Badge>
                                            </div>
                                          ))
                                      ) : (
                                        <p className="text-center text-muted-foreground py-4">
                                          No stock details available
                                        </p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  size="sm"
                                  className="w-full bg-primary hover:bg-primary/90"
                                  onClick={() => {
                                    setSelectedCenterForRequest(center);
                                    setOpen(true);
                                  }}
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Request Blood
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Request History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Suspense fallback={<BloodDropLoader />}>
                    <RequestHistoryTab
                      accessToken={accessToken}
                      userId={user?.id}
                      setOpen={setOpen}
                      onCancelRequest={handleCancelRequest}
                      onSelectLocation={(location) => {
                        setSelectedHospital(location);
                        setShowDirectionsMap(true);
                      }}
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
