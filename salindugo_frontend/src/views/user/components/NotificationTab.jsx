import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Check, MessageSquareHeart } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import api from "../../../api/axios";
// 🕒 Format date helper
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

export function NotificationTab({ accessToken }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchNotifications = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/notifications?page=${pageToFetch}&limit=${limit}`
      );

      const data = res.data;
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/api/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  useEffect(() => {
    if (accessToken) fetchNotifications(page);
  }, [accessToken, page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">
            Your recorded donations and status
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={markAllAsRead}
          disabled={notifications.every((n) => n.is_read)}
        >
          Mark All as Read
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <Empty className="py-20 border-dashed border-2 rounded-xl bg-muted/20">
          <EmptyHeader>
            <EmptyMedia className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <MessageSquareHeart className="h-8 w-8 text-red-700" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold">
              No notifications yet
            </EmptyTitle>
            <EmptyDescription>
              You currently don’t have any notifications. Updates about your
              blood requests or donations will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const roleEmoji =
              n.sender_role === "hospital"
                ? "🏥"
                : n.sender_role === "user"
                ? "🧍‍♂️"
                : "🩸";
            return (
              <div
                key={n.notification_id}
                onClick={() => markAsRead(n.notification_id)}
                className={`p-3 rounded-lg border hover:bg-muted/100 transition cursor-pointer ${
                  n.is_read
                    ? "opacity-70"
                    : n.role === "hospital"
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex justify-between">
                  <div className="font-medium">
                    {roleEmoji} {n.title}
                  </div>
                  {!n.is_read && <Check className="h-4 w-4 text-green-500" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {n.message}
                </p>
                {n.sender_name && (
                  <p className="text-[11px] italic text-gray-500 mt-1">
                    From: {n.sender_name} ({n.sender_role})
                  </p>
                )}
                <p className="text-[11px] italic text-gray-500 mt-1">
                  {formatDateTime(n.created_at)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page - 1);
                  }}
                  className={`${
                    page === 1 ? "opacity-50 pointer-events-none" : ""
                  }`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page + 1);
                  }}
                  className={`${
                    page === totalPages ? "opacity-50 pointer-events-none" : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
export default NotificationTab;
