"use client";

import { useState, useContext } from "react";
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
import { AuthContext } from "@/context/AuthContext";
import { allowNumbersOnly, allowTextOnly } from "@/utils/validationHelpers";

export default function SignUpPage() {
  const { login } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    title: "",
    firstName: "",
    middleInitial: "",
    lastName: "",
    phone: "",
    bloodType: "",
    gender: "",
    age: "",
    civilStatus: "",
    dateOfBirth: date,
    agreeToTerms: false,
    agreeToDataSharing: false,
    agreeToLocationAccess: false,
    agreeToPrivacyPolicy: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "age" && value > 150) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    setFieldErrors({});
    setIsSubmitting(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setIsSubmitting(false);
      return;
    }

    if (!date) {
      setFieldErrors({ dateOfBirth: "Please select your date of birth" });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      full_name: `${formData.firstName} ${
        formData.middleInitial ? formData.middleInitial + ". " : ""
      }${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      blood_type: formData.bloodType,
      contact_number: formData.phone,
      date_of_birth: date ? date.toISOString().split("T")[0] : null,
      gender: formData.gender,
      civil_status: formData.civilStatus,
      title: formData.title,
      age: formData.age,
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
          // Transform backend errors
          const formattedErrors = {};
          data.errors.forEach((err) => {
            formattedErrors[err.path] = err.msg;
          });
          setFieldErrors(formattedErrors);
        } else if (data.message) {
          setFieldErrors({ general: data.message });
        }
        setIsSubmitting(false);
        return;
      }

      if (!data.user || !data.accessToken || !data.refreshToken) {
        setErrors(["Unexpected server response. Please contact support."]);
        setIsSubmitting(false);
        return;
      }

      // Success: log in and redirect
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Handle navigation based on user role (customize as needed)
      switch (data.user.role) {
        case "user":
          window.location.href = "/user-dashboard";
          break;
        case "hospital":
          window.location.href = "/hospital-dashboard";
          break;
        case "admin":
          window.location.href = "/admin-dashboard";
          break;
        default:
          window.location.href = "/";
      }
    } catch (err) {
      setErrors(["Server error. Please try again."]);
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = (e) => {
    e.preventDefault();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <a
            href="/"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </a>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">SalinDugo</h1>
          </div>
          <p className="text-muted-foreground text-balance">
            Create your account to get started
          </p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl">Register New Account</CardTitle>
            <CardDescription className="text-base">
              Join our community and help save lives through blood donation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fieldErrors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{fieldErrors.general}</AlertDescription>
              </Alert>
            )}
            {errors.length > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errors[0]}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>
                </div>

                {/* Title select field */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Select
                    value={formData.title}
                    onValueChange={(value) =>
                      handleSelectChange("title", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Engr.">Engr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBeforeInput={allowTextOnly}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="middleInitial">M.I.</Label>
                    <Input
                      id="middleInitial"
                      placeholder="D"
                      name="middleInitial"
                      value={formData.middleInitial}
                      onChange={handleChange}
                      onBeforeInput={allowTextOnly}
                      maxLength={1}
                      className="h-11 text-center uppercase"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Dela Cruz"
                      name="lastName"
                      onBeforeInput={allowTextOnly}
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                    {fieldErrors.email && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">
                      Age <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="21"
                      name="age"
                      value={formData.age}
                      onBeforeInput={allowNumbersOnly}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                    {fieldErrors.age && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {fieldErrors.age}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789"
                      name="phone"
                      value={formData.phone}
                      onBeforeInput={allowNumbersOnly}
                      maxLength={11}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                    {fieldErrors.contact_number && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {fieldErrors.contact_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          type="button"
                          className="w-full h-11 justify-between font-normal hover:bg-accent bg-transparent"
                        >
                          <span
                            className={
                              date ? "text-foreground" : "text-muted-foreground"
                            }
                          >
                            {date ? date.toLocaleDateString() : "Select date"}
                          </span>
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
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
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldErrors.dateOfBirth && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {fieldErrors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Civil Status */}
                  <div className="space-y-2">
                    <Label htmlFor="civilStatus">
                      Civil Status <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.civilStatus}
                      onValueChange={(value) =>
                        handleSelectChange("civilStatus", value)
                      }
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">Account Security</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                    {fieldErrors.password && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                    {formData.password !== formData.confirmPassword &&
                      formData.confirmPassword && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Passwords do not match.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">Medical Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">
                    Blood Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) =>
                      handleSelectChange("bloodType", value)
                    }
                    required
                  >
                    <SelectTrigger className="h-11">
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
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h3 className="text-lg font-semibold">
                    Consent & Agreements
                  </h3>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <AlertDescription className="text-sm">
                    Please review and accept the following to complete your
                    registration
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 bg-muted/30 p-5 rounded-lg border">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToTerms", checked)
                      }
                      required
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Terms and Conditions{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I have read and agree to the{" "}
                        <a
                          href="/terms"
                          className="text-primary hover:underline font-medium"
                        >
                          Terms and Conditions
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy"
                      checked={formData.agreeToPrivacyPolicy}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToPrivacyPolicy", checked)
                      }
                      required
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="privacy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Privacy Policy{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand and accept the{" "}
                        <a
                          href="/privacy"
                          className="text-primary hover:underline font-medium"
                        >
                          Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataSharing"
                      checked={formData.agreeToDataSharing}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToDataSharing", checked)
                      }
                      required
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="dataSharing"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Data Sharing Consent{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I consent to sharing my medical information with
                        healthcare providers for blood donation purposes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="location"
                      checked={formData.agreeToLocationAccess}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("agreeToLocationAccess", checked)
                      }
                      required
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="location"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Location Access{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I allow the app to access my location to find nearby
                        blood donation centers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in here
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
