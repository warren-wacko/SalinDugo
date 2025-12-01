import express from "express";
import {
  adminGetAllUsers,
  adminGetStats,
  adminDashboard,
  adminMonthlyDonations,
  adminMonthlyRequests,
  adminRequestBreakdown,
  adminGetHospitals,
  adminCreateHospital,
  adminToggleHospitalVerification,
  adminGetHospitalStock,
  adminGetAuditLogs,
  adminDonationsPerHospital,
  adminRequestsPerHospital,
  adminLowStockHospitals,
} from "../controller/adminController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, adminDashboard);
router.get("/donations/monthly", authenticateToken, adminMonthlyDonations);
router.get("/requests/monthly", authenticateToken, adminMonthlyRequests);
router.get("/requests/breakdown", authenticateToken, adminRequestBreakdown);
router.get("/users", authenticateToken, adminGetAllUsers);
router.get("/stats", authenticateToken, adminGetStats);

// List all hospitals
router.get("/", authenticateToken, adminGetHospitals);

// Create new hospital
router.post("/", authenticateToken, adminCreateHospital);

// Toggle is_verified
router.patch("/:id/toggle", authenticateToken, adminToggleHospitalVerification);

// Get their blood stock summary
router.get("/:id/stocks", authenticateToken, adminGetHospitalStock);

router.get("/audit-logs", authenticateToken, adminGetAuditLogs);

router.get(
  "/performance/donations",
  authenticateToken,
  adminDonationsPerHospital
);
router.get(
  "/performance/requests",
  authenticateToken,
  adminRequestsPerHospital
);
router.get("/performance/low-stock", authenticateToken, adminLowStockHospitals);

export default router;
