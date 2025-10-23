import { use, useState } from "react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, ArrowLeft, Info, ChevronDownIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AuthContext } from "../../../context/AuthContext";
import { useContext } from "react";
import {
  allowNumbersOnly,
  allowTextOnly,
} from "../../../utils/validationHelpers";
export default function SignUpPage() {
  const { user, login } = useContext(AuthContext);
  const navigate = Navigate;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    bloodType: "",
    gender: "",
    dateOfBirth: date,
    agreeToTerms: false,
    agreeToDataSharing: false,
    agreeToLocationAccess: false,
    agreeToPrivacyPolicy: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const payload = {
      full_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      blood_type: formData.bloodType,
      contact_number: formData.phone,
      date_of_birth: date ? date.toISOString().split("T")[0] : null,
      gender: formData.gender,
    };

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          // Transform backend errors → { email: "message", password: "message" }
          const formattedErrors = {};
          data.errors.forEach((err) => {
            formattedErrors[err.path] = err.msg;
          });
          setFieldErrors(formattedErrors);
        } else if (data.message) {
          setFieldErrors({ general: data.message });
        }
        return;
      }

      if (!data.user || !data.accessToken || !data.refreshToken) {
        setErrors(["Unexpected server response. Please contact support."]);
        return;
      }

      // Success: log in and redirect
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      switch (data.user.role) {
        case "user":
          navigate("/user-dashboard");
          break;
        case "hospital":
          navigate("/hospital-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setErrors(["Server error. Please try again."]);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SalinDugo</h1>
          </div>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register New Account</CardTitle>
            <CardDescription>
              Join our community and help save lives through blood donation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fieldErrors.general && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{fieldErrors.general}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBeforeInput={allowTextOnly}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      name="lastName"
                      onBeforeInput={allowTextOnly}
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    name="phone"
                    value={formData.phone}
                    onBeforeInput={allowNumbersOnly}
                    maxLength={11}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.contact_number && (
                    <p className="text-sm text-destructive mt-1">
                      {fieldErrors.contact_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-6">
                {/* Date of Birth */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="date" className="px-1">
                    Date of Birth
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal bg-neutral-50 border border-input text-neutral-600"
                      >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDate(date);
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gender" className="px-1">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
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

              {/* Account Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    {formData.password !== formData.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Medical Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) =>
                      handleSelectChange("bloodType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your blood type" />
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

              {/* Consent and Agreements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Consent & Agreements</h3>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please review and agree to the following terms to complete
                    your registration.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToTerms", checked)
                      }
                      required
                    />
                    <Label
                      htmlFor="agreeToTerms"
                      className="text-sm leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToDataSharing"
                      name="agreeToDataSharing"
                      checked={formData.agreeToDataSharing}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToDataSharing", checked)
                      }
                      required
                    />
                    <Label
                      htmlFor="agreeToDataSharing"
                      className="text-sm leading-relaxed"
                    >
                      I consent to sharing my medical and contact information
                      with compatible donors/recipients and healthcare
                      facilities
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToLocationAccess"
                      name="agreeToLocationAccess"
                      checked={formData.agreeToLocationAccess}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToLocationAccess", checked)
                      }
                      required
                    />
                    <Label
                      htmlFor="agreeToLocationAccess"
                      className="text-sm leading-relaxed"
                    >
                      I allow location access for proximity-based matching and
                      emergency notifications
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToPrivacyPolicy"
                      name="agreeToPrivacyPolicy"
                      checked={formData.agreeToPrivacyPolicy}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToPrivacyPolicy", checked)
                      }
                      required
                    />
                    <Label
                      htmlFor="agreeToPrivacyPolicy"
                      className="text-sm leading-relaxed"
                    >
                      I have read and agree to the{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Account
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
