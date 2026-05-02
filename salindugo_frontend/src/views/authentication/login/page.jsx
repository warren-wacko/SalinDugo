import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Heart, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", submit: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Reset password modal state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const validateForm = () => {
    const newErrors = { email: "", password: "", submit: "" };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({ email: "", password: "", submit: "" });
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Login successful! Redirecting...");
        login(data.user, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        setTimeout(() => {
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
        }, 500);
      } else {
        setErrors((prev) => ({
          ...prev,
          submit:
            data.message || "Login failed. Please check your credentials.",
        }));
        toast.error(data.message || "An error occurred during login.");
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: "Server error. Please try again later.",
      }));
      toast.error(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!resetEmail.trim()) {
      setResetError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setResetSuccess("Check your email for reset instructions");
        setResetEmail("");
        setTimeout(() => {
          // Close dialog after success
          document
            .querySelector('[role="dialog"] button[aria-label="Close"]')
            ?.click();
        }, 2000);
      } else {
        setResetError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error(err);
      setResetError("Server error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">SalinDugo</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  {successMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.email ? "border-red-500" : ""}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-500 text-sm">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field with Toggle */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-red-500 text-sm">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center space-y-3">
                {/* Forgot Password Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      Forgot your password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email to receive password reset instructions
                      </DialogDescription>
                    </DialogHeader>

                    {resetError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {resetError}
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        {resetSuccess}
                      </div>
                    )}

                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetError) setResetError("");
                      }}
                      disabled={resetLoading}
                      className="mt-2"
                    />

                    <DialogFooter className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetEmail("");
                          setResetError("");
                          setResetSuccess("");
                        }}
                        disabled={resetLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleForgotSubmit}
                        disabled={resetLoading}
                      >
                        {resetLoading ? "Sending..." : "Send Email"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by secure authentication
        </p>
      </div>
    </div>
  );
}
