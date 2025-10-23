import express from "express";
import { getHospitals } from "../controller/hospitalController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, getHospitals);

export default router;