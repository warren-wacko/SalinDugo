// rateLimiters.js
import rateLimit from "express-rate-limit";

// --- COMMON FIX FOR RAILWAY / VERCEL ---
const getRealIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

// General auth limiter (register, forgot, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // increase for testing
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
});

export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});

export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});

export const scheduleDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});

export const requestBloodLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});

export const walkInDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 80,
  keyGenerator: getRealIp,
  standardHeaders: true,
  legacyHeaders: false,
});
