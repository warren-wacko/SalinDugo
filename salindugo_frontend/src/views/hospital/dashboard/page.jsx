import { useState, useEffect, useContext, Suspense, lazy } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  MapPin,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  BarChart3,
  Building2,
  Phone,
  Download,
  Loader2,
} from "lucide-react";

import Navbar from "../../../components/ui/navbar";
const BloodRequestsTab = lazy(() => import("../components/BloodRequestsTab"));
const DonationSchedulesTab = lazy(() =>
  import("../components/DonationSchedulesTab")
);
import BloodDropLoader from "../../../utils/bloodDropLoader";
export default function HospitalDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [loading, setLoading] = useState(true);

  // Mock data
  const hospitalProfile = {
    name: "St. Mary's Hospital",
    location: "Manila, Metro Manila",
    type: "General Hospital",
    capacity: "500 beds",
    bloodBankLicense: "BB-2024-001",
    contactPerson: "Dr. Maria Cruz",
    phone: "+63 2 8123 4567",
  };

  const bloodStock = [
    {
      bloodType: "O+",
      currentUnits: 45,
      minimumRequired: 50,
      maximumCapacity: 100,
      expiringIn7Days: 8,
      status: "Low",
      trend: "decreasing",
      lastUpdated: "2 hours ago",
    },
    {
      bloodType: "O-",
      currentUnits: 12,
      minimumRequired: 25,
      maximumCapacity: 50,
      expiringIn7Days: 2,
      status: "Critical",
      trend: "decreasing",
      lastUpdated: "1 hour ago",
    },
    {
      bloodType: "A+",
      currentUnits: 78,
      minimumRequired: 40,
      maximumCapacity: 80,
      expiringIn7Days: 5,
      status: "Good",
      trend: "stable",
      lastUpdated: "30 minutes ago",
    },
    {
      bloodType: "A-",
      currentUnits: 22,
      minimumRequired: 20,
      maximumCapacity: 40,
      expiringIn7Days: 3,
      status: "Good",
      trend: "increasing",
      lastUpdated: "1 hour ago",
    },
    {
      bloodType: "B+",
      currentUnits: 35,
      minimumRequired: 30,
      maximumCapacity: 60,
      expiringIn7Days: 4,
      status: "Good",
      trend: "stable",
      lastUpdated: "45 minutes ago",
    },
    {
      bloodType: "B-",
      currentUnits: 8,
      minimumRequired: 15,
      maximumCapacity: 30,
      expiringIn7Days: 1,
      status: "Low",
      trend: "decreasing",
      lastUpdated: "2 hours ago",
    },
    {
      bloodType: "AB+",
      currentUnits: 18,
      minimumRequired: 15,
      maximumCapacity: 30,
      expiringIn7Days: 2,
      status: "Good",
      trend: "stable",
      lastUpdated: "1 hour ago",
    },
    {
      bloodType: "AB-",
      currentUnits: 5,
      minimumRequired: 10,
      maximumCapacity: 20,
      expiringIn7Days: 1,
      status: "Low",
      trend: "decreasing",
      lastUpdated: "3 hours ago",
    },
  ];

  const demandForecasting = [
    {
      bloodType: "O+",
      currentDemand: "High",
      predictedShortage: "3 days",
      recommendedOrder: 25,
      confidence: 92,
      model: "LSTM",
    },
    {
      bloodType: "O-",
      currentDemand: "Critical",
      predictedShortage: "1 day",
      recommendedOrder: 15,
      confidence: 95,
      model: "ARIMA",
    },
    {
      bloodType: "A+",
      currentDemand: "Normal",
      predictedShortage: "7+ days",
      recommendedOrder: 0,
      confidence: 88,
      model: "Prophet",
    },
    {
      bloodType: "B-",
      currentDemand: "High",
      predictedShortage: "2 days",
      recommendedOrder: 10,
      confidence: 90,
      model: "LSTM",
    },
  ];

  const availableDonors = [
    {
      id: 1,
      initials: "JD",
      bloodType: "O-",
      distance: "1.2 km",
      lastDonation: "2023-12-15",
      totalDonations: 12,
      availability: "Available now",
      compatibilityScore: 98,
      verified: true,
    },
    {
      id: 2,
      initials: "MS",
      bloodType: "O+",
      distance: "2.8 km",
      lastDonation: "2024-01-10",
      totalDonations: 8,
      availability: "Available today",
      compatibilityScore: 95,
      verified: true,
    },
    {
      id: 3,
      initials: "AR",
      bloodType: "B-",
      distance: "3.5 km",
      lastDonation: "2023-11-20",
      totalDonations: 15,
      availability: "Available tomorrow",
      compatibilityScore: 92,
      verified: true,
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      type: "Donation",
      bloodType: "A+",
      units: 1,
      donor: "Anonymous",
      timestamp: "2024-02-20 14:30",
      status: "Processed",
    },
    {
      id: 2,
      type: "Transfusion",
      bloodType: "O-",
      units: 2,
      recipient: "Patient #1234",
      timestamp: "2024-02-20 12:15",
      status: "Completed",
    },
    {
      id: 3,
      type: "Transfer In",
      bloodType: "B+",
      units: 5,
      source: "Philippine Red Cross",
      timestamp: "2024-02-20 09:45",
      status: "Received",
    },
    {
      id: 4,
      type: "Expired",
      bloodType: "AB-",
      units: 1,
      reason: "Past expiration date",
      timestamp: "2024-02-20 08:00",
      status: "Disposed",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "critical",
      title: "Critical Stock Alert",
      message: "O- blood stock below minimum threshold (12/25 units)",
      time: "15 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "expiring",
      title: "Units Expiring Soon",
      message: "8 units of O+ blood expiring in 2 days",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "request",
      title: "Urgent Transfusion Request",
      message: "Emergency department requesting 3 units of AB+ blood",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      type: "forecast",
      title: "Predicted Shortage Alert",
      message: "AI model predicts O- shortage in 24 hours",
      time: "3 hours ago",
      read: false,
    },
  ];

  const getStockStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "low":
        return "bg-orange-500 text-white";
      case "good":
        return "bg-green-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getDemandColor = (demand) => {
    switch (demand.toLowerCase()) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-green-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Hospital Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
                <CardTitle>{hospitalProfile.name}</CardTitle>
                <CardDescription>{hospitalProfile.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{hospitalProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{hospitalProfile.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {hospitalProfile.bloodBankLicense}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Contact Information</h4>
                  <div className="text-sm space-y-1">
                    <p>{hospitalProfile.contactPerson}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{hospitalProfile.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold text-primary">245</div>
                      <div>Total Units</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-bold text-orange-500">4</div>
                      <div>Low Stock</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency Contact
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="inventory" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="donors">Donation Schedules</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <BloodRequestsTab />
                </Suspense>
              </TabsContent>

              <TabsContent value="donors" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <DonationSchedulesTab />
                </Suspense>
              </TabsContent>

              {/* Blood Stock Monitoring Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Blood Stock Monitoring
                    </h2>
                    <p className="text-muted-foreground">
                      Real-time inventory levels and status
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bloodStock.map((stock) => (
                    <Card
                      key={stock.bloodType}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">
                              {stock.bloodType}
                            </h3>
                            <Badge
                              className={getStockStatusColor(stock.status)}
                            >
                              {stock.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Current Stock</span>
                              <span className="font-medium">
                                {stock.currentUnits}/{stock.maximumCapacity}
                              </span>
                            </div>
                            <Progress
                              value={
                                (stock.currentUnits / stock.maximumCapacity) *
                                100
                              }
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Min: {stock.minimumRequired}</span>
                              <span>Max: {stock.maximumCapacity}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>Expiring (7d):</span>
                              <span className="font-medium">
                                {stock.expiringIn7Days} units
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Trend:</span>
                              <div className="flex items-center gap-1">
                                {getTrendIcon(stock.trend)}
                                <span className="capitalize">
                                  {stock.trend}
                                </span>
                              </div>
                            </div>
                            <div className="text-muted-foreground">
                              Updated {stock.lastUpdated}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Latest blood bank activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between py-2 border-b"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {transaction.type}
                              </Badge>
                              <span className="font-medium">
                                {transaction.bloodType}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {transaction.units} unit
                                {transaction.units > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.donor ||
                                transaction.recipient ||
                                transaction.source ||
                                transaction.reason}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.timestamp}
                            </div>
                          </div>
                          <Badge
                            variant={
                              transaction.status === "Completed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-500 text-white"
                                : transaction.status === "Disposed"
                                ? "bg-red-500 text-white"
                                : ""
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Demand Forecasting Tab */}
              <TabsContent value="forecasting" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      AI Demand Forecasting
                    </h2>
                    <p className="text-muted-foreground">
                      Predictive analytics for blood inventory management
                    </p>
                  </div>
                  <Select
                    value={selectedTimeRange}
                    onValueChange={setSelectedTimeRange}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="14d">14 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {demandForecasting.map((forecast) => (
                    <Card key={forecast.bloodType}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">
                              {forecast.bloodType}
                            </h3>
                            <Badge
                              className={getDemandColor(forecast.currentDemand)}
                            >
                              {forecast.currentDemand} Demand
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Predicted Shortage:
                              </span>
                              <span className="font-medium text-sm">
                                {forecast.predictedShortage}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Recommended Order:
                              </span>
                              <span className="font-medium text-sm">
                                {forecast.recommendedOrder} units
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">AI Model:</span>
                              <span className="font-medium text-sm">
                                {forecast.model}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Confidence:</span>
                              <span className="font-medium text-sm">
                                {forecast.confidence}%
                              </span>
                            </div>
                          </div>

                          <Progress
                            value={forecast.confidence}
                            className="h-2"
                          />

                          {forecast.recommendedOrder > 0 && (
                            <Button className="w-full" size="sm">
                              Request {forecast.recommendedOrder} Units
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Forecasting Models Performance</CardTitle>
                    <CardDescription>
                      AI model accuracy and predictions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded">
                        <div className="text-2xl font-bold text-primary">
                          92%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ARIMA Accuracy
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded">
                        <div className="text-2xl font-bold text-primary">
                          89%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          LSTM Accuracy
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded">
                        <div className="text-2xl font-bold text-primary">
                          85%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Prophet Accuracy
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Reporting & Analytics</h2>
                  <p className="text-muted-foreground">
                    Comprehensive data insights and trends
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary">245</div>
                      <p className="text-sm text-muted-foreground">
                        Total Units in Stock
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-500">
                        89
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Units Donated (7d)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-500">
                        156
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Units Transfused (7d)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-500">
                        12
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Units Expired (7d)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Blood Type Distribution</CardTitle>
                      <CardDescription>
                        Current inventory breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bloodStock.slice(0, 4).map((stock) => (
                          <div
                            key={stock.bloodType}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                              <span className="font-medium">
                                {stock.bloodType}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {stock.currentUnits}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {((stock.currentUnits / 245) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Trends</CardTitle>
                      <CardDescription>
                        Donations vs Transfusions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Donations</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-green-200 rounded">
                              <div className="w-16 h-2 bg-green-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">356</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Transfusions</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-blue-200 rounded">
                              <div className="w-14 h-2 bg-blue-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">298</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Expired</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-red-200 rounded">
                              <div className="w-3 h-2 bg-red-500 rounded"></div>
                            </div>
                            <span className="text-sm font-medium">23</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">System Alerts</h2>
                  <p className="text-muted-foreground">
                    Critical notifications and system updates
                  </p>
                </div>

                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={!notification.read ? "border-primary/50" : ""}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {notification.type === "critical" && (
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            )}
                            {notification.type === "expiring" && (
                              <Clock className="h-5 w-5 text-orange-500" />
                            )}
                            {notification.type === "request" && (
                              <Heart className="h-5 w-5 text-primary" />
                            )}
                            {notification.type === "forecast" && (
                              <BarChart3 className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <Badge variant="secondary">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.time}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            {notification.type === "critical"
                              ? "Take Action"
                              : "View Details"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
