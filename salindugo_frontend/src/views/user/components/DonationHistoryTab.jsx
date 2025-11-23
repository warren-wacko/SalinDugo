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
  Filter,
  Loader2,
  CalendarIcon,
  Droplet,
  Clock,
  X,
  CheckCircle2,
  HeartHandshake,
  Activity,
  Hash,
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
import api from "@/api/axios";

export function DonationHistoryTab({ accessToken, setOpen }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchDonations = async () => {
    try {
      const res = await api.get("/api/donations");
      const data = res.data;
      setDonations(data);

      // Save total completed count
      const completedCount = data.filter(
        (d) => d.status === "completed"
      ).length;
      localStorage.setItem("totalDonations", completedCount);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
      toast.error("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchDonations();
  }, [accessToken]);

  // Filter + Search logic
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        d.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.donation_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.blood_type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || d.status === statusFilter;

      const matchesDate = dateFilter
        ? format(new Date(d.donation_date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd")
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [donations, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200";
      case "pending":
      default:
        return "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200";
    }
  };

  return (
    <Tabs defaultValue="history">
      <TabsContent
        value="history"
        className="space-y-6 animate-in fade-in-50 duration-500"
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Donation History
            </h2>
            <p className="text-muted-foreground">
              View and filter your recorded donations.
            </p>
          </div>
          {donations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
              <Clock className="h-4 w-4" />
              <span>Last updated: {format(new Date(), "h:mm a")}</span>
            </div>
          )}
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg p-3 bg-card/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search hospital, type..."
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
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[160px] justify-start text-left font-normal bg-background",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
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

            {(statusFilter !== "all" || dateFilter || searchTerm) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStatusFilter("all");
                  setDateFilter(null);
                  setSearchTerm("");
                }}
                className="h-10 w-10 text-muted-foreground hover:text-foreground hidden sm:flex"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Mobile clear filters button */}
            {(statusFilter !== "all" || dateFilter || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setDateFilter(null);
                  setSearchTerm("");
                }}
                className="w-full text-muted-foreground hover:text-foreground sm:hidden"
              >
                <X className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
            )}
          </div>
        </div>
        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            <p>Loading your donation history...</p>
          </div>
        ) : filteredDonations.length > 0 ? (
          <div className="space-y-4">
            {paginatedDonations.map((d) => (
              <Card
                key={d.donation_id}
                className="overflow-hidden border-muted transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Status Indicator Strip (Left) */}
                  <div
                    className={cn(
                      "w-full md:w-1.5 h-1.5 md:h-auto",
                      d.status === "completed"
                        ? "bg-green-500"
                        : d.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-amber-500"
                    )}
                  />

                  <div className="flex-1 p-5 md:p-6">
                    {/* Card Header Section */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg md:text-xl text-foreground">
                            {d.hospital_name || `Hospital #${d.hospital_id}`}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize font-medium border",
                              getStatusColor(d.status)
                            )}
                          >
                            {d.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Activity className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          <span className="capitalize">
                            {d.donation_type
                              ? d.donation_type
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())
                              : "Standard Donation"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50 self-start">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                          {format(
                            new Date(d.donation_date),
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
                          {d.blood_type}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Donation Type
                        </span>
                        <div className="flex items-center gap-2 text-foreground font-medium capitalize">
                          <HeartHandshake className="h-4 w-4 text-primary" />
                          {d.donation_type
                            ? d.donation_type
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())
                            : ""}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Status
                        </span>
                        <div className="flex items-center gap-2">
                          {d.status === "completed" ? (
                            <span className="text-green-600 font-medium flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </span>
                          ) : d.status === "cancelled" ? (
                            <span className="text-red-600 font-medium flex items-center gap-1.5 text-sm">
                              <X className="h-4 w-4" /> Cancelled
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium flex items-center gap-1.5 text-sm">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                          Donation ID
                        </span>
                        <div className="font-mono text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {d.donation_id?.toString().slice(-6) || "---"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted rounded-xl bg-muted/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <HeartHandshake className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No donation records found
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven’t made any blood donations yet matching these filters.
            </p>
            <Button
              onClick={() => {
                setOpen(true);
                setStatusFilter("all");
                setDateFilter(null);
                setSearchTerm("");
              }}
            >
              Schedule a Donation
            </Button>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-6">
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
                      "cursor-pointer",
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
                      className="cursor-pointer"
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
                      "cursor-pointer",
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

export default DonationHistoryTab;
