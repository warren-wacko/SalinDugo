import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createSchedule,
  getSchedules,
  getPendingSchedule,
  cancelSchedule,
  updateSchedule,
} from "../controller/scheduleController.js";
import { scheduleDonationLimiter } from "../middleware/rateLimitDev.js";

const router = express.Router();

router.post("/", authenticateToken, scheduleDonationLimiter, createSchedule);
router.get("/", authenticateToken, getSchedules);
router.get("/pending/:donor_id", getPendingSchedule);
router.delete("/:id", authenticateToken, cancelSchedule);
router.patch("/:id", authenticateToken, updateSchedule);

export default router;
