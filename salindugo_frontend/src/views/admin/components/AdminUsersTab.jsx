"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  Shield,
  Building2,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "../../../api/axios";

const roleConfig = {
  admin: {
    label: "Admin",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    icon: Shield,
  },
  hospital: {
    label: "Blood Center",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Building2,
  },
  user: {
    label: "User",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: UserCircle,
  },
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      const data = res.data.users || [];
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }

  const [searchValue, setSearchValue] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchValue);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();

    let filtered = users
      .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
      .filter((u) => {
        return (
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      });

    // Sort by relevance if there's a search query
    if (q) {
      filtered.sort((a, b) => {
        const aName = a.full_name?.toLowerCase() || "";
        const bName = b.full_name?.toLowerCase() || "";
        const aEmail = a.email?.toLowerCase() || "";
        const bEmail = b.email?.toLowerCase() || "";

        // Calculate relevance score
        const getScore = (str) => {
          if (str === q) return 1000; // exact match
          if (str.startsWith(q)) return 500; // starts with
          // Check if any word in the string starts with query
          if (str.split(" ").some((word) => word.startsWith(q))) return 300;
          return 0; // contains somewhere
        };

        const scoreA = Math.max(getScore(aName), getScore(aEmail));
        const scoreB = Math.max(getScore(bName), getScore(bEmail));

        return scoreB - scoreA; // Higher score first
      });
    }

    return filtered;
  }, [users, roleFilter, search]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      hospitals: users.filter((u) => u.role === "hospital").length,
      donors: users.filter((u) => u.role === "user").length,
    }),
    [users],
  );

  const getTableHeaders = () => {
    switch (roleFilter) {
      case "admin":
        return ["Name", "Email", "Role", "Created"];
      case "hospital":
        return ["Name", "Email", "Role", "Region", "Created"];
      case "user":
        return ["Name", "Email", "Blood Type", "Region", "Age", "Created"];
      default:
        return ["Name", "Email", "Role", "Blood Type", "Region", "Created"];
    }
  };

  const getInitials = (fullName = "") => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return first + last;
  };

  const renderRow = (u) => {
    const cellClass = "py-4 px-4 text-foreground";
    const role = roleConfig[u.role] || roleConfig.user;

    switch (roleFilter) {
      case "admin":
        return (
          <>
            <td className={cellClass}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {getInitials(u.full_name)}
                  </span>
                </div>
                <span className="font-medium">{u.full_name}</span>
              </div>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>{u.email}</td>
            <td className={cellClass}>
              <Badge variant="outline" className={role.color}>
                {role.label}
              </Badge>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {new Date(u.created_at).toLocaleDateString()}
            </td>
          </>
        );

      case "hospital":
        return (
          <>
            <td className={cellClass}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium">{u.full_name}</span>
              </div>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>{u.email}</td>
            <td className={cellClass}>
              <Badge variant="outline" className={role.color}>
                {role.label}
              </Badge>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {u.region || "-"}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {new Date(u.created_at).toLocaleDateString()}
            </td>
          </>
        );

      case "user":
        return (
          <>
            <td className={cellClass}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {getInitials(u.full_name)}
                  </span>
                </div>
                <span className="font-medium">{u.full_name}</span>
              </div>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>{u.email}</td>
            <td className={cellClass}>
              {u.blood_type ? (
                <Badge
                  variant="outline"
                  className="bg-red-500/20 text-red-400 border-red-500/30"
                >
                  {u.blood_type}
                </Badge>
              ) : (
                "-"
              )}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {u.region || "-"}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {u.age || "-"}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {new Date(u.created_at).toLocaleDateString()}
            </td>
          </>
        );

      default:
        return (
          <>
            <td className={cellClass}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {getInitials(u.full_name)}
                  </span>
                </div>
                <span className="font-medium">{u.full_name}</span>
              </div>
            </td>
            <td className={`${cellClass} text-muted-foreground`}>{u.email}</td>
            <td className={cellClass}>
              <Badge variant="outline" className={role.color}>
                {role.label}
              </Badge>
            </td>
            <td className={cellClass}>
              {u.blood_type ? (
                <Badge
                  variant="outline"
                  className="bg-red-500/20 text-red-400 border-red-500/30"
                >
                  {u.blood_type}
                </Badge>
              ) : (
                "-"
              )}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {u.region || "-"}
            </td>
            <td className={`${cellClass} text-muted-foreground`}>
              {new Date(u.created_at).toLocaleDateString()}
            </td>
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={Shield}
          color="bg-violet-500/20 text-violet-400"
        />
        <StatCard
          title="Blood Centers"
          value={stats.hospitals}
          icon={Building2}
          color="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          title="Donors & Recipients"
          value={stats.donors}
          icon={UserCircle}
          color="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Users Directory
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 w-full sm:w-72 bg-background border-border"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-52 bg-background border-border">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="hospital">Blood Centers</SelectItem>
                  <SelectItem value="user">
                    Users (Donor + Recipient)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {getTableHeaders().map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-left text-sm font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={getTableHeaders().length}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No users found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {renderRow(u)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
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
                          className={page === pageNum ? "" : "border-border"}
                        >
                          {pageNum}
                        </Button>
                      );
                    },
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
        </CardContent>
      </Card>
    </div>
  );
}
