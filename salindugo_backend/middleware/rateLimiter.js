// rateLimiters.js
import rateLimit from "express-rate-limit";

// General auth limiter (register, forgot, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for login (anti brute-force)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 failed attempts per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
  // optional: only count failed logins, not successes
  skipSuccessfulRequests: true,
});

export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too much profile updates, please try again later." },
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // good safe default for GET routes
  standardHeaders: true,
  legacyHeaders: false,
});

export const scheduleDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export const requestBloodLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

export const walkInDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
});
