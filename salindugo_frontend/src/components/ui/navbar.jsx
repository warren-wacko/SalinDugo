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
import ImportData from "../../views/hospital/components/ImportPage";

// Helper: Format created_at nicely
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

const Navbar = ({ setActiveTab, hideSettings = false }) => {
  const { logout, user, accessToken } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const limit = 5;

  // Fetch notifications
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

  // Mark as read
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

  // Mark all as read
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
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-2">
            {/* Settings */}
            {!hideSettings && (
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
                    <DropdownMenuItem asChild>
                      <Link to="/import-data">Import Data</Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Logout */}
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
