import { prisma } from "../db/prisma.js";

// Minimum bid increment in paise (₹1 = 100 paise)
const MIN_INCREMENT_PAISE = 100;

export interface PlaceBidInput {
  listingId: string;
  bidderName: string;
  amount: number; // in paise
}

export interface PlaceBidResult {
  success: boolean;
  error?: string;
  currentHighestBid?: number;
  currentHighestBidderName?: string | null;
  bidId?: string;
}

/**
 * Places a bid atomically using a DB transaction with SELECT FOR UPDATE.
 * This prevents race conditions when two bids land simultaneously on
 * different server instances — only one can hold the row lock at a time.
 */
export async function placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
  const { listingId, bidderName, amount } = input;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the listing row — blocks concurrent bids on this listing
      const listing = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          currentHighestBid: number | null;
          endsAt: Date;
        }>
      >`
        SELECT id, status, "currentHighestBid", "endsAt"
        FROM listings
        WHERE id = ${listingId}
        FOR UPDATE
      `;

      if (!listing.length) {
        return { success: false, error: "Listing not found" };
      }

      const l = listing[0];

      if (l.status !== "active") {
        return { success: false, error: "This auction has already closed" };
      }

      if (new Date(l.endsAt) <= new Date()) {
        return { success: false, error: "This auction has already ended" };
      }

      const startingPrice = await getStartingPrice(tx, listingId);
      const minimumBid =
        l.currentHighestBid !== null
          ? l.currentHighestBid + MIN_INCREMENT_PAISE
          : startingPrice;

      if (amount < minimumBid) {
        return {
          success: false,
          error:
            l.currentHighestBid !== null
              ? `Bid too low. Minimum bid is ₹${minimumBid / 100} (current highest + ₹${MIN_INCREMENT_PAISE / 100})`
              : `Bid too low. Minimum starting bid is ₹${minimumBid / 100}`,
          currentHighestBid: l.currentHighestBid ?? undefined,
        };
      }

      // Insert the bid
      const bid = await tx.bid.create({
        data: {
          listingId,
          bidderName,
          amount,
        },
      });

      // Update the listing's denormalized highest bid
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: {
          currentHighestBid: amount,
          currentHighestBidderName: bidderName,
        },
      });

      return {
        success: true,
        bidId: bid.id,
        currentHighestBid: updated.currentHighestBid!,
        currentHighestBidderName: updated.currentHighestBidderName,
      };
    });

    return result;
  } catch (error) {
    console.error("placeBid error:", error);
    return { success: false, error: "Internal server error placing bid" };
  }
}

async function getStartingPrice(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  listingId: string
): Promise<number> {
  const listing = await tx.listing.findUnique({
    where: { id: listingId },
    select: { startingPrice: true },
  });
  return listing?.startingPrice ?? 0;
}
