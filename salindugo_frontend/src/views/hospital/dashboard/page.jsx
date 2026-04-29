import { useContext, Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Droplets,
  HeartHandshake,
  KeyRound,
  MapPin,
  Settings,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
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

  const hospitalProfile = {
    name: user?.full_name || "Hospital Dashboard",
    location: [user?.city, user?.province].filter(Boolean).join(", "),
  };
  const [activeTab, setActiveTab] = useState("inventory");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const navItems = [
    {
      id: "requests",
      label: "Requests",
      description: "Incoming blood requests",
      icon: HeartHandshake,
    },
    {
      id: "donors",
      label: "Donation Schedules",
      description: "Booked donor visits",
      icon: CalendarDays,
    },
    {
      id: "inventory",
      label: "Inventory",
      description: "Stock levels and bags",
      icon: Droplets,
    },
    {
      id: "history",
      label: "History",
      description: "Inventory movement log",
      icon: Archive,
    },
    {
      id: "forecasting",
      label: "Forecasting",
      description: "Demand projections",
      icon: TrendingUp,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Operational updates",
      icon: Bell,
    },
  ];

  const settingsItems = [
    {
      label: "Profile",
      description: "Hospital account details",
      href: "/profile",
      icon: User,
    },
    {
      label: "Change Password",
      description: "Update sign-in security",
      href: "/change-password",
      icon: KeyRound,
    },
    {
      label: "Import Data",
      description: "Upload inventory records",
      href: "/import-data",
      icon: Upload,
    },
  ];

  const helpItems = [
    "Use Inventory to add, monitor, and update available blood bags.",
    "Check Requests for incoming blood needs from recipients.",
    "Review Donation Schedules before preparing collection slots.",
    "Open Forecasting to compare projected demand with current stock.",
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar setActiveTab={setActiveTab} hideSettings />
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-border bg-card/80 lg:sticky lg:top-0 lg:h-[calc(100vh-73px)] lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-border px-5 py-5">
              <div className="mb-3 inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                Blood Center
              </div>
              <h2 className="truncate text-base font-semibold text-foreground">
                {hospitalProfile.name}
              </h2>
              <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {hospitalProfile.location || "Location not set"}
                </span>
              </div>
            </div>

            <nav
              aria-label="Hospital dashboard"
              className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:px-3 lg:py-4"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveTab(item.id)}
                    className={`group relative flex min-w-[190px] items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors lg:min-w-0 ${
                      isActive
                        ? "border-primary/20 bg-primary/8 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-1 rounded-r-full lg:block ${
                        isActive ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isActive
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm ${
                          isActive ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-border px-4 py-4">
              <button
                type="button"
                aria-expanded={isSettingsOpen}
                onClick={() => setIsSettingsOpen((open) => !open)}
                className="group flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                  <Settings className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    Settings
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Account and import tools
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isSettingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSettingsOpen && (
                <div className="grid gap-1.5 pl-3 sm:grid-cols-3 lg:grid-cols-1">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="group flex min-w-0 items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/70"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                aria-expanded={isHelpOpen}
                onClick={() => setIsHelpOpen((open) => !open)}
                className="group flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                  <CircleHelp className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    Help
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    How to use the system
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isHelpOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isHelpOpen && (
                <div className="rounded-md border border-border bg-background px-4 py-3">
                  <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
                    {helpItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-center min-h-full px-4 py-8">
            <div className="w-full">
              <div className="space-y-6">
                {activeTab === "requests" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <BloodRequestsTab />
                  </Suspense>
                )}

                {activeTab === "donors" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <DonationSchedulesTab />
                  </Suspense>
                )}

                {activeTab === "inventory" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <InventoryTab accessToken={accessToken} />
                  </Suspense>
                )}

                {activeTab === "forecasting" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <DemandForecastingTab hospitalId={user.id} />
                  </Suspense>
                )}

                {activeTab === "history" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <InventoryHistoryTab accessToken={accessToken} />
                  </Suspense>
                )}

                {activeTab === "notifications" && (
                  <Suspense fallback={<BloodDropLoader />}>
                    <NotificationTab accessToken={accessToken} />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
