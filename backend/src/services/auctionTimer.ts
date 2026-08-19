import { prisma } from "../db/prisma.js";
import type { Server } from "socket.io";
import { redisClient } from "../redis/redis.js";

/**
 * Checks all active listings every 3 seconds.
 * If endsAt has passed, closes the listing and broadcasts the winner.
 *
 * Multi-instance safety: uses a Redis SET NX lock so only ONE instance
 * closes and broadcasts each expired listing. The other instance(s) will
 * see the lock already held and skip — preventing duplicate listing_closed events.
 */
export function startAuctionTimer(io: Server) {
  const INTERVAL_MS = 3000;

  const tick = async () => {
    try {
      // Find all active listings that have expired
      const expiredListings = await prisma.listing.findMany({
        where: {
          status: "active",
          endsAt: { lte: new Date() },
        },
      });

      for (const listing of expiredListings) {
        // Try to acquire the close lock for this listing.
        // SET NX (set-if-not-exists) returns "OK" only for the first caller.
        // EX 30 ensures the lock auto-expires after 30s in case of a crash.
        const lockKey = `auction:close_lock:${listing.id}`;
        const acquired = await redisClient.set(lockKey, "1", "EX", 30, "NX");

        if (acquired !== "OK") {
          // Another instance already claimed this listing — skip it
          continue;
        }

        // Close the listing in the DB
        const closed = await prisma.listing.update({
          where: { id: listing.id },
          data: { status: "closed" },
        });

        console.log(`⏰ Listing closed: "${closed.title}" [${closed.id}]`);

        // Broadcast winner to all clients watching this listing (all instances)
        io.to(`listing:${listing.id}`).emit("listing_closed", {
          listingId: listing.id,
          winnerName: listing.currentHighestBidderName ?? null,
          winningBid: listing.currentHighestBid ?? null,
        });
      }
    } catch (error) {
      console.error("Auction timer tick error:", error);
    }
  };

  const interval = setInterval(tick, INTERVAL_MS);
  console.log("⏱️  Auction timer started (3s interval)");

  // Return a cleanup function
  return () => clearInterval(interval);
}
