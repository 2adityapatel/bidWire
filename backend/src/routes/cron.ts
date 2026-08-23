import { Router, Request, Response } from "express";
import type { Server } from "socket.io";
import { runCycle } from "../services/cycleService.js";

/**
 * Cron route — called by Upstash QStash every hour.
 * Protected by CRON_SECRET header so only QStash can trigger it.
 *
 * QStash schedule: POST https://your-backend.onrender.com/api/cron/new-cycle
 * Header: x-cron-secret: <CRON_SECRET env var value>
 */
export function createCronRouter(io: Server) {
  const router = Router();

  router.post("/new-cycle", async (req: Request, res: Response) => {
    // ── Secret validation ────────────────────────────────────────────────────
    const cronSecret = process.env.CRON_SECRET;
    const incomingSecret = req.headers["x-cron-secret"];

    if (cronSecret && incomingSecret !== cronSecret) {
      console.warn("⚠️  Unauthorized cron attempt — invalid secret");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log("⏰ /api/cron/new-cycle triggered");

    try {
      const result = await runCycle(io);

      if (!result.executed) {
        // Another instance won the lock — that's fine, not an error
        res.status(200).json({ skipped: true, message: result.message });
        return;
      }

      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error("Cron cycle error:", error);
      res.status(500).json({ error: "Cycle failed" });
    }
  });

  return router;
}
