import { useState, Suspense, lazy, useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BloodDropLoader from "../../../utils/bloodDropLoader";
import { Shield, User } from "lucide-react";
import Navbar from "../../../components/ui/navbar";

const AdminOverviewTab = lazy(() => import("../components/AdminOverviewTab"));
const AdminUsersTab = lazy(() => import("../components/AdminUsersTab"));
const AdminHospitalTab = lazy(() => import("../components/AdminHospitalTab"));
const AdminAuditLogTab = lazy(() => import("../components/AdminAuditLogTab"));
import { AuthContext } from "../../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  // Mock data
  const adminProfile = {
    name: user.full_name,
    role: user.role,
    email: user.email,
    permissions: [
      "View Admin Dashboard",
      "Manage Hospitals",
      "Verify/Unverify Hospitals",
      "View Blood Stocks",
      "Manage User Directory",
      "View Request Analytics",
      "View Donation Analytics",
      "Monitor Blood Stock Alerts",
      "View Audit Logs",
    ],
    createdAt: user.created_at,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Admin Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
                <CardTitle>{adminProfile.name}</CardTitle>
                <CardDescription className="capitalize">
                  {adminProfile.role}
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-1">
                  {adminProfile.email}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Permissions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Permissions</h4>
                  <div className="space-y-1">
                    {adminProfile.permissions.map((permission) => (
                      <Badge
                        key={permission}
                        variant="outline"
                        className="text-xs"
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last login */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined:{" "}
                      {new Date(adminProfile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="hospital">Blood Centers</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <AdminOverviewTab />
                </Suspense>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <AdminUsersTab />
                </Suspense>
              </TabsContent>

              {/* Blood Centers Tab */}
              <TabsContent value="hospital" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <AdminHospitalTab />
                </Suspense>
              </TabsContent>

              {/* Audit Logs Tab */}
              <TabsContent value="audit" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <AdminAuditLogTab />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
