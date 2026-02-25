import { useEffect, useState, useMemo } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ML_BASE_URL = "http://localhost:8000";

export default function DemandForecastingTab({ hospitalId }) {
  const [totalForecast, setTotalForecast] = useState([]);
  const [bloodTypeForecast, setBloodTypeForecast] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // FETCH FORECAST DATA
  // ===============================
  useEffect(() => {
    if (!hospitalId) return;

    const fetchForecast = async () => {
      try {
        setLoading(true);

        const [totalRes, detailRes] = await Promise.all([
          axios.get(`${ML_BASE_URL}/forecast-total/${hospitalId}?days=30`),
          axios.get(`${ML_BASE_URL}/forecast/${hospitalId}?days=30`),
        ]);

        setTotalForecast(totalRes.data);
        setBloodTypeForecast(detailRes.data);
        console.log("DETAIL RAW:", detailRes.data);
        console.log(totalRes.data);
      } catch (err) {
        console.error("Forecast fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [hospitalId]);

  console.log("TOTAL:", totalForecast);
  console.log("DETAIL:", bloodTypeForecast);

  // ===============================
  // GROUP BY DATE (FOR MULTILINE)
  // ===============================
  const groupedData = useMemo(() => {
    if (!Array.isArray(bloodTypeForecast) || bloodTypeForecast.length === 0) {
      return [];
    }

    return Object.values(
      bloodTypeForecast.reduce((acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = { date: item.date };
        }

        acc[item.date][item.blood_type] = item.predicted_demand;

        return acc;
      }, {}),
    );
  }, [bloodTypeForecast]);

  console.log("GROUPED:", groupedData);

  // ===============================
  // LOADING STATE
  // ===============================
  if (loading) {
    return <div>Loading forecast...</div>;
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      {/* ========================= */}
      {/* TOTAL FORECAST CHART */}
      {/* ========================= */}
      <h2>Total Predicted Demand</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={totalForecast}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="total_predicted_demand" />
        </LineChart>
      </ResponsiveContainer>

      {/* ========================= */}
      {/* BLOOD TYPE FORECAST */}
      {/* ========================= */}
      <h2 style={{ marginTop: 40 }}>Forecast Per Blood Type</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={groupedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line dataKey="A+" />
          <Line dataKey="A-" />
          <Line dataKey="B+" />
          <Line dataKey="B-" />
          <Line dataKey="AB+" />
          <Line dataKey="AB-" />
          <Line dataKey="O+" />
          <Line dataKey="O-" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
