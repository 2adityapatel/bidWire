import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../lib/socket";
import type { Socket } from "socket.io-client";

export interface Listing {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentHighestBid: number | null;
  currentHighestBidderName: string | null;
  endsAt: string;
  status: "active" | "closed";
}

export interface Bid {
  id: string;
  listingId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface ListingWithBids extends Listing {
  bids: Bid[];
}

interface BidUpdate {
  listingId: string;
  newHighestBid: number;
  bidderName: string | null;
  bidId: string;
}

interface ListingClosed {
  listingId: string;
  winnerName: string | null;
  winningBid: number | null;
}

interface PresenceUpdate {
  listingId: string;
  count: number;
}

interface BidRejected {
  listingId: string;
  error: string;
  currentHighestBid?: number;
}

export function useListing(listingId: string, displayName: string) {
  const [listing, setListing] = useState<ListingWithBids | null>(null);
  const [presenceCount, setPresenceCount] = useState(0);
  const [bidError, setBidError] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [winner, setWinner] = useState<{ name: string | null; amount: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!listingId || !displayName) return;

    const socket = getSocket(displayName);
    socketRef.current = socket;

    const handleListingState = (data: { listing: ListingWithBids }) => {
      setListing(data.listing);
      setIsClosed(data.listing.status === "closed");
      setLoading(false);
    };

    const handleBidUpdate = (data: BidUpdate) => {
      if (data.listingId !== listingId) return;
      setBidError(null);
      setListing((prev) => {
        if (!prev) return prev;
        const newBid: Bid = {
          id: data.bidId,
          listingId: data.listingId,
          bidderName: data.bidderName ?? "",
          amount: data.newHighestBid,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          currentHighestBid: data.newHighestBid,
          currentHighestBidderName: data.bidderName,
          bids: [newBid, ...prev.bids].slice(0, 10),
        };
      });
    };

    const handleListingClosed = (data: ListingClosed) => {
      if (data.listingId !== listingId) return;
      setIsClosed(true);
      setWinner({ name: data.winnerName, amount: data.winningBid });
      setListing((prev) => (prev ? { ...prev, status: "closed" } : prev));
    };

    const handlePresenceUpdate = (data: PresenceUpdate) => {
      if (data.listingId !== listingId) return;
      setPresenceCount(data.count);
    };

    const handleBidRejected = (data: BidRejected) => {
      if (data.listingId !== listingId) return;
      setBidError(data.error);
    };

    socket.on("listing_state", handleListingState);
    socket.on("bid_update", handleBidUpdate);
    socket.on("listing_closed", handleListingClosed);
    socket.on("presence_update", handlePresenceUpdate);
    socket.on("bid_rejected", handleBidRejected);

    // Join this listing room — triggers listing_state response
    socket.emit("join_listing", { listingId, displayName });

    return () => {
      socket.emit("leave_listing", { listingId });
      socket.off("listing_state", handleListingState);
      socket.off("bid_update", handleBidUpdate);
      socket.off("listing_closed", handleListingClosed);
      socket.off("presence_update", handlePresenceUpdate);
      socket.off("bid_rejected", handleBidRejected);
    };
  }, [listingId, displayName]);

  const placeBid = useCallback(
    (amountInPaise: number) => {
      const socket = socketRef.current;
      if (!socket) return;
      setBidError(null);
      socket.emit("place_bid", { listingId, amount: amountInPaise });
    },
    [listingId]
  );

  return { listing, presenceCount, bidError, isClosed, winner, loading, placeBid };
}
