// routes/matching.js
import express from "express";
import {
  getMatchesForDonor,
  getMatchesForRecipient,
  getMatchesForHospitalRequest,
} from "../controller/matchingController.js";
import { authenticateToken } from "../middleware/authMiddleware.js"; // your auth middleware

const router = express.Router();

// donor must be authenticated user (role user)
router.get("/donor", authenticateToken, getMatchesForDonor);

router.get("/recipient", authenticateToken, getMatchesForRecipient);

router.get(
  "/hospital/:request_id",
  authenticateToken,
  getMatchesForHospitalRequest
);

export default router;
