import Redis from "ioredis";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

// Shared Redis connection
const redis = new Redis(process.env.REDIS_URL);

const makeStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rl:${prefix}:`, // namespaces each limiter in Redis
  });

// Auth — register, forgot password, etc.
// Covers things like forgot-password spam.

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  store: makeStore("auth"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Login — strict brute-force protection.
// 5 FAILED attempts / 15 min (skipSuccessfulRequests
// means only failed logins count toward the limit).
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

// Profile read — lightweight GET, allow frequent polling.
export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: makeStore("profile-read"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile requests, slow down." },
});

// Profile update — write operation, should be rare.
// 10 updates / hour prevents runaway update loops
// or accidental spam from a buggy frontend.
export const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: makeStore("profile-update"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile updates, slow down." },
});

// General read — dashboards, lists, etc.
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: makeStore("read"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
