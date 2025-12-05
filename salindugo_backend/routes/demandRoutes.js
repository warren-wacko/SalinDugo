import express from "express";
import {
  getDemandForecast,
  getAdminDemandForecast,
} from "../controller/demandController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// hospital route
router.get("/forecast", authenticateToken, getDemandForecast);

export default router;
