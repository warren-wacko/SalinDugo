import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Cog,
  Search,
  Filter,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import api from "../../../api/axios";

export const searchSchedules = (schedules, searchTerm) => {
  if (!searchTerm.trim()) return schedules;
  return schedules.filter((s) =>
    (s.donor_name || "Anonymous")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );
};

export default function DonationSchedulesTab() {
  const { accessToken } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get("/api/schedules");
        setSchedules(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
        toast.error("Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchSchedules();
  }, [accessToken]);

  const handleStatusChange = async (scheduleId, newStatus) => {
    try {
      setUpdatingId(scheduleId);
      await api.patch(`/api/schedules/${scheduleId}`, { status: newStatus });

      setSchedules((prev) =>
        prev.map((s) =>
          s.schedule_id === scheduleId ? { ...s, status: newStatus } : s,
        ),
      );

      // ✅ Toast messages with human tone
      if (newStatus === "approved") {
        toast.info("Schedule Approved", {
          description: "The donation schedule has been approved successfully.",
        });
      } else if (newStatus === "pending") {
        toast.warning("Schedule Pending", {
          description: "The schedule is now pending and awaiting confirmation.",
        });
      } else if (newStatus === "completed") {
        toast.success("Schedule Completed 🎉", {
          description:
            "This donation schedule has been completed successfully!",
        });
      } else if (newStatus === "cancelled") {
        toast.error("Schedule Cancelled", {
          description: "This donation schedule has been cancelled.",
        });
      } else {
        toast("Schedule Updated", {
          description: `The status has been changed to ${newStatus}.`,
        });
      }
    } catch (err) {
      console.error("Error updating schedule:", err);
      toast.error("Update Failed", {
        description: "Something went wrong while updating the schedule.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSchedules = useMemo(() => {
    let data = searchSchedules(schedules, searchTerm);
    if (statusFilter !== "all") {
      data = data.filter(
        (s) => s.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    if (dateFilter) {
      data = data.filter(
        (s) =>
          format(new Date(s.scheduled_date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd"),
      );
    }
    return data;
  }, [schedules, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const renderStatusChip = (status) => {
    const base =
      "inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium capitalize border";
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <div
            className={`${base} bg-yellow-100 text-yellow-700 border-yellow-200`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-yellow-600" />
            Pending
          </div>
        );
      case "approved":
        return (
          <div className={`${base} bg-blue-100 text-blue-700 border-blue-200`}>
            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Approved
          </div>
        );
      case "completed":
        return (
          <div
            className={`${base} bg-green-100 text-green-700 border-green-200`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
            Completed
          </div>
        );
      case "rejected":
        return (
          <div className={`${base} bg-red-100 text-red-700 border-red-200`}>
            <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
            Rejected
          </div>
        );
      default:
        return (
          <div className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>
            {status}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold">Donation Schedules</h2>
        <p className="text-muted-foreground">
          Manage and track your blood donation schedules.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg p-3 bg-card/50">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by donor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(statusFilter !== "all" || dateFilter || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setDateFilter(null);
                setSearchTerm("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
          Loading schedules...
        </p>
      ) : filteredSchedules.length > 0 ? (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Donor Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Blood Type
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Scheduled Time
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.map((s) => (
                  <tr
                    key={s.schedule_id}
                    className="border-b border-border hover:bg-muted/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {s.donor_name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {s.blood_type}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {new Date(s.scheduled_date).toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {(() => {
                        const [hours, minutes] = s.scheduled_time.split(":");
                        const hour = parseInt(hours, 10);
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const formattedHour = hour % 12 || 12;
                        return `${formattedHour}:${minutes} ${ampm}`;
                      })()}
                    </td>
                    <td className="px-6 py-4">{renderStatusChip(s.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {s.status !== "completed" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updatingId === s.schedule_id}
                            >
                              {updatingId === s.schedule_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Cog className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {s.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      s.schedule_id,
                                      "approved",
                                    )
                                  }
                                  disabled={updatingId === s.schedule_id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      s.schedule_id,
                                      "cancelled",
                                    )
                                  }
                                  disabled={updatingId === s.schedule_id}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {s.status === "approved" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(s.schedule_id, "completed")
                                }
                                disabled={updatingId === s.schedule_id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <Empty className="flex flex-col items-center justify-center text-center py-16 space-y-4">
          <EmptyHeader className="flex flex-col items-center space-y-3">
            <EmptyMedia variant="icon">
              <CalendarIcon className="h-10 w-10 text-red-700" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold">
              No scheduled blood donations
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-muted-foreground">
              There are currently no upcoming blood donation schedules. Once a
              schedule is created, it will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
