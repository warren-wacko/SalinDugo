import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Heart,
  Shield,
  Users,
  Building2,
  Activity,
  Settings,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  Database,
  UserCheck,
  UserX,
  Brain,
  Zap,
} from "lucide-react";
import Navbar from "../../../components/ui/navbar";

export default function AdminDashboard() {
  const [selectedUserType, setSelectedUserType] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const adminProfile = {
    name: "Admin User",
    role: "System Administrator",
    permissions: [
      "Full Access",
      "User Management",
      "System Settings",
      "AI Monitoring",
    ],
    lastLogin: "2024-02-20 09:30",
  };

  const systemStats = {
    totalUsers: 15847,
    activeDonors: 8923,
    activeRecipients: 2156,
    hospitals: 234,
    totalDonations: 45678,
    successfulMatches: 12456,
    aiAccuracy: 94.2,
    systemUptime: 99.8,
  };

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      type: "Donor",
      bloodType: "O+",
      location: "Manila",
      status: "Active",
      joinDate: "2024-01-15",
      lastActivity: "2 hours ago",
      donations: 12,
      verified: true,
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      type: "Recipient",
      bloodType: "A+",
      location: "Quezon City",
      status: "Active",
      joinDate: "2024-02-10",
      lastActivity: "1 day ago",
      requests: 3,
      verified: true,
    },
    {
      id: 3,
      name: "St. Mary's Hospital",
      email: "admin@stmarys.ph",
      type: "Hospital",
      bloodType: "All Types",
      location: "Manila",
      status: "Active",
      joinDate: "2023-12-01",
      lastActivity: "30 minutes ago",
      transactions: 456,
      verified: true,
    },
    {
      id: 4,
      name: "Robert Garcia",
      email: "robert.garcia@email.com",
      type: "Donor",
      bloodType: "B-",
      location: "Makati",
      status: "Suspended",
      joinDate: "2023-11-20",
      lastActivity: "1 week ago",
      donations: 8,
      verified: false,
    },
  ];

  const auditLogs = [
    {
      id: 1,
      timestamp: "2024-02-20 14:30:15",
      user: "admin@salindugo.com",
      action: "User Created",
      target: "john.doe@email.com",
      details: "New donor account created",
      severity: "Info",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      timestamp: "2024-02-20 13:45:22",
      user: "system",
      action: "AI Match Generated",
      target: "Recipient #1234",
      details: "5 compatible donors found with 95% accuracy",
      severity: "Info",
      ipAddress: "System",
    },
    {
      id: 3,
      timestamp: "2024-02-20 12:15:08",
      user: "hospital@stmarys.ph",
      action: "Blood Stock Updated",
      target: "O+ Blood Type",
      details: "Stock level changed from 45 to 38 units",
      severity: "Warning",
      ipAddress: "203.177.45.12",
    },
    {
      id: 4,
      timestamp: "2024-02-20 11:30:45",
      user: "admin@salindugo.com",
      action: "User Suspended",
      target: "robert.garcia@email.com",
      details: "Account suspended due to policy violation",
      severity: "Critical",
      ipAddress: "192.168.1.100",
    },
  ];

  const aiMetrics = [
    {
      model: "Weighted KNN",
      purpose: "Donor-Recipient Matching",
      accuracy: 96.8,
      predictions: 1247,
      successRate: 94.2,
      lastUpdated: "2 hours ago",
      status: "Optimal",
    },
    {
      model: "Random Forest",
      purpose: "Transfusion Success Prediction",
      accuracy: 92.4,
      predictions: 856,
      successRate: 89.7,
      lastUpdated: "4 hours ago",
      status: "Good",
    },
    {
      model: "Decision Tree",
      purpose: "Urgency Prioritization",
      accuracy: 88.9,
      predictions: 634,
      successRate: 91.3,
      lastUpdated: "1 hour ago",
      status: "Good",
    },
    {
      model: "ARIMA",
      purpose: "Blood Demand Forecasting",
      accuracy: 85.6,
      predictions: 423,
      successRate: 87.2,
      lastUpdated: "6 hours ago",
      status: "Needs Attention",
    },
  ];

  const systemSettings = {
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      criticalAlertsOnly: false,
    },
    matching: {
      maxDistance: 50,
      compatibilityThreshold: 85,
      urgencyWeighting: 0.7,
      proximityWeighting: 0.3,
    },
    security: {
      twoFactorRequired: true,
      sessionTimeout: 30,
      passwordComplexity: "High",
      auditLogging: true,
    },
  };

  const getUserTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "donor":
        return "bg-green-100 text-green-800";
      case "recipient":
        return "bg-blue-100 text-blue-800";
      case "hospital":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 text-white";
      case "suspended":
        return "bg-red-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getModelStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "optimal":
        return "bg-green-500 text-white";
      case "good":
        return "bg-blue-500 text-white";
      case "needs attention":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
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
                <CardDescription>{adminProfile.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Last login: {adminProfile.lastLogin}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uptime:</span>
                      <span className="font-medium text-green-600">
                        {systemStats.systemUptime}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI Accuracy:</span>
                      <span className="font-medium text-blue-600">
                        {systemStats.aiAccuracy}%
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                <TabsTrigger value="ai">AI Monitoring</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">System Overview</h2>
                  <p className="text-muted-foreground">
                    Platform statistics and key metrics
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {systemStats.totalUsers.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Users
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Heart className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {systemStats.activeDonors.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active Donors
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Building2 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {systemStats.hospitals}
                      </div>
                      <p className="text-sm text-muted-foreground">Hospitals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {systemStats.totalDonations.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Donations
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth</CardTitle>
                      <CardDescription>
                        New registrations over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Donors</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-green-200 rounded">
                              <div className="w-20 h-2 bg-green-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">8,923</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Recipients</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-blue-200 rounded">
                              <div className="w-6 h-2 bg-blue-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">2,156</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Hospitals</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-purple-200 rounded">
                              <div className="w-3 h-2 bg-purple-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">234</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Performance</CardTitle>
                      <CardDescription>
                        Key performance indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Successful Matches</span>
                            <span className="font-medium">
                              {systemStats.successfulMatches.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>AI Accuracy</span>
                            <span className="font-medium">
                              {systemStats.aiAccuracy}%
                            </span>
                          </div>
                          <Progress
                            value={systemStats.aiAccuracy}
                            className="h-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>System Uptime</span>
                            <span className="font-medium">
                              {systemStats.systemUptime}%
                            </span>
                          </div>
                          <Progress
                            value={systemStats.systemUptime}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* User Management Tab */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-muted-foreground">
                      Manage donors, recipients, hospitals, and staff
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select
                    value={selectedUserType}
                    onValueChange={setSelectedUserType}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="donor">Donors</SelectItem>
                      <SelectItem value="recipient">Recipients</SelectItem>
                      <SelectItem value="hospital">Hospitals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                <AvatarInitials name={user.name} />
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{user.name}</h3>
                                <Badge className={getUserTypeColor(user.type)}>
                                  {user.type}
                                </Badge>
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status}
                                </Badge>
                                {user.verified && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Blood Type: {user.bloodType}</span>
                                <span>Location: {user.location}</span>
                                <span>Joined: {user.joinDate}</span>
                                <span>Last Active: {user.lastActivity}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              {user.status === "Active" ? (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Audit Logs Tab */}
              <TabsContent value="audit" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Audit Logs</h2>
                    <p className="text-muted-foreground">
                      Track system activity and data changes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTimeRange}
                      onValueChange={setSelectedTimeRange}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">Last 24h</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity}
                              </Badge>
                              <span className="font-semibold">
                                {log.action}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                by {log.user}
                              </span>
                            </div>
                            <p className="text-sm">
                              <span className="font-medium">Target:</span>{" "}
                              {log.target}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {log.details}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{log.timestamp}</span>
                              <span>IP: {log.ipAddress}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* AI Monitoring Tab */}
              <TabsContent value="ai" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">AI Model Monitoring</h2>
                  <p className="text-muted-foreground">
                    Monitor AI outputs for matching and forecasting accuracy
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {aiMetrics.map((model) => (
                    <Card key={model.model}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{model.model}</h3>
                              <p className="text-sm text-muted-foreground">
                                {model.purpose}
                              </p>
                            </div>
                            <Badge
                              className={getModelStatusColor(model.status)}
                            >
                              {model.status}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Accuracy:</span>
                              <span className="font-medium">
                                {model.accuracy}%
                              </span>
                            </div>
                            <Progress value={model.accuracy} className="h-2" />

                            <div className="flex justify-between text-sm">
                              <span>Success Rate:</span>
                              <span className="font-medium">
                                {model.successRate}%
                              </span>
                            </div>
                            <Progress
                              value={model.successRate}
                              className="h-2"
                            />

                            <div className="flex justify-between text-sm">
                              <span>Predictions:</span>
                              <span className="font-medium">
                                {model.predictions.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Last updated: {model.lastUpdated}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Brain className="h-3 w-3 mr-1" />
                              Retrain
                            </Button>
                            <Button size="sm" variant="outline">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* System Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">System Settings</h2>
                  <p className="text-muted-foreground">
                    Configure notification rules, geographic filters, and access
                    controls
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>
                        Configure system-wide notification preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <Switch
                          id="email-alerts"
                          checked={systemSettings.notifications.emailAlerts}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sms-alerts">SMS Alerts</Label>
                        <Switch
                          id="sms-alerts"
                          checked={systemSettings.notifications.smsAlerts}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications">
                          Push Notifications
                        </Label>
                        <Switch
                          id="push-notifications"
                          checked={
                            systemSettings.notifications.pushNotifications
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="critical-only">
                          Critical Alerts Only
                        </Label>
                        <Switch
                          id="critical-only"
                          checked={
                            systemSettings.notifications.criticalAlertsOnly
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Matching Algorithm</CardTitle>
                      <CardDescription>
                        Configure AI matching parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-distance">
                          Maximum Distance (km)
                        </Label>
                        <Input
                          id="max-distance"
                          type="number"
                          value={systemSettings.matching.maxDistance}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compatibility-threshold">
                          Compatibility Threshold (%)
                        </Label>
                        <Input
                          id="compatibility-threshold"
                          type="number"
                          value={systemSettings.matching.compatibilityThreshold}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgency-weight">
                          Urgency Weighting
                        </Label>
                        <Input
                          id="urgency-weight"
                          type="number"
                          step="0.1"
                          value={systemSettings.matching.urgencyWeighting}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proximity-weight">
                          Proximity Weighting
                        </Label>
                        <Input
                          id="proximity-weight"
                          type="number"
                          step="0.1"
                          value={systemSettings.matching.proximityWeighting}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Configure system security parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="two-factor">
                          Two-Factor Authentication Required
                        </Label>
                        <Switch
                          id="two-factor"
                          checked={systemSettings.security.twoFactorRequired}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">
                          Session Timeout (minutes)
                        </Label>
                        <Input
                          id="session-timeout"
                          type="number"
                          value={systemSettings.security.sessionTimeout}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-complexity">
                          Password Complexity
                        </Label>
                        <Select
                          value={systemSettings.security.passwordComplexity}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="audit-logging">Audit Logging</Label>
                        <Switch
                          id="audit-logging"
                          checked={systemSettings.security.auditLogging}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Database Management</CardTitle>
                      <CardDescription>
                        System maintenance and data management
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Optimize Performance
                      </Button>
                      <Button
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export System Data
                      </Button>
                      <Button
                        className="w-full bg-transparent text-red-600 hover:text-red-700"
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Purge Old Data
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Changes</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
