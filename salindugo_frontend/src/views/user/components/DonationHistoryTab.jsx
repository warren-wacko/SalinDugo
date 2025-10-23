import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  HeartHandshake,
  Calendar as CalendarIcon,
  Loader2,
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import api from "../../../api/axios";

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

  // ✅ Filter + Search logic
  const filteredDonations = donations.filter((d) => {
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

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      cancelled: "bg-red-100 text-red-700 border border-red-200",
    };

    return (
      <div
        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium capitalize ${
          styles[status] || "bg-gray-100 text-gray-700 border border-gray-200"
        }`}
      >
        {status}
      </div>
    );
  };

  return (
    <TabsContent value="history" className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold">Donation History</h2>
        <p className="text-muted-foreground">
          View and filter your recorded donations.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg p-3 bg-card/50">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search donations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>

          {/* STATUS FILTER */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* DATE FILTER */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
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

          {/* CLEAR FILTERS */}
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
          Loading donation records...
        </p>
      ) : filteredDonations.length > 0 ? (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Blood Type
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Hospital
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDonations.map((d) => (
                  <tr
                    key={d.donation_id}
                    className="border-b border-border hover:bg-muted/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {d.blood_type}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {d.hospital_name || `Hospital #${d.hospital_id}`}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {d.donation_type
                        ? d.donation_type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : ""}
                    </td>

                    <td className="px-6 py-4 text-foreground">
                      {new Date(d.donation_date).toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
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
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartHandshake className="h-8 w-8 text-red-700" />
            </EmptyMedia>
            <EmptyTitle className="text-lg font-semibold">
              No donation records found
            </EmptyTitle>
            <EmptyDescription>
              You haven’t made any blood donations yet. Once you do, they’ll
              appear here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpen(true)}>Schedule donation</Button>
          </EmptyContent>
        </Empty>
      )}
    </TabsContent>
  );
}
export default DonationHistoryTab;
