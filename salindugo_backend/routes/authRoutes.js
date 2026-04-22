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
import { loginLimiter, authLimiter } from "../middleware/rateLimitDev.js";
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
    .withMessage("Password must contain a special character")
    .matches(/\S/)
    .withMessage("Password cannot be only whitespace"),
];

router.post("/register", authLimiter, registerValidation, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/logout", authLimiter, logoutUser);
router.post("/refresh-token", authLimiter, refreshTokenHandler);
router.patch(
  "/change-password",
  authLimiter,
  authenticateToken,
  changePassword,
);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
export default router;
