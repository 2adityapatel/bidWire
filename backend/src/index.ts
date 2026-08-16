import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { prisma } from "./db/prisma.js";
import { listingsRouter } from "./routes/listings.js";
import { registerSocketHandlers } from "./sockets/index.js";
import { startAuctionTimer } from "./services/auctionTimer.js";

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
  process.exit(0);
});

/*
SIGTERM: A termination signal sent by hosting services (like Docker, Render, or AWS) when shutting down or restarting the server.
Disconnects Prisma cleanly from the database before exiting to prevent leaked open database connections.
*/
