import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./cron/reactivateDonors.js";

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

const app = express();
dotenv.config();

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

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
