import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

const redis = new Redis(process.env.REDIS_URL);

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  keyGenerator: (req) => ipKeyGenerator(req.ip),

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

/* redeploy this */
