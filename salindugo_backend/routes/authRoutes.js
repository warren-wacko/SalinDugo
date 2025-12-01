import express from "express";
import { body } from "express-validator";
const router = express.Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenHandler,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controller/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

// Registration validation middleware
const registerValidation = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/\d/)
    .withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character"),
];

router.post("/register", registerValidation, registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshTokenHandler);
router.patch("/change-password", authenticateToken, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
