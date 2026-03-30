import { useContext, Suspense, lazy, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Building2, Phone } from "lucide-react";
import Navbar from "../../../components/ui/navbar";
const BloodRequestsTab = lazy(() => import("../components/BloodRequestsTab"));
const DonationSchedulesTab = lazy(
  () => import("../components/DonationSchedulesTab"),
);
const InventoryTab = lazy(() => import("../components/InventoryTab"));
const InventoryHistoryTab = lazy(
  () => import("../components/InventoryHistoryTab"),
);
const NotificationTab = lazy(
  () => import("../../user/components/NotificationTab"),
);
const DemandForecastingTab = lazy(
  () => import("../components/DemandForecastingTab"),
);
import BloodDropLoader from "../../../utils/bloodDropLoader";
import { AuthContext } from "../../../context/AuthContext";
export default function HospitalDashboard() {
  const { accessToken, user } = useContext(AuthContext);

  // Mock data
  const hospitalProfile = {
    name: user.full_name,
    location: user.city + ", " + user.province,
    contact: user.contact_number,
    email: user.email,
  };
  const [activeTab, setActiveTab] = useState("inventory");
  return (
    <div className="min-h-screen bg-background">
      <Navbar setActiveTab={setActiveTab} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Hospital Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
                <CardTitle>{hospitalProfile.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{hospitalProfile.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{hospitalProfile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Contact Information</h4>
                  <div className="text-sm space-y-1">
                    <p>{hospitalProfile.contactPerson}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{hospitalProfile.contact}</span>
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="requests">Requests</TabsTrigger>
                <TabsTrigger value="donors">Donation Schedules</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                <Suspense fallback={<BloodDropLoader />}>
                  <DemandForecastingTab hospitalId={user.id} />
                </Suspense>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <InventoryHistoryTab accessToken={accessToken} />
                </Suspense>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Suspense fallback={<BloodDropLoader />}>
                  <NotificationTab accessToken={accessToken} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
