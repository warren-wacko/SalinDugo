import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  CheckCircle,
  CircleAlert,
  RotateCw,
  Cog,
  XCircle,
  FolderOpen,
  Package,
  Loader2,
  Filter,
  HeartPulse as HeartPlus,
  CalendarIcon,
  AlertCircle,
  Check,
  Droplet,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { searchRequests } from "@/utils/validationHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import api from "../../../api/axios";

export default function BloodRequestsTab() {
  const { accessToken } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelDialog, setCancelDialog] = useState({ open: false, id: null });
  const [fulfillDialog, setFulfillDialog] = useState({
    open: false,
    request: null,
    stock: null,
    units: 1,
    bags: [],
    selectedBags: [],
  });

  const itemsPerPage = 5;

  const openFulfillDialog = async (req) => {
    try {
      const stockResponse = await api.get("/api/stocks");
      const stock = stockResponse.data.find(
        (s) => s.blood_type === req.blood_type
      );
      const bagsResponse = await api.get(
        `/api/requests/bloodbags/${req.blood_type}`
      );
      console.log("BAGS RESPONSE:", bagsResponse.data);

      setFulfillDialog({
        open: true,
        request: req,
        stock: stock || { units_available: 0 },
        units: req.units_needed,
        bags: bagsResponse.data,
        selectedBags: [],
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock or bags");
    }
  };

  const toggleBagSelection = (bagId) => {
    setFulfillDialog((prev) => {
      const selected = prev.selectedBags.includes(bagId)
        ? prev.selectedBags.filter((id) => id !== bagId)
        : [...prev.selectedBags, bagId];
      return { ...prev, selectedBags: selected, units: selected.length };
    });
  };

  const fulfillRequest = async () => {
    const { request, units } = fulfillDialog;
    try {
      setUpdatingId(request.request_id);
      await api.patch(`/api/requests/${request.request_id}/fulfill`, {
        bag_ids: fulfillDialog.selectedBags,
      });
      toast.success("Request fulfilled successfully! ✅");
      setFulfillDialog({
        open: false,
        request: null,
        stock: null,
        units: 1,
        bags: [],
        selectedBags: [],
      });

      await fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fulfill request");
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/api/requests");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchRequests();
  }, [accessToken]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setUpdatingId(requestId);
      await api.patch(`/api/requests/${requestId}`, { status: newStatus });
      if (newStatus === "open") {
        toast.success("Request Reopened", {
          description:
            "The request is now open again and ready for new matches.",
        });
      } else if (newStatus === "matched") {
        toast.warning("Request Matched!", {
          description:
            "A donor has been successfully matched with this request.",
        });
      } else if (newStatus === "fulfilled") {
        toast.info("Request Fulfilled 🎉", {
          description: "The blood request has been successfully completed!",
        });
      } else if (newStatus === "cancelled") {
        toast.error("Request Cancelled", {
          description:
            "This request has been cancelled and is no longer active.",
        });
      } else {
        toast("Request Updated", {
          description: `Status changed to ${newStatus}.`,
        });
      }
      await fetchRequests();
      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (error) {
      console.error(error);
      toast.error("Update Failed", {
        description: "Something went wrong while updating the request.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = (id) => {
    setCancelDialog({ open: true, id });
  };

  const filteredRequests = searchRequests(requests, searchTerm).filter(
    (req) => {
      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;
      const matchesDate = dateFilter
        ? format(new Date(req.request_date), "yyyy-MM-dd") ===
          format(dateFilter, "yyyy-MM-dd")
        : true;
      return matchesStatus && matchesDate;
    }
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusCapitalized = (status) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const getDaysUntilExpiry = (expirationDate) => {
    return Math.ceil(
      (new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
  };

  const getBagStatusColor = (daysLeft) => {
    if (daysLeft <= 2) return "bg-red-50 border-red-200";
    if (daysLeft <= 5) return "bg-amber-50 border-amber-200";
    if (daysLeft <= 10) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getBagStatusBadge = (daysLeft) => {
    if (daysLeft <= 2)
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: `${daysLeft} days left`,
      };
    if (daysLeft <= 5)
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: `${daysLeft} days left`,
      };
    if (daysLeft <= 10)
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: `${daysLeft} days left`,
      };
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      label: `${daysLeft} days left`,
    };
  };

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold">Blood Requests</h2>
          <p className="text-muted-foreground">
            Manage and track blood requests efficiently.
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
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            {/* STATUS FILTER */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
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
            Loading requests...
          </p>
        ) : filteredRequests.length > 0 ? (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-foreground">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">
                      Blood Type
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">
                      Units
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">
                      Urgency
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
                  {paginatedRequests.map((req) => (
                    <tr
                      key={req.request_id}
                      className="border-b border-border hover:bg-muted/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {req.requester_name}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {new Date(req.request_date).toISOString().split("T")[0]}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {req.blood_type}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {req.units_needed}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                            req.urgency_level === "emergency"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {req.urgency_level === "emergency" ? (
                            <>
                              <CircleAlert className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                              Emergency
                            </>
                          ) : (
                            <>
                              <RotateCw className="w-3.5 h-3.5 mr-1.5 text-yellow-600" />
                              Routine
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium capitalize border ${
                            req.status === "open"
                              ? "bg-blue-200 text-blue-700 border-blue-300"
                              : req.status === "matched"
                              ? "bg-sky-100 text-sky-700 border-sky-200"
                              : req.status === "fulfilled"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : req.status === "cancelled"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {req.status === "open" && (
                            <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
                          )}
                          {req.status === "matched" && (
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                          )}
                          {req.status === "fulfilled" && (
                            <Package className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                          )}
                          {req.status === "cancelled" && (
                            <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                          )}
                          {getStatusCapitalized(req.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updatingId === req.request_id}
                            >
                              {updatingId === req.request_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Cog className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(req.request_id, "open")
                              }
                            >
                              <FolderOpen className="mr-2 h-4 w-4 text-blue-600" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(req.request_id, "matched")
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Matched
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openFulfillDialog(req)}
                            >
                              <Package className="mr-2 h-4 w-4 text-sky-600" />
                              Fulfill Request
                            </DropdownMenuItem>
                            {req.status === "open" && (
                              <DropdownMenuItem
                                onClick={() => handleCancel(req.request_id)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
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
                <HeartPlus className="h-8 w-8 text-red-700" />
              </EmptyMedia>
              <EmptyTitle className="text-lg font-semibold">
                No blood requests submitted
              </EmptyTitle>
              <EmptyDescription>
                There are currently no blood requests from patients or donors.
                Once a request is made, it will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <AlertDialog
          open={cancelDialog.open}
          onOpenChange={(open) => {
            if (!open) setCancelDialog({ open: false, id: null });
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The request will be permanently
                marked as{" "}
                <span className="font-semibold text-red-700">cancelled</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setCancelDialog({ open: false, id: null })}
              >
                No, keep it
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-800 text-white hover:bg-red-700"
                onClick={() => {
                  handleStatusUpdate(cancelDialog.id, "cancelled");
                  setCancelDialog({ open: false, id: null });
                }}
              >
                Yes, cancel it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={fulfillDialog.open}
          onOpenChange={(open) =>
            !open &&
            setFulfillDialog({
              open: false,
              request: null,
              stock: null,
              units: 1,
              bags: [],
              selectedBags: [],
            })
          }
        >
          <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header Section */}
            <AlertDialogHeader className="border-b pb-4 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <AlertDialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Droplet className="h-6 w-6 text-red-600" />
                    Fulfill Blood Request
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-base">
                    Assign blood bags to fulfill this request
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            {/* Request Summary Card */}
            {fulfillDialog.request && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Request Details
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {fulfillDialog.request.blood_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Patient: {fulfillDialog.request.requester_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Units Needed
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {fulfillDialog.request.units_needed}{" "}
                      <span className="text-sm font-normal">units</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selected:{" "}
                      <span className="font-semibold">
                        {fulfillDialog.selectedBags.length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Information */}
            {fulfillDialog.stock && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Available Stock
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {fulfillDialog.stock.units_available} units
                    </p>
                  </div>
                  {fulfillDialog.stock.units_available <
                    fulfillDialog.request?.units_needed && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-2 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Insufficient Stock
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blood Bags Selection */}
            {fulfillDialog.bags && fulfillDialog.bags.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-foreground">
                    Available Blood Bags
                  </p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {fulfillDialog.bags.length} bags available
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {fulfillDialog.bags.map((bag) => {
                    const daysLeft = getDaysUntilExpiry(bag.expiration_date);
                    const isSelected = fulfillDialog.selectedBags.includes(
                      bag.bag_id
                    );
                    const statusBadge = getBagStatusBadge(daysLeft);

                    return (
                      <div
                        key={bag.bag_id}
                        onClick={() => toggleBagSelection(bag.bag_id)}
                        className={`
                          relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                          ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : `border-border hover:border-primary/50 ${getBagStatusColor(
                                  daysLeft
                                )}`
                          }
                        `}
                      >
                        {/* Selection Checkbox */}
                        <div
                          className={`
                            absolute top-3 right-3 w-5 h-5 border-2 rounded flex items-center justify-center
                            transition-all duration-200
                            ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-border group-hover:border-primary"
                            }
                          `}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        {/* Bag Content */}
                        <div className="pr-8">
                          <div className="flex items-center gap-2 mb-2">
                            <Droplet className="h-4 w-4 text-red-600" />
                            <span className="font-bold text-foreground">
                              Bag #{bag.bag_id}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                Expires:{" "}
                                {
                                  new Date(bag.expiration_date)
                                    .toISOString()
                                    .split("T")[0]
                                }
                              </span>
                            </div>
                            {bag.donation_date && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  Donated:{" "}
                                  {
                                    new Date(bag.donation_date)
                                      .toISOString()
                                      .split("T")[0]
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          {daysLeft <= 5 && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded w-fit">
                              <AlertCircle className="h-3 w-3" />
                              Expiring soon - use first
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No blood bags available for this blood type</p>
              </div>
            )}

            {/* Footer Actions */}
            <AlertDialogFooter className="border-t pt-4 mt-4">
              <AlertDialogCancel
                onClick={() =>
                  setFulfillDialog({
                    open: false,
                    request: null,
                    stock: null,
                    units: 1,
                    bags: [],
                    selectedBags: [],
                  })
                }
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-semibold
                  ${
                    fulfillDialog.selectedBags.length > 0
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
                disabled={
                  fulfillDialog.selectedBags.length === 0 ||
                  updatingId === fulfillDialog.request?.request_id
                }
                onClick={fulfillRequest}
              >
                {updatingId === fulfillDialog.request?.request_id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Fulfill Request ({fulfillDialog.selectedBags.length})
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
