import express from "express";
import {
  createRequest,
  getRequestById,
  getUserRequests,
  updateRequest,
  fulfillRequest,
  getPendingRequest,
  cancelRequest,
  getAllRequests,
  getAvailableBags,
} from "../controller/requestController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requestBloodLimiter } from "../middleware/rateLimitDev.js";

const router = express.Router();

// 🩸 Create a new blood request
router.post("/", authenticateToken, requestBloodLimiter, createRequest);

// 🩸 Get all requests (for blood centers)
router.get("/", authenticateToken, getAllRequests);

// 🩸 Get a single request by ID
router.get("/:id", authenticateToken, getRequestById);

// Get pending request for user
router.get("/pending/:userId", getPendingRequest);

// Cancel request
router.delete("/:id", authenticateToken, cancelRequest);

// 🩸 Get all requests made by the logged-in user
router.get("/user/:userId", authenticateToken, getUserRequests);

// 🩸 Update or cancel a request
router.patch("/:id", authenticateToken, updateRequest);

// 🩸 Fulfill a request
router.patch("/:id/fulfill", authenticateToken, fulfillRequest);

router.get("/bloodbags/:blood_type", authenticateToken, getAvailableBags);

export default router;
