// rateLimiters.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ------------------------------
// Global Safe Key Generator
// ------------------------------
// express-rate-limit v7 *requires* ipKeyGenerator for IPv6 correctness.
// This automatically handles:
// - Railway / Vercel proxies
// - IPv4 + IPv6
// - x-forwarded-for chains
// ------------------------------

// General auth limiter (register, forgot, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for login (anti brute force)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,

  // Only count FAILED attempts
  skipSuccessfulRequests: true,

  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
});

// Profile GET
export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Profile updates
export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile updates, slow down." },
});

// Normal read limiter
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Schedule donation
export const scheduleDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Blood request
export const requestBloodLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Walk-in donation limiter
export const walkInDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 80,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
