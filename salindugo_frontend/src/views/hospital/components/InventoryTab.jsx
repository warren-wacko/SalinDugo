import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "../../../api/axios";
import { toast } from "sonner";
import { Plus, Minus, CalendarDays } from "lucide-react";

export default function InventoryTab({ accessToken }) {
  const [bloodStock, setBloodStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previousStock, setPreviousStock] = useState([]);

  const isFirstLoad = useRef(true);

  const checkLowStockAlerts = (newStock) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      setPreviousStock(newStock);
      return; // ✅ skip alerts first load
    }

    newStock.forEach((item) => {
      const prev = previousStock.find((p) => p.blood_type === item.blood_type);

      const status = getStockStatus(item.units_available);
      const prevStatus = prev ? getStockStatus(prev.units_available) : null;

      if (
        (status === "low" || status === "critical") &&
        status !== prevStatus
      ) {
        toast.warning(`Low Blood Stock: ${item.blood_type}`, {
          description: `Only ${item.units_available} unit(s) left. Please reorder or collect donations!`,
        });
      }
    });

    setPreviousStock(newStock);
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/stocks");
      setBloodStock(res.data);
      checkLowStockAlerts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchStock();
  }, [accessToken]);

  const updateStock = async (blood_type, change) => {
    try {
      await api.patch(
        "/api/stocks",
        { blood_type, units_change: change, reason: "Manual Update" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Stock Updated");
      fetchStock();

      if (typeof window.refreshNotifications === "function") {
        window.refreshNotifications();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  const getStockStatus = (units) => {
    if (units === 0) return "critical";
    if (units < 5) return "low";
    if (units >= 20) return "full";
    return "safe";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "bg-red-500 text-white";
      case "low":
        return "bg-orange-500 text-white";
      case "full":
        return "bg-green-600 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blood Stock Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time inventory levels and status
          </p>
        </div>
      </div>

      {/* ✅ Global Low Stock Banner */}
      {bloodStock.some((s) => getStockStatus(s.units_available) !== "safe") && (
        <div className="p-3 border-l-4 border-red-600 bg-red-50 rounded-md text-red-700">
          ⚠️ Some blood types are low! Please review and take action.
        </div>
      )}

      {/* Inventory Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bloodStock.map((stock) => {
          const status = getStockStatus(stock.units_available);
          const percentage = Math.min((stock.units_available / 30) * 100, 100);

          return (
            <Card
              key={stock.stock_id}
              className={`hover:shadow-md transition-shadow ${
                status === "critical"
                  ? "border-red-600 animate-pulse shadow-lg shadow-red-500/30"
                  : status === "low"
                  ? "border-orange-500 shadow-lg shadow-orange-500/20"
                  : "border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{stock.blood_type}</h3>
                    <Badge className={getStatusColor(status)}>{status}</Badge>
                  </div>

                  {/* Stock Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Available Units</span>
                      <span className="font-medium">
                        {stock.units_available}
                      </span>
                    </div>

                    <Progress value={percentage} className="h-2" />

                    <p className="text-xs flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Updated{" "}
                      {new Date(stock.last_updated).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="w-1/2"
                      onClick={() => updateStock(stock.blood_type, +1)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2"
                      onClick={() => updateStock(stock.blood_type, -1)}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
