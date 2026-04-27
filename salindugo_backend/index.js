import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import cors from "cors";
import "./cron/reactivateDonors.js";
import "./cron/expireBags.js";

import { authenticateToken } from "./middleware/authMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import demandRoutes from "./routes/demandRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import importRoutes from "./routes/importRoutes.js";
console.log("SERVER STARTED:", Date.now());
import pool from "./db.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet());

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/stocks", inventoryRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/demand", demandRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/import", authenticateToken, importRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database connection failed");
  }
});

app.get("/api/forecast/:centerId", async (req, res) => {
  const response = await fetch(
    `${process.env.ML_API_URL}/forecast/${req.params.centerId}`,
  );

  const data = await response.json();

  res.json(data);
});

app.get("/api/history-total/:id", async (req, res) => {
  const response = await fetch(
    `${process.env.ML_API_URL}/history-total/${req.params.id}`,
  );
  const data = await response.json();
  res.json(data);
});

app.get("/api/forecast-total/:id", async (req, res) => {
  const response = await fetch(
    `${process.env.ML_API_URL}/forecast-total/${req.params.id}?days=30`,
  );
  const data = await response.json();
  res.json(data);
});

app.get("/api/forecast-map", async (req, res) => {
  try {
    const response = await fetch(`${process.env.ML_API_URL}/forecast-map`);

    if (!response.ok) {
      const text = await response.text();
      console.error("ML ERROR:", text);
      return res.status(500).json({ error: "ML error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});

app.get("/api/backtest/:id", async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.ML_API_URL}/backtest/${req.params.id}`,
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Backtest error:", err);
    res.status(500).json({ error: "Backtest failed" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
