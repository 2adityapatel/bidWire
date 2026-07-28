import type { Server, Socket } from "socket.io";
import { prisma } from "../db/prisma.js";
import { placeBid } from "../services/bidService.js";

interface JoinListingPayload {
  listingId: string;
  displayName: string;
}

interface PlaceBidPayload {
  listingId: string;
  amount: number; // in paise
}

/**
 * Returns the live presence count for a listing from joined socket rooms.
 */
function getPresenceCount(io: Server, listingId: string): number {
  const room = io.sockets.adapter.rooms.get(`listing:${listingId}`);
  return room ? room.size : 0;
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

      // Broadcast updated presence count to everyone in the room
      const count = getPresenceCount(io, listingId);
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

    const count = getPresenceCount(io, listingId);
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

    // Broadcast the new highest bid to everyone in the room (including sender)
    io.to(`listing:${listingId}`).emit("bid_update", {
      listingId,
      newHighestBid: result.currentHighestBid,
      bidderName: result.currentHighestBidderName,
      bidId: result.bidId,
    });

    console.log(
      `💰 Bid accepted: ₹${(result.currentHighestBid! / 100).toFixed(2)} by ${displayName} on listing:${listingId}`
    );
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id} (${displayName})`);

    // Update presence for all rooms this socket was in
    socket.rooms.forEach((room) => {
      if (room.startsWith("listing:")) {
        const listingId = room.replace("listing:", "");
        const count = getPresenceCount(io, listingId);
        io.to(room).emit("presence_update", { listingId, count });
      }
    });
  });
}
