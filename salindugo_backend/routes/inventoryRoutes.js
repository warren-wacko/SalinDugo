import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  getHospitalStock,
  updateStock,
  getInventoryHistory,
} from "../controller/inventoryController.js";

const router = express.Router();

// 🏥 Hospital endpoints
router.get("/", authenticateToken, getHospitalStock);
router.patch("/", authenticateToken, updateStock);
router.get("/history", authenticateToken, getInventoryHistory);

export default router;
