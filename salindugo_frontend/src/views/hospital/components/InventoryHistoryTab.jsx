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
import { CalendarIcon, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import api from "../../../api/axios";
import { toast } from "sonner";

export default function InventoryHistoryTab({ accessToken }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  // ✅ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [changeFilter, setChangeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);

  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // ✅ Filtering logic
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

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ✅ Reset page if filters reduce results
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, changeFilter, dateFilter]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Inventory History</h2>

      {/* ✅ FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 border rounded-lg p-3 bg-card/50">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 w-[180px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Change Filter */}
        <Select value={changeFilter} onValueChange={setChangeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Change Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="increase">Increase</SelectItem>
            <SelectItem value="decrease">Decrease</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
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
          >
            Clear
          </Button>
        )}
      </div>

      {/* ✅ History Table/List */}
      <div className="border rounded-md divide-y">
        {paginatedHistory.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No matching records found.
          </div>
        ) : (
          paginatedHistory.map((item) => (
            <div key={item.history_id} className="p-3 flex justify-between">
              <div>
                <p className="font-medium">{item.blood_type}</p>
                <p className="text-sm text-muted-foreground">
                  {item.change > 0 ? "+" : ""}
                  {item.change} units —{" "}
                  {new Date(item.changed_at).toLocaleString()}
                </p>
              </div>
              <Button size="sm" onClick={() => setSelected(item)}>
                Details
              </Button>
            </div>
          ))
        )}
      </div>

      {/* ✅ PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={currentPage === 1 ? "opacity-50" : ""}
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
                  className={currentPage === totalPages ? "opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ✅ Modal for Details */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Change Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-2">
              <p>
                <strong>Blood Type:</strong> {selected.blood_type}
              </p>
              <p>
                <strong>Change:</strong> {selected.change}
              </p>
              <p>
                <strong>Units After:</strong> {selected.units_after}
              </p>
              <p>
                <strong>Reason:</strong> {selected.reason}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selected.changed_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
