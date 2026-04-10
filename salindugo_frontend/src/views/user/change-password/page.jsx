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

const ChangePasswordPage = () => {
  const { user } = useContext(AuthContext);

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
            />
          </div>

          <div>
            <Label className="mb-2">Confirm New Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
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
