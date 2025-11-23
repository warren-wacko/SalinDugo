import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "../../../api/axios";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InventoryTab({ accessToken }) {
  const [bloodStock, setBloodStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedBlood, setSelectedBlood] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [donorAge, setDonorAge] = useState("");
  const [donorGender, setDonorGender] = useState("");
  const [units, setUnits] = useState(1);
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("user");
  const [civilStatus, setCivilStatus] = useState("");

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/stocks", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setBloodStock(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchStock();
  }, [accessToken]);

  const getStockStatus = (units) => {
    if (units === 0) return "critical";
    if (units < 5) return "low";
    if (units >= 20) return "full";
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

  const handleWalkInDonation = async () => {
    if (!firstName || !lastName || !selectedBlood || !units) {
      toast.error(
        "Please fill in required fields (First Name, Last Name, Blood Type, Units)"
      );
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const res = await api.post(
        "/api/stocks/walkin",
        {
          full_name: fullName,
          age: donorAge || null,
          gender: donorGender || null,
          blood_type: selectedBlood,
          units,
          contact_number: contactNumber || null,
          address: address || null,
          date_of_birth: dateOfBirth || null,
          middle_initial: middleInitial || null,
          title: title || null,
          role: role || "user",
          civil_status: civilStatus || null,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
      setFirstName("");
      setLastName("");
      setDonorAge("");
      setDonorGender("");
      setUnits(1);
      setContactNumber("");
      setAddress("");
      setDateOfBirth("");
      setMiddleInitial("");
      setTitle("");
      setRole("user");
      setCivilStatus("");
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record walk-in donation");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{stock.blood_type}</h3>
                    <Badge className={getStatusColor(status)}>{status}</Badge>
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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleInitial">Middle Initial</Label>
              <Input
                id="middleInitial"
                type="text"
                placeholder="M.I."
                maxLength={2}
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={donorAge}
                  onChange={(e) => setDonorAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={donorGender} onValueChange={setDonorGender}>
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
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="civilStatus">Civil Status</Label>
              <Select value={civilStatus} onValueChange={setCivilStatus}>
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

              <Label htmlFor="civilStatus">Title</Label>
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger id="title">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Mr.</SelectItem>
                  <SelectItem value="married">Mrs.</SelectItem>
                  <SelectItem value="widowed">Ms.</SelectItem>
                  <SelectItem value="separated">Dr.</SelectItem>
                  <SelectItem value="separated">Prof.</SelectItem>
                  <SelectItem value="separated">Engr.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="text"
                placeholder="Enter contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
              />
            </div>

            <Button
              className="w-full"
              disabled={!firstName || !lastName || !selectedBlood || !units}
              onClick={handleWalkInDonation}
            >
              Confirm Donation
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
