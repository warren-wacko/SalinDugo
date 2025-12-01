import { useState, useEffect } from "react";
import React, { Fragment } from "react";
import api from "../../../api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Building2,
  Plus,
  Search,
  MapPin,
  Mail,
  ShieldCheck,
  ShieldX,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const getInitials = (fullName = "") => {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

function StockBadge({ units }) {
  const isLow = units < 10;
  const isCritical = units < 5;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
        isCritical
          ? "bg-red-500/20 text-red-400"
          : isLow
          ? "bg-amber-500/20 text-amber-400"
          : "bg-emerald-500/20 text-emerald-400"
      }`}
    >
      {isCritical && <AlertTriangle className="w-3 h-3" />}
      {units} units
    </span>
  );
}

function BloodTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center justify-center w-12 h-8 rounded bg-red-500/20 text-red-400 text-xs font-bold">
      {type}
    </span>
  );
}

export default function AdminHospitalTab() {
  const [hospitals, setHospitals] = useState([]);
  const [stocks, setStocks] = useState({});
  const [openRow, setOpenRow] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newHospital, setNewHospital] = useState({
    full_name: "",
    email: "",
    password: "",
    region: "",
  });

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchHospitals();
  }, []);

  async function fetchHospitals() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/");
      setHospitals(res.data);
    } catch (err) {
      console.error("Error loading hospitals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleHospital(id) {
    try {
      await api.patch(`/api/admin/${id}/toggle`);
      fetchHospitals();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  }

  async function fetchStock(id) {
    try {
      // collapse if already opened
      if (stocks[id]) {
        setOpenRow(openRow === id ? null : id);
        return;
      }
      const res = await api.get(`/api/admin/${id}/stocks`);
      setStocks((prev) => ({ ...prev, [id]: res.data.stocks }));
      setOpenRow(id);
    } catch (err) {
      console.error("Error loading stocks:", err);
    }
  }

  async function createHospital() {
    try {
      await api.post("/api/admin/", newHospital);
      setCreateOpen(false);
      setNewHospital({ full_name: "", email: "", password: "", region: "" });
      fetchHospitals();
    } catch (err) {
      console.error("Create hospital error:", err);
    }
  }

  // FILTERING
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = regionFilter === "all" || h.region === regionFilter;

    return matchesSearch && matchesRegion;
  });

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredHospitals.length / pageSize);

  const paginatedHospitals = filteredHospitals.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const verifiedCount = hospitals.filter((h) => h.is_verified).length;

  const regions = [...new Set(hospitals.map((h) => h.region).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-card border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-96 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Centers</p>
                <p className="text-2xl font-bold text-foreground">
                  {hospitals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-foreground">
                  {verifiedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <ShieldX className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {hospitals.length - verifiedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-foreground">
                Blood Center Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage registered hospitals and their blood stock
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search hospitals..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-full sm:w-64 bg-background border-border"
                />
              </div>

              <Select
                value={regionFilter}
                onValueChange={(value) => {
                  setRegionFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Center
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredHospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hospitals found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Verified
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedHospitals.map((h) => (
                      <Fragment key={h.user_id}>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[oklch(0.45_0.15_15)] text-white flex items-center justify-center font-bold text-sm">
                                {getInitials(h.full_name)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {h.full_name}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {h.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {h.region ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-sm text-foreground">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                {h.region}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                h.is_verified
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {h.is_verified ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <ShieldX className="w-3 h-3" />
                              )}
                              {h.is_verified ? "Active" : "Pending"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <Switch
                              checked={h.is_verified}
                              onCheckedChange={() => toggleHospital(h.user_id)}
                            />
                          </td>

                          <td className="px-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchStock(h.user_id)}
                              className="border-border hover:bg-muted"
                            >
                              <Droplets className="w-4 h-4 mr-2 text-red-400" />
                              View
                              {openRow === h.user_id ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                              )}
                            </Button>
                          </td>
                        </tr>

                        {openRow === h.user_id && (
                          <tr className="bg-muted/20">
                            <td colSpan="5" className="px-6 py-4">
                              <div className="pl-12">
                                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <Droplets className="w-4 h-4 text-red-400" />
                                  Blood Stock Inventory
                                </h4>

                                {!stocks[h.user_id] ||
                                stocks[h.user_id].length === 0 ? (
                                  <p className="text-muted-foreground text-sm">
                                    No stock data available for this hospital.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                                    {stocks[h.user_id].map((s) => (
                                      <div
                                        key={s.blood_type}
                                        className="bg-card border border-border rounded-xl p-3 text-center"
                                      >
                                        <BloodTypeBadge type={s.blood_type} />
                                        <div className="mt-2">
                                          <StockBadge
                                            units={s.units_available}
                                          />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {new Date(
                                            s.last_updated
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredHospitals.length)} of{" "}
                    {filteredHospitals.length} hospitals
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-border"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }).map(
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className={
                                page === pageNum ? "" : "border-border"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="border-border"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Hospital Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="w-5 h-5 text-red-400" />
              Add New Blood Center
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Hospital Name
              </label>
              <Input
                placeholder="Enter hospital name"
                value={newHospital.full_name}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, full_name: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </label>
              <Input
                placeholder="hospital@email.com"
                type="email"
                value={newHospital.email}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, email: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <Input
                placeholder="Create a secure password"
                type="password"
                value={newHospital.password}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, password: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Region
              </label>
              <Select
                value={newHospital.region}
                onValueChange={(value) =>
                  setNewHospital({ ...newHospital, region: value })
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NCR">NCR</SelectItem>
                  <SelectItem value="REGION 3">REGION 3</SelectItem>
                  <SelectItem value="REGION 4-A">REGION 4-A</SelectItem>
                  <SelectItem value="REGION 6">REGION 6</SelectItem>
                  <SelectItem value="REGION 7">REGION 7</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={createHospital}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
