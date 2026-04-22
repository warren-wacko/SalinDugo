import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
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
import { cn } from "@/lib/utils";

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
      console.log("Fetched history:", res.data.history);
    } catch (err) {
      console.error(err);

      const status = err.response?.status;

      if (status === 429) {
        toast.error("Too many requests. Please wait before trying again.");
      } else if (status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (status === 500) {
        toast.error("Server error. Try again later.");
      } else {
        toast.error("Failed to load history");
      }
    }
  };

  useEffect(() => {
    if (accessToken) fetchHistory();
  }, [accessToken]);

  useEffect(() => {
    if (selected) {
      console.log("Selected history item:", selected);
    }
  }, [selected]);

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
    startIndex + itemsPerPage,
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
          {paginatedHistory.map((item, index) => (
            <div
              key={item.history_id ?? index}
              className="group relative cursor-pointer"
              onClick={() => {
                setSelected(item);
                console.log(item);
              }}
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
        <DialogContent className="sm:max-w-2xl bg-transparent border-none shadow-none p-0 flex items-center justify-center overflow-visible">
          {/* Hidden accessible title */}
          <DialogTitle className="sr-only">Blood Bag Details</DialogTitle>
          <div
            className="relative w-full flex items-center justify-center"
            style={{ height: "700px" }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute mt-1.5 mr-1.5 right-0 top-0 z-50 text-white hover:text-white/80 bg-black/20 hover:bg-black/40 rounded-full"
              onClick={() => setSelected(null)}
            ></Button>

            {selected && (
              <BloodBag3D
                bloodType={selected.blood_type}
                change={selected.change}
                className="relative h-[700px] w-full rounded-2xl bg-slate-100/50 backdrop-blur-sm"
              >
                {/* Sticker Container — centered & floating above */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white p-5 w-[340px] shadow-xl flex flex-col gap-3 text-slate-900 border border-slate-200 pointer-events-auto origin-center">
                    {/* Top Barcode Section */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                      <div className="space-y-1">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="h-full bg-black"
                            style={{
                              width: Math.random() > 0.5 ? "2px" : "4px",
                            }}
                          ></div>
                        ))}
                      </div>
                      {/* Donor / Recipient */}
                      <span className="text-[10px] font-mono tracking-widest mr-15">
                        {selected.donor_id
                          ? `Donor ID: ${selected.donor_id}`
                          : selected.recipient_id
                            ? `Recipient ID: ${selected.recipient_id}`
                            : "N/A"}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-tighter">
                        {selected.reason ? selected.reason : "No reason"}
                      </span>
                    </div>

                    {/* Main Blood Type */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">
                          Blood Type
                        </span>
                        <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                          {selected.blood_type.replace(/[^A-Z]/g, "")}
                        </span>
                        <span className="text-base font-bold text-slate-600">
                          Rh{" "}
                          {selected.blood_type.includes("+")
                            ? "Positive"
                            : "Negative"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end justify-center h-full">
                        <div className="border-4 border-slate-900 p-2 mb-1">
                          <span className="text-3xl font-bold block leading-none">
                            {selected.blood_type.slice(-1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Volume & Storage */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column: Dates & Info */}
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-gray-600 font-bold">
                            Collection Date
                          </span>
                          <span className="text-sm font-bold font-mono">
                            {format(
                              new Date(selected.changed_at),
                              "dd.MM.yyyy",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                            Action:
                          </span>
                          <span
                            className={cn(
                              "text-xs ml-1 font-bold px-1.5 py-0.5 rounded",
                              selected.change > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700",
                            )}
                          >
                            {selected.change > 0 ? "INCOMING" : "OUTGOING"}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase text-slate-500 font-medium">
                          Status:
                        </span>
                        <span
                          className={cn(
                            "text-xs ml-1 font-bold px-1.5 py-0.5 rounded",
                            selected.bag_status === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700",
                          )}
                        >
                          {selected.bag_status === "available"
                            ? "AVAILABLE"
                            : "USED"}
                        </span>
                      </div>

                      {/* Right Column: Volume & Critical Info */}
                      <div className="flex flex-col items-end justify-between text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase text-gray-600 font-bold">
                            Volume
                          </span>
                          <span className="text-lg font-black">
                            {Math.abs(selected.change) * 450} ml
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Barcode */}
                    <div className="pt-2 border-t border-black flex flex-col items-center gap-2">
                      {/* Blood Bag IDs */}
                      {/* Barcode */}
                      <Barcode
                        value={`BB-${selected.bag_ids || selected.bag_id}`} // unique barcode per row
                        format="CODE128"
                        width={1.5} // thickness of bars
                        height={20} // height of the barcode
                        displayValue={true} // show text below barcode
                      />
                    </div>
                  </div>
                </div>
              </BloodBag3D>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
