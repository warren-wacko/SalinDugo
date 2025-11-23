"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, Search, Droplet, X } from "lucide-react";
import { format } from "date-fns";
import api from "../../../api/axios";
import { toast } from "sonner";
import BloodBag3D from "./blood-bag-3d";

export default function InventoryHistoryTab({ accessToken }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [changeFilter, setChangeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/stocks/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setHistory(res.data.history ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    }
  };

  useEffect(() => {
    if (accessToken) fetchHistory();
  }, [accessToken]);

  // Filtering logic
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.blood_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChange =
      changeFilter === "all" ||
      (changeFilter === "increase" && item.change > 0) ||
      (changeFilter === "decrease" && item.change < 0);

    const matchesDate = dateFilter
      ? format(new Date(item.changed_at), "yyyy-MM-dd") ===
        format(dateFilter, "yyyy-MM-dd")
      : true;

    return matchesSearch && matchesChange && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page if filters reduce results
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, changeFilter, dateFilter]);

  const getBloodColor = (bloodType) => {
    const colors = {
      "A+": "from-red-600 to-red-700",
      "A-": "from-red-500 to-red-600",
      "B+": "from-rose-600 to-rose-700",
      "B-": "from-rose-500 to-rose-600",
      "AB+": "from-red-700 to-red-800",
      "AB-": "from-red-600 to-red-700",
      "O+": "from-red-500 to-red-700",
      "O-": "from-red-400 to-red-600",
    };
    return colors[bloodType] || "from-red-600 to-red-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <Droplet className="h-5 w-5 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold">Inventory History</h2>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border rounded-lg p-4 bg-card/50">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blood type or reason..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Change Filter */}
        <Select value={changeFilter} onValueChange={setChangeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Change Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Changes</SelectItem>
            <SelectItem value="increase">Increase Only</SelectItem>
            <SelectItem value="decrease">Decrease Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[200px] justify-start bg-transparent"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFilter ? format(dateFilter, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear Button */}
        {(searchTerm || dateFilter || changeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setChangeFilter("all");
              setDateFilter(null);
            }}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Clear filters</span>
          </Button>
        )}
      </div>

      {paginatedHistory.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Droplet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No matching records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedHistory.map((item) => (
            <div
              key={item.history_id}
              className="group relative cursor-pointer"
              onClick={() => setSelected(item)}
            >
              <div className="relative bg-gradient-to-br from-background to-muted/30 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02]">
                <div className="relative">
                  <BloodBag3D
                    bloodType={item.blood_type}
                    change={item.change}
                  />
                </div>

                {/* Receipt Section - Bottom Half */}
                <div className="p-4 bg-white dark:bg-card space-y-3">
                  {/* Receipt Header */}
                  <div className="border-b-2 border-dashed pb-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Transaction Receipt
                    </p>
                  </div>

                  {/* Receipt Details */}
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change:</span>
                      <span
                        className={`font-bold ${
                          item.change > 0 ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {item.change > 0 ? "+" : ""}
                        {item.change} units
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">After:</span>
                      <span className="font-semibold">
                        {item.units_after} units
                      </span>
                    </div>

                    <div className="pt-2 border-t border-dashed">
                      <p className="text-xs text-muted-foreground mb-1">
                        Reason:
                      </p>
                      <p className="text-sm font-sans line-clamp-2">
                        {item.reason}
                      </p>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground">
                      {format(new Date(item.changed_at), "PPp")}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
                    setCurrentPage((p) => Math.max(p - 1, 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(p + 1, totalPages));
                  }}
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-red-600" />
              Inventory Change Details
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Blood Type Badge */}
              <div
                className={`p-4 rounded-lg bg-gradient-to-br ${getBloodColor(
                  selected.blood_type
                )} flex items-center justify-center`}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-2">
                  <p className="text-2xl font-bold text-red-700">
                    {selected.blood_type}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p
                    className={`text-lg font-bold ${
                      selected.change > 0 ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {selected.change > 0 ? "+" : ""}
                    {selected.change} units
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Units After
                  </p>
                  <p className="text-lg font-bold">
                    {selected.units_after} units
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">Reason</p>
                <p className="text-sm">{selected.reason}</p>
              </div>

              {/* IDs */}
              {selected.change > 0 && selected.donor_id && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                    Donor ID
                  </p>
                  <p className="font-mono text-sm">{selected.donor_id}</p>
                </div>
              )}

              {selected.change < 0 && selected.recipient_id && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">
                    Recipient ID
                  </p>
                  <p className="font-mono text-sm">{selected.recipient_id}</p>
                </div>
              )}

              {/* Timestamp */}
              <div className="pt-3 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.changed_at), "PPPP")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.changed_at), "p")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
