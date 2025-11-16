import { useState, useContext, Suspense, lazy } from "react";
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
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  Building2,
  Phone,
} from "lucide-react";
import Navbar from "../../../components/ui/navbar";
const BloodRequestsTab = lazy(() => import("../components/BloodRequestsTab"));
const DonationSchedulesTab = lazy(() =>
  import("../components/DonationSchedulesTab")
);
const InventoryTab = lazy(() => import("../components/InventoryTab"));
const InventoryHistoryTab = lazy(() =>
  import("../components/InventoryHistoryTab")
);
import BloodDropLoader from "../../../utils/bloodDropLoader";
import { AuthContext } from "../../../context/AuthContext";
export default function HospitalDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const { accessToken } = useContext(AuthContext);
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
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
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
                <Suspense fallback={<BloodDropLoader />}>
                  <InventoryTab accessToken={accessToken} />
                </Suspense>
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

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <InventoryHistoryTab accessToken={accessToken} />
                </Suspense>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6"></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
