"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  HeartPulse as HeartPlus,
  Filter,
  Loader2,
  CalendarIcon,
  MapPin,
  Droplet,
  Package,
  AlertCircle,
  Clock,
  Map,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import api from "@/api/axios";

export function RequestHistoryTab({
  accessToken,
  userId,
  setOpen,
  onCancelRequest,
  onSelectLocation,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch user's requests
  const fetchRequests = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await api.get(`/api/requests/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("User requests:", res.data);
      setRequests(res.data.requests || []);

      // Count remaining units (only "open" or "matched" statuses)
      const remainingUnits = (res.data.requests || [])
        .filter((r) => r.status === "open" || r.status === "matched")
        .reduce((sum, r) => sum + (r.units_needed || 0), 0);

      // Store in localStorage
      localStorage.setItem("remainingUnits", remainingUnits);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      if (err.response?.status !== 404) {
        toast.error("Failed to load requests");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && userId) {
      fetchRequests();
    }
  }, [accessToken, userId]);

  // Filtering logic
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.blood_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.urgency_level?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;

      const matchesDate = dateFilter
        ? format(new Date(r.request_date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd")
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [requests, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle cancel request
  const handleCancelRequest = async (requestId) => {
    try {
      await api.delete(`/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Blood request cancelled successfully");

      // Update requests list
      setRequests(requests.filter((req) => req.request_id !== requestId));

      if (onCancelRequest) {
        onCancelRequest(requestId);
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200";
      case "matched":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200";
      case "open":
      default:
        return "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high":
      case "critical":
        return "text-red-600 bg-red-50 border-red-100";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  return (
    <Tabs defaultValue="history">
      <TabsContent value="history" className="space-y-6 animate-in fade-in-50">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Request History
            </h2>
            <p className="text-muted-foreground">
              Track and manage your blood donation requests
            </p>
          </div>
          {requests.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
              <Clock className="h-4 w-4" />
              <span>Last updated: {format(new Date(), "h:mm a")}</span>
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg p-3 bg-card/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals, blood type..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[140px] bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-[160px] justify-start text-left font-normal bg-background",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter
                    ? format(dateFilter, "MMM dd, yyyy")
                    : "Filter Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => {
                    setDateFilter(date);
                    setCurrentPage(1);
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
                {dateFilter && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDateFilter(null)}
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {(searchTerm || statusFilter !== "all" || dateFilter) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter(null);
                }}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <Empty className="py-20 border-dashed border-2 rounded-xl bg-muted/20">
            <EmptyHeader>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <HeartPlus className="h-8 w-8 text-red-700" />
              </div>
              <EmptyTitle className="text-lg font-semibold mb-2">
                No requests yet
              </EmptyTitle>
              <EmptyDescription className="max-w-sm mx-auto mt-2">
                You haven't made any blood requests yet. Start by creating a new
                request to find donors near you.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/10 border-dashed">
            <div className="bg-muted p-3 rounded-full mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No matching requests</h3>
            <p className="text-muted-foreground max-w-xs mt-1">
              We couldn't find any requests matching your current filters.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter(null);
              }}
              className="mt-2"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((request) => (
              <Card
                key={request.request_id}
                className="overflow-hidden border-muted transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Status Indicator Strip (Left) */}
                  <div
                    className={cn(
                      "w-full md:w-1.5 h-1.5 md:h-auto",
                      request.status === "fulfilled"
                        ? "bg-green-500"
                        : request.status === "cancelled"
                        ? "bg-red-500"
                        : request.status === "matched"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    )}
                  />

                  <div className="flex-1 p-5 md:p-6">
                    {/* Card Header Section */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg md:text-xl text-foreground">
                            {request.hospital_name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize font-medium border",
                              getStatusColor(request.status)
                            )}
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.address && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            <span className="truncate max-w-[300px] md:max-w-md">
                              {request.address}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50 self-start">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                          {format(
                            new Date(request.request_date),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Blood Type
                        </span>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Droplet className="h-4 w-4 text-red-500" />
                          {request.blood_type}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Units
                        </span>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Package className="h-4 w-4 text-blue-500" />
                          {request.units_needed} units
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Urgency
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-2 py-0 h-6",
                              getUrgencyColor(request.urgency_level)
                            )}
                          >
                            <AlertCircle className="h-3 w-3 mr-1.5" />
                            <span className="capitalize">
                              {request.urgency_level}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Request ID
                        </span>
                        <div className="font-mono text-xs text-muted-foreground mt-1.5">
                          #{request.request_id?.toString().slice(-6) || "---"}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                      <div className="w-full sm:w-auto">
                        {(request.status === "open" ||
                          request.status === "matched") && (
                          <p className="text-xs text-amber-600 flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 w-fit">
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Processing request...
                          </p>
                        )}
                        {request.status === "fulfilled" && (
                          <p className="text-xs text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-full border border-green-100 w-fit">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Request fulfilled
                          </p>
                        )}
                        {request.status === "cancelled" && (
                          <p className="text-xs text-red-600 flex items-center bg-red-50 px-3 py-1.5 rounded-full border border-red-100 w-fit">
                            <X className="h-3 w-3 mr-1.5" />
                            Request cancelled
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {(request.status === "open" ||
                          request.status === "matched") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none bg-transparent"
                              onClick={() => {
                                if (onSelectLocation) {
                                  onSelectLocation({
                                    hospital_id: request.hospital_id,
                                    hospital_name: request.hospital_name,
                                    address: request.address,
                                    latitude: request.latitude,
                                    longitude: request.longitude,
                                    contact_number: request.contact_number,
                                  });
                                }
                              }}
                            >
                              <Map className="h-3.5 w-3.5 mr-1.5" />
                              View Location
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 sm:flex-none"
                              onClick={() =>
                                handleCancelRequest(request.request_id)
                              }
                            >
                              Cancel Request
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-6 pb-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(p - 1, 1));
                    }}
                    className={cn(
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}
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
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                    }}
                    className={cn(
                      currentPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default RequestHistoryTab;
