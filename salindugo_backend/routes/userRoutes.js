import express from "express";
import {
  getUserProfile,
  updateUserProfile,
} from "../controller/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js"; // reuse your JWT middleware

const router = express.Router();

// GET user profile
router.get("/:id", authenticateToken, getUserProfile);

// PATCH update user profile
router.patch("/:id", authenticateToken, updateUserProfile);

export default router;
