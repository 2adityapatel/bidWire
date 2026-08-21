import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { prisma } from "./db/prisma.js";
import { listingsRouter } from "./routes/listings.js";
import { registerSocketHandlers } from "./sockets/index.js";
import { startAuctionTimer } from "./services/auctionTimer.js";
import { pubClient, subClient, redisClient } from "./redis/redis.js";

import { seedListingsIfEmpty } from "./services/seedService.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// REST API routes
app.use("/api/listings", listingsRouter);

// ── HTTP server + Socket.io ──────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Allow 60s before considering a client disconnected (helpful for slow networks)
  pingTimeout: 60000,
});

// Attach the Redis adapter so Socket.IO room events fan out across all instances.
// pubClient publishes events; subClient receives them from other instances.
io.adapter(createAdapter(pubClient, subClient));

// Register socket handlers for every new connection
io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

// ── Start server ─────────────────────────────────────────────────────────────
async function main() {
  try {
    // Verify DB connection
    await prisma.$connect();
    console.log("✅ Database connected");

    // Auto-seed initial listings if table is empty
    await seedListingsIfEmpty();

    // Wait for Redis to be ready before accepting socket connections
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        if (pubClient.status === "ready") return resolve();
        pubClient.once("ready", resolve);
        pubClient.once("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        if (subClient.status === "ready") return resolve();
        subClient.once("ready", resolve);
        subClient.once("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        if (redisClient.status === "ready") return resolve();
        redisClient.once("ready", resolve);
        redisClient.once("error", reject);
      }),
    ]);
    console.log("✅ Redis connected");

    // Start the auction expiry timer
    startAuctionTimer(io);

    httpServer.listen(PORT, () => {
      console.log(`🚀 BidWire backend running on http://localhost:${PORT}`);
      console.log(`   CORS origin: ${CORS_ORIGIN}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");
  await prisma.$disconnect();
  await pubClient.quit();
  await subClient.quit();
  await redisClient.quit();
  process.exit(0);
});

/*
SIGTERM: A termination signal sent by hosting services (like Docker, Render, or AWS) when shutting down or restarting the server.
Disconnects Prisma cleanly from the database before exiting to prevent leaked open database connections.
Also quits all three Redis connections cleanly.
*/
