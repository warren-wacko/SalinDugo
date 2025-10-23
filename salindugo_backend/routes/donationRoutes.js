import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createDonation,
  getDonations,
  updateDonationStatus,
} from "../controller/donationController.js";

const router = express.Router();

router.post("/", authenticateToken, createDonation);
router.get("/", authenticateToken, getDonations);
router.patch("/:id", authenticateToken, updateDonationStatus);

export default router;
