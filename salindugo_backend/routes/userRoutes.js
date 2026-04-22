import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controller/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js"; // reuse your JWT middleware
import {
  profileReadLimiter,
  profileUpdateLimiter,
} from "../middleware/rateLimitDev.js";
const router = express.Router();

// GET user profile
router.get("/:id", authenticateToken, profileReadLimiter, getUserProfile);

// PATCH update user profile
router.patch(
  "/:id",
  authenticateToken,
  profileUpdateLimiter,
  updateUserProfile,
);

export default router;
