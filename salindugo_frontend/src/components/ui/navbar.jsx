import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Bell,
  Heart,
  LogOut,
  Settings,
  Check,
  MessageSquareHeart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import api from "../../api/axios";

// ⏰ Helper: Format created_at nicely
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const Navbar = ({ setActiveTab }) => {
  const { logout, user, accessToken } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const limit = 5;

  // 🔄 Fetch notifications
  const fetchNotifications = async (pageToFetch = page) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/notifications?page=${pageToFetch}&limit=${limit}`,
      );

      const data = res.data;
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchNotifications(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, page]);

  useEffect(() => {
    window.refreshNotifications = () => fetchNotifications(page);
    return () => {
      window.refreshNotifications = null;
    };
  }, [page]);

  // ✅ Mark as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n,
        ),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ✅ Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch("/api/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      fetchNotifications(page);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">SalinDugo</h1>
            </Link>
            <Badge variant="secondary">{`${
              user?.role || "User"
            } Dashboard`}</Badge>
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-2">
            {/* 🔔 Notifications */}
            <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen}>
              <DropdownMenuTrigger asChild>
                {user.role !== "admin" && (
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px]"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="font-semibold flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>

                <Separator className="my-1" />

                <DropdownMenuGroup>
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <Empty className="py-16">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageSquareHeart className="h-8 w-8 text-red-700" />
                        </EmptyMedia>
                        <EmptyTitle className="text-lg font-semibold">
                          No notifications yet
                        </EmptyTitle>
                        <EmptyDescription>
                          You currently don’t have any notifications. Updates
                          about your blood requests or donations will appear
                          here.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      {/* Show top 5 notifications */}
                      {notifications.slice(0, 5).map((n, idx) => {
                        const roleEmoji =
                          n.sender_role === "hospital"
                            ? "🏥"
                            : n.sender_role === "user"
                              ? "🧍‍♂️"
                              : "🩸";

                        return (
                          <React.Fragment key={n.notification_id}>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              onClick={() => markAsRead(n.notification_id)}
                              className={`flex flex-col items-start rounded-md transition-colors p-2 ${
                                n.is_read
                                  ? "opacity-70"
                                  : n.role === "hospital"
                                    ? "bg-red-50 dark:bg-red-900/20"
                                    : "bg-blue-50 dark:bg-blue-900/20"
                              }`}
                            >
                              <div className="flex justify-between w-full">
                                <span className="font-medium">
                                  {roleEmoji} {n.title}
                                </span>
                                {!n.is_read && (
                                  <Check className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">
                                {n.message}
                              </span>

                              {n.sender_name && (
                                <span className="text-[11px] text-gray-500 mt-1 italic">
                                  From: {n.sender_name} ({n.sender_role})
                                </span>
                              )}

                              <span className="text-[11px] italic text-gray-500 mt-1">
                                {formatDateTime(n.created_at)}
                              </span>
                            </DropdownMenuItem>

                            {idx < 4 && <Separator className="my-1" />}
                          </React.Fragment>
                        );
                      })}

                      {/* 👇 View More button (opens notifications tab) */}
                      <div className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotifOpen(false);

                            // 🔁 Switch tab to "notifications"
                            if (typeof setActiveTab === "function") {
                              setActiveTab("notifications");
                            } else if (
                              typeof window.setActiveTab === "function"
                            ) {
                              window.setActiveTab("notifications");
                            }
                          }}
                        >
                          View More
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ⚙ Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/change-password">Change Password</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 🚪 Logout */}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
