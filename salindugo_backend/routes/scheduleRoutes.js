import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createSchedule,
  getSchedules,
  updateSchedule,
} from "../controller/scheduleController.js";

const router = express.Router();

router.post("/", authenticateToken, createSchedule);
router.get("/", authenticateToken, getSchedules);
router.patch("/:id", authenticateToken, updateSchedule);

export default router;
