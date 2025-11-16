import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  User,
  Activity,
  Search,
  Navigation,
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useEffect } from "react";
import axios from "axios";
import { allowNumbersOnly } from "@/utils/validationHelpers";
// 🗺 Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../../api/axios";
// Fix default marker issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// 🧭 Custom Location Picker
function LocationPicker({ position, setPosition, isEditing, setFormData }) {
  useMapEvents({
    click(e) {
      if (isEditing) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });

        // Reverse geocode using Nominatim (OpenStreetMap)
        api
          .get(`/api/location/reverse?lat=${lat}&lon=${lng}`)
          .then((res) => {
            const data = res.data;
            const addr = data.address || {};

            setFormData((prev) => ({
              ...prev,
              address: data.display_name || "",
              barangay: addr.suburb || addr.village || addr.neighbourhood || "",
              city:
                addr.city ||
                addr.municipality ||
                addr.town ||
                addr.county ||
                "",
              province:
                addr.state || addr.region || addr["state_district"] || "",
              region: addr.region || addr.state || "",
              zip_code: addr.postcode || "",
              latitude: lat.toFixed(5),
              longitude: lng.toFixed(5),
            }));
          })
          .catch(() => {});
      }
    },
  });

  return position ? <Marker position={position}></Marker> : null;
}

export default function ProfilePage() {
  const { user, updateUser, isLoading: authLoading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    contact_number: "",
    date_of_birth: "",
    blood_type: "",
    // Medical Info
    weight: "",
    height: "",
    medical_conditions: "",
    allergies: "",
    // Address Info
    address: "",
    region: "",
    barangay: "",
    city: "",
    province: "",
    zip_code: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(true);

  const handleBackClick = () => {
    if (!profile?.profile_completed) {
      setShowDialog(true);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    // 🆕 Wait for both auth and user to be loaded
    if (authLoading || !user) {
      console.log("Waiting for auth:", { authLoading, userExists: !!user });
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/users/${user.id}`);
        setProfile(res.data);
        setFormData({
          firstName: res.data.full_name?.split(" ")[0] || "",
          lastName: res.data.full_name?.split(" ").slice(1).join(" ") || "",
          gender: res.data.gender || "",
          email: res.data.email || "",
          contact_number: res.data.contact_number || "",
          date_of_birth: res.data.date_of_birth || "",
          blood_type: res.data.blood_type || "",
          weight: res.data.weight || "",
          height: res.data.height || "",
          medical_conditions: res.data.medical_conditions || "",
          allergies: res.data.allergies || "",
          address: res.data.address || "",
          city: res.data.city || "",
          barangay: res.data.barangay || "",
          region: res.data.region || "",
          province: res.data.province || "",
          zip_code: res.data.zip_code || "",
          latitude: res.data.latitude || "",
          longitude: res.data.longitude || "",
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, user]);

  // 🆕 Show loading state while waiting
  if (authLoading || loading || !user) {
    console.log("Showing loading state:", {
      authLoading,
      loading,
      userExists: !!user,
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleAddressSearch = async () => {
    if (!formData.searchQuery) return;

    try {
      const res = await api.get(
        `/api/location/search?q=${encodeURIComponent(formData.searchQuery)}`
      );
      const data = res.data;

      if (data.length === 0) {
        alert("No results found. Please try again.");
        return;
      }

      const place = data[0];
      const { lat, lon, display_name, address } = place;

      setFormData((prev) => ({
        ...prev,
        address: display_name,
        city:
          address.city ||
          address.town ||
          address.municipality ||
          address.county ||
          "",
        province: address.state || address.region || "",
        region: address.region || address.state || "",
        zip_code: address.postcode || "",
        latitude: parseFloat(lat).toFixed(5),
        longitude: parseFloat(lon).toFixed(5),
      }));
    } catch (error) {
      console.error("Error fetching address:", error);
      alert("Failed to fetch address. Try again later.");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        contact_number: formData.contact_number,
        weight: formData.weight,
        height: formData.height,
        medical_conditions: formData.medical_conditions,
        allergies: formData.allergies,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        region: formData.region,
        zip_code: formData.zip_code,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const res = await api.patch(`/api/users/${user.id}`, payload);
      setProfile(res.data.user);

      updateUser({
        profile_completed: true,
        city: res.data.user.city,
        province: res.data.user.province,
        contact_number: res.data.user.contact_number,
      });

      setIsEditing(false);
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved.",
      });
    } catch (err) {
      toast.error("Please fill in all fields", {
        description: "Put N/A if not applicable.",
      });
      console.error("Update failed:", err);
    }
  };

  const position = {
    lat: parseFloat(formData.latitude) || 14.5995,
    lng: parseFloat(formData.longitude) || 120.9842,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Profile First</AlertDialogTitle>
            <AlertDialogDescription>
              New users must complete their profile before accessing the
              dashboard. Please fill in all your information to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  Profile Settings
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback>
                    <AvatarInitials
                      name={`${formData.firstName} ${formData.lastName}`}
                    />
                  </AvatarFallback>
                </Avatar>
                <CardTitle>
                  {formData.firstName} {formData.lastName}
                </CardTitle>
                <CardDescription>Blood Donor & Recipient</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formData.blood_type}
                  </div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.contact_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {formData.city}, {formData.province}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Badge variant="secondary" className="w-full justify-center">
                    <Activity className="h-3 w-3 mr-1" />
                    Active Member
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Profile Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Phone Number</Label>
                    <Input
                      id="contact_number"
                      name="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onBeforeInput={allowNumbersOnly}
                      maxLength={11}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="gender" className="px-1">
                      Gender
                    </Label>
                    <Select
                      value={formData.gender}
                      disabled
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth.split("T")[0]}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type</Label>
                    <Select
                      value={formData.blood_type}
                      onValueChange={handleChange}
                      disabled
                      name="blood_type"
                    >
                      <SelectTrigger id="blood_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Medical Information
                </CardTitle>
                <CardDescription>
                  Provide your medical details for better matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onBeforeInput={allowNumbersOnly}
                      onChange={handleChange}
                      disabled={!isEditing}
                      name="weight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      onBeforeInput={allowNumbersOnly}
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="List any medical conditions (e.g., diabetes, hypertension)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="List any allergies (e.g., medications, food)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Geocoding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Address
                </CardTitle>
                <CardDescription>
                  Update your address and use geocoding to set your precise
                  location for better matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 🧭 Address Search */}
                <div className="flex gap-2">
                  <Input
                    id="searchAddress"
                    placeholder="Search address (e.g., Dumaguete City)"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                      }))
                    }
                    value={formData.searchQuery || ""}
                    disabled={!isEditing}
                  />
                  <Button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={!isEditing}
                  >
                    <Search className="h-4 w-4 mr-1" /> Search
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Click the map or type to update your full address"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <Label>Tap on the map to update your location</Label>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <LocationPicker
                      position={position}
                      setPosition={(pos) =>
                        setFormData((prev) => ({
                          ...prev,
                          latitude: pos.lat.toFixed(5),
                          longitude: pos.lng.toFixed(5),
                        }))
                      }
                      setFormData={setFormData}
                      isEditing={isEditing}
                    />
                  </MapContainer>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      value={formData.latitude}
                      disabled
                      onBeforeInput={allowNumbersOnly}
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      value={formData.longitude}
                      disabled
                      onBeforeInput={allowNumbersOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
