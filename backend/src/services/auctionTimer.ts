import { prisma } from "../db/prisma.js";
import type { Server } from "socket.io";

/**
 * Checks all active listings every 3 seconds.
 * If endsAt has passed, closes the listing and broadcasts the winner.
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
        // Close the listing
        const closed = await prisma.listing.update({
          where: { id: listing.id },
          data: { status: "closed" },
        });

        console.log(`⏰ Listing closed: "${closed.title}" [${closed.id}]`);

        // Broadcast winner to all clients watching this listing
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
