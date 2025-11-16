import express from "express";
import {
  createRequest,
  getRequestById,
  getUserRequests,
  updateRequest,
  fulfillRequest,
} from "../controller/requestController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🩸 Create a new blood request
router.post("/", authenticateToken, createRequest);

// 🩸 Get a single request by ID
router.get("/:id", authenticateToken, getRequestById);

// 🩸 Get all requests made by the logged-in user
router.get("/", authenticateToken, getUserRequests);

// 🩸 Update or cancel a request
router.patch("/:id", authenticateToken, updateRequest);

// 🩸 Fulfill a request
router.patch("/:id/fulfill", authenticateToken, fulfillRequest);

export default router;
