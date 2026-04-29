import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
import api from "../../../api/axios";
import { AuthContext } from "../../../context/AuthContext";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const ChangePasswordPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
    {
      label: "At least one lowercase letter",
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      label: "At least one uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    { label: "At least one number", test: (pwd) => /\d/.test(pwd) },
    {
      label: "At least one special character",
      test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
    },
  ];

  const handleBack = () => {
    if (!user) return;

    if (user.role === "user") {
      navigate("/user-dashboard");
    } else if (user.role === "hospital") {
      navigate("/hospital-dashboard");
    } else {
      navigate("/");
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordChecks = passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.test(passwordData.newPassword),
  }));

  const isPasswordValid = passwordChecks.every((rule) => rule.passed);
  const passwordsMatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword === passwordData.confirmPassword;
  const hasPasswordMismatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword !== passwordData.confirmPassword;
  const canSubmit =
    passwordData.currentPassword &&
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    isPasswordValid &&
    passwordsMatch &&
    !loading;

  const passwordFields = [
    {
      id: "currentPassword",
      name: "currentPassword",
      label: "Current Password",
      value: passwordData.currentPassword,
      placeholder: "Enter your current password",
      autoComplete: "current-password",
    },
    {
      id: "newPassword",
      name: "newPassword",
      label: "New Password",
      value: passwordData.newPassword,
      placeholder: "Create a stronger password",
      autoComplete: "new-password",
      onFocus: () => setIsPasswordFocused(true),
      onBlur: () => setIsPasswordFocused(false),
    },
    {
      id: "confirmPassword",
      name: "confirmPassword",
      label: "Confirm New Password",
      value: passwordData.confirmPassword,
      placeholder: "Repeat your new password",
      autoComplete: "new-password",
      onFocus: () => setIsPasswordFocused(true),
      onBlur: () => setIsPasswordFocused(false),
    },
  ];

  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("All fields are required");
      return;
    }

    if (!isPasswordValid) {
      toast.error("New password does not meet the security requirements");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password updated successfully");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,oklch(0.99_0_0)_0%,oklch(0.965_0.01_25)_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="ghost"
          className="mb-6 gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-background/70 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-2xl">Change Password</CardTitle>
                  <CardDescription className="mt-1">
                    Keep your SalinDugo account protected with a password that
                    is hard to guess and unique to this system.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              {passwordFields.map((field) => {
                const isVisible = showPasswords[field.name];

                return (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <div className="relative">
                      <Input
                        id={field.id}
                        type={isVisible ? "text" : "password"}
                        name={field.name}
                        value={field.value}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                        onChange={handlePasswordChange}
                        onFocus={field.onFocus}
                        onBlur={field.onBlur}
                        className="h-11 pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1.5 top-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => togglePasswordVisibility(field.name)}
                        aria-label={
                          isVisible
                            ? `Hide ${field.label.toLowerCase()}`
                            : `Show ${field.label.toLowerCase()}`
                        }
                      >
                        {isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {hasPasswordMismatch && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>New password and confirmation do not match.</span>
                </div>
              )}

              {passwordsMatch && (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>New password confirmation matches.</span>
                </div>
              )}

              <Button
                onClick={handlePasswordSave}
                disabled={!canSubmit}
                className="h-11 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Password Health</CardTitle>
                    <CardDescription>
                      {isPasswordValid
                        ? "Your new password meets every rule."
                        : "Complete each requirement before saving."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {passwordChecks.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      rule.passed
                        ? "border-green-200 bg-green-50 text-green-700"
                        : passwordData.newPassword || isPasswordFocused
                          ? "border-destructive/20 bg-destructive/5 text-destructive"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {rule.passed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Security note</p>
              <p className="mt-1">
                Use a password you do not use anywhere else. After updating it,
                keep your account email and contact details current so recovery
                stays reliable.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
