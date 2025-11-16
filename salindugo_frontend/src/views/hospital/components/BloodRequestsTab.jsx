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
  HeartPlus,
  Calendar as CalendarIcon,
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
  });

  const itemsPerPage = 5;

  const openFulfillDialog = async (req) => {
    try {
      const res = await api.get("/api/stocks"); // fetch current hospital stock
      const stock = res.data.find((s) => s.blood_type === req.blood_type);

      setFulfillDialog({
        open: true,
        request: req,
        stock: stock || { units_available: 0 },
        units: req.units_needed,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock info");
    }
  };

  const fulfillRequest = async () => {
    const { request, units } = fulfillDialog;
    try {
      setUpdatingId(request.request_id);

      await api.patch(`/api/requests/${request.request_id}/fulfill`, {
        units: Number(units),
      });

      toast.success("Request fulfilled successfully! ✅");

      setFulfillDialog({ open: false, request: null, stock: null, units: 1 });
      await fetchRequests(); // refresh table
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fulfill request");
    } finally {
      setUpdatingId(null);
    }
  };

  // ✅ Fetch requests
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

  // ✅ Update status
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

  // ✅ Filtering
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

  // ✅ Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusCapitalized = (status) =>
    status.charAt(0).toUpperCase() + status.slice(1);

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
                        {/* ✅ Urgency Badge — Option 1 */}
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
                        {/* ✅ Status Chip — Option 2 */}
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
            })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fulfill Blood Request 🏥</AlertDialogTitle>
              <AlertDialogDescription>
                Provide <strong>{fulfillDialog.request?.units_needed}</strong>{" "}
                requested unit(s) of{" "}
                <strong>{fulfillDialog.request?.blood_type}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {fulfillDialog.stock && (
              <div className="mt-3 space-y-2 text-sm border p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Available Stock:</span>
                  <span className="font-semibold">
                    {fulfillDialog.stock.units_available} units
                  </span>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Units to Fulfill:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={fulfillDialog.stock.units_available}
                    value={fulfillDialog.units}
                    onChange={(e) =>
                      setFulfillDialog({
                        ...fulfillDialog,
                        units: e.target.value,
                      })
                    }
                  />
                </div>

                {fulfillDialog.stock.units_available <
                  fulfillDialog.request?.units_needed && (
                  <p className="text-xs text-amber-600 font-medium">
                    Warning: Not enough stock to fully fulfill this request.
                  </p>
                )}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() =>
                  setFulfillDialog({
                    open: false,
                    request: null,
                    stock: null,
                    units: 1,
                  })
                }
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                className="bg-[oklch(0.45_0.15_15)] hover:bg-[oklch(0.50_0.15_15)] text-white hover:text-white border-none transition-colors duration-200"
                disabled={updatingId === fulfillDialog.request?.request_id}
                onClick={fulfillRequest}
              >
                {updatingId === fulfillDialog.request?.request_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Fulfill Request"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
