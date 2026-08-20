import type { Server, Socket } from "socket.io";
import { prisma } from "../db/prisma.js";
import { placeBid } from "../services/bidService.js";
import { redisClient } from "../redis/redis.js";

interface JoinListingPayload {
  listingId: string;
  displayName: string;
}

interface PlaceBidPayload {
  listingId: string;
  amount: number; // in paise
}

/**
 * Redis key for the presence set of a listing.
 * Each member is a socketId. SCARD gives the cross-instance viewer count.
 */
function presenceKey(listingId: string): string {
  return `presence:${listingId}`;
}

/**
 * Returns the live presence count for a listing from Redis.
 * Uses SCARD on a Redis Set so it includes viewers on ALL instances.
 */
async function getPresenceCount(listingId: string): Promise<number> {
  return redisClient.scard(presenceKey(listingId));
}

export function registerSocketHandlers(io: Server, socket: Socket) {
  const displayName = (socket.handshake.auth?.displayName as string) || "Anonymous";

  console.log(`🔌 Socket connected: ${socket.id} (${displayName})`);

  // ── join_listing ──────────────────────────────────────────────────────────
  socket.on("join_listing", async (payload: JoinListingPayload) => {
    const { listingId } = payload;
    const room = `listing:${listingId}`;

    // Join the socket.io room for this listing
    await socket.join(room);

    // Track presence in Redis — SADD is idempotent so reconnects are safe.
    // Refresh the TTL on every join so the key doesn't expire while viewers are active.
    await redisClient.sadd(presenceKey(listingId), socket.id);
    await redisClient.expire(presenceKey(listingId), 3600); // 1-hour TTL as safety net

    try {
      // Fetch fresh state from DB (handles reconnect re-sync automatically)
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          bids: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });

      if (!listing) {
        socket.emit("error", { message: "Listing not found" });
        return;
      }

      // Send current state to the reconnecting/joining client
      socket.emit("listing_state", { listing });

      // Broadcast updated presence count to everyone in the room (all instances)
      const count = await getPresenceCount(listingId);
      io.to(room).emit("presence_update", { listingId, count });

      console.log(`👤 ${displayName} joined listing:${listingId} (${count} watching)`);
    } catch (error) {
      console.error("join_listing error:", error);
      socket.emit("error", { message: "Failed to join listing" });
    }
  });

  // ── leave_listing ─────────────────────────────────────────────────────────
  socket.on("leave_listing", async (payload: { listingId: string }) => {
    const { listingId } = payload;
    const room = `listing:${listingId}`;

    await socket.leave(room);

    // Remove from Redis presence set
    await redisClient.srem(presenceKey(listingId), socket.id);

    const count = await getPresenceCount(listingId);
    io.to(room).emit("presence_update", { listingId, count });

    console.log(`👋 ${displayName} left listing:${listingId} (${count} watching)`);
  });

  // ── place_bid ─────────────────────────────────────────────────────────────
  socket.on("place_bid", async (payload: PlaceBidPayload) => {
    const { listingId, amount } = payload;

    const result = await placeBid({ listingId, bidderName: displayName, amount });

    if (!result.success) {
      // Only tell this client about the rejection
      socket.emit("bid_rejected", {
        listingId,
        error: result.error,
        currentHighestBid: result.currentHighestBid,
      });
      return;
    }

    // Broadcast the new highest bid to everyone in the room across ALL instances.
    // The Redis adapter picks this up and fans it out to backend_1 AND backend_2.
    io.to(`listing:${listingId}`).emit("bid_update", {
      listingId,
      newHighestBid: result.currentHighestBid,
      bidderName: result.currentHighestBidderName,
      bidId: result.bidId,
    });

    // Also broadcast globally so Home page listing cards update in real-time
    io.emit("home_bid_update", {
      listingId,
      newHighestBid: result.currentHighestBid,
      bidderName: result.currentHighestBidderName,
    });

    console.log(
      `💰 Bid accepted: ₹${(result.currentHighestBid! / 100).toFixed(2)} by ${displayName} on listing:${listingId}`
    );
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log(`❌ Socket disconnected: ${socket.id} (${displayName})`);

    // Update presence in Redis and broadcast updated count for all rooms this socket was in.
    // socket.rooms still contains the rooms at disconnect time.
    const cleanupPromises: Promise<void>[] = [];

    socket.rooms.forEach((room) => {
      if (room.startsWith("listing:")) {
        const listingId = room.replace("listing:", "");
        const cleanup = async () => {
          await redisClient.srem(presenceKey(listingId), socket.id);
          const count = await getPresenceCount(listingId);
          io.to(room).emit("presence_update", { listingId, count });
        };
        cleanupPromises.push(cleanup());
      }
    });

    await Promise.all(cleanupPromises);
  });
}
