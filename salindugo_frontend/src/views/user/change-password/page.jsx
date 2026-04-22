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
import { Info } from "lucide-react";

const ChangePasswordPage = () => {
  const { user } = useContext(AuthContext);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
      navigate("/"); // fallback (admin or unknown)
    }
  };
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("All fields are required");
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

  const passwordChecks = passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.test(passwordData.newPassword),
  }));

  const isPasswordValid = passwordChecks.every((r) => r.passed);
  const hasInvalidPassword = passwordChecks.some((r) => !r.passed);

  return (
    <div className="max-w-md mx-auto mt-10">
      <Button variant="ghost" className="mb-4" onClick={handleBack}>
        ← Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2">Current Password</Label>
            <Input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
          </div>

          <div>
            <Label className="mb-2">New Password</Label>
            <Input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            {isPasswordFocused && (
              <div className="mt-2 space-y-1">
                {passwordChecks.map((rule, index) => (
                  <p
                    key={index}
                    className={`text-sm mt-1 flex items-center gap-1 ${
                      rule.passed ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    <Info className="h-3 w-3" />
                    {rule.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2">Confirm New Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
          </div>

          <Button onClick={handlePasswordSave} disabled={loading}>
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
