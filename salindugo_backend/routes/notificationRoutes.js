import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controller/notificationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.patch("/:id/read", authenticateToken, markAsRead);
router.patch("/mark-all-read", authenticateToken, markAllAsRead);
router.delete("/:id", authenticateToken, deleteNotification);

export default router;
