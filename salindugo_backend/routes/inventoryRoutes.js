import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  getHospitalStock,
  updateStock,
  getInventoryHistory,
  createWalkInDonation,
  getStockHistoryByBloodType,
  getHospitalsForecastMap,
} from "../controller/inventoryController.js";
import { readLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// 🏥 Hospital endpoints
router.get("/", authenticateToken, readLimiter, getHospitalStock);
router.patch("/", authenticateToken, updateStock);
router.get("/history", authenticateToken, readLimiter, getInventoryHistory);
router.post("/walkin", authenticateToken, createWalkInDonation);
router.get(
  "/history/:bloodType",
  authenticateToken,
  getStockHistoryByBloodType,
);
router.get("/hospitals/forecast-map", getHospitalsForecastMap);
export default router;
