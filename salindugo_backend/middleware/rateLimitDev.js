// rateLimiters.js
import Redis from "ioredis";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

// -----------------------------------------------
// Shared Redis connection
// -----------------------------------------------
const redis = new Redis(process.env.REDIS_URL);

const makeStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${prefix}:`, // namespaces each limiter in Redis
  });

// -----------------------------------------------
// Auth — register, forgot password, etc.
// 50 attempts / 15 min is fine for general auth.
// Covers things like forgot-password spam.
// -----------------------------------------------
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  store: makeStore("auth"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// -----------------------------------------------
// Login — strict brute-force protection.
// 5 FAILED attempts / 15 min (skipSuccessfulRequests
// means only failed logins count toward the limit).
// -----------------------------------------------
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: makeStore("login"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ✅ only counts failed attempts
  message: { message: "Too many login attempts. Please try again later." },
});

// -----------------------------------------------
// Profile read — lightweight GET, allow frequent polling.
// 60 reads / min is generous but reasonable for a
// dashboard that may refresh on tab focus.
// -----------------------------------------------
export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: makeStore("profile-read"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile requests, slow down." },
});

// -----------------------------------------------
// Profile update — write operation, should be rare.
// 10 updates / hour prevents runaway update loops
// or accidental spam from a buggy frontend.
// -----------------------------------------------
export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: makeStore("profile-update"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile updates, slow down." },
});

// -----------------------------------------------
// General read — dashboards, lists, etc.
// 100 / 15 min is comfortable for normal browsing
// without blocking heavy dashboard users.
// -----------------------------------------------
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: makeStore("read"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// -----------------------------------------------
// Schedule donation — intentional user action.
// 5 / hour: a real user won't schedule more than
// a handful of donations per session.
// -----------------------------------------------
export const scheduleDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: makeStore("schedule-donation"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many donation schedules, please try again later." },
});

// -----------------------------------------------
// Blood request — high-stakes write, but urgent
// medical need means we can't be too strict.
// 10 / hour balances abuse protection with
// allowing legitimate repeated requests.
// -----------------------------------------------
export const requestBloodLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: makeStore("request-blood"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many blood requests, please try again later." },
});

// -----------------------------------------------
// Walk-in donation — staff-facing, high throughput.
// 100 / hour covers a busy donation center where
// staff process many walk-ins back to back.
// -----------------------------------------------
export const walkInDonationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  store: makeStore("walkin-donation"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many walk-in entries, slow down." },
});
