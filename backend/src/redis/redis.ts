import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * pubClient — used by @socket.io/redis-adapter to publish events to Redis.
 * subClient — used by @socket.io/redis-adapter to subscribe and receive events.
 * They MUST be separate connections: a Redis client in subscribe mode cannot
 * issue regular commands, so we never share these two.
 */
export const pubClient = new Redis(REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: null, // required for blocking commands
});

export const subClient = pubClient.duplicate();

/**
 * redisClient — a general-purpose connection for non-pub/sub commands
 * (e.g. SADD, SREM, SCARD for presence tracking, SET NX for auction locks).
 */
export const redisClient = pubClient.duplicate();

// Log connection events (useful for debugging Docker networking issues)
pubClient.on("connect", () => console.log("✅ Redis pubClient connected"));
pubClient.on("error", (err) => console.error("❌ Redis pubClient error:", err));

subClient.on("connect", () => console.log("✅ Redis subClient connected"));
subClient.on("error", (err) => console.error("❌ Redis subClient error:", err));

redisClient.on("connect", () => console.log("✅ Redis redisClient connected"));
redisClient.on("error", (err) =>
  console.error("❌ Redis redisClient error:", err)
);
