import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  getHospitalStock,
  updateStock,
  getInventoryHistory,
  createWalkInDonation,
} from "../controller/inventoryController.js";

const router = express.Router();

// 🏥 Hospital endpoints
router.get("/", authenticateToken, getHospitalStock);
router.patch("/", authenticateToken, updateStock);
router.get("/history", authenticateToken, getInventoryHistory);
router.post("/walkin", authenticateToken, createWalkInDonation);
export default router;
