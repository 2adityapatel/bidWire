import { prisma } from "../db/prisma.js";
import type { Server } from "socket.io";
import { redisClient } from "../redis/redis.js";

// Pool of 12 auction items that rotate across cycles
const AUCTION_POOL = [
  {
    title: "Vintage Rajasthani Miniature Painting",
    description:
      "An authentic hand-painted miniature painting from Rajasthan, circa 1970s. Depicts the royal court scene with intricate gold detailing. Framed in teakwood.",
    startingPrice: 500000, // ₹5,000 in paise
  },
  {
    title: "Unused Apple MacBook Air M2 (2023)",
    description:
      "Brand new, sealed box MacBook Air M2 chip, 8GB RAM, 256GB SSD, Midnight colour. Indian warranty valid. Reason for selling: received as gift.",
    startingPrice: 7500000, // ₹75,000 in paise
  },
  {
    title: "Limited Edition IPL 2024 Match Ball (Signed)",
    description:
      "Official Kookaburra match ball used in IPL 2024 Final, signed by both team captains. Comes with certificate of authenticity and display case.",
    startingPrice: 1500000, // ₹15,000 in paise
  },
  {
    title: "Sony WH-1000XM5 Wireless Headphones",
    description:
      "Sony WH-1000XM5 in Platinum Silver. Used for 3 months, excellent condition. Industry-leading noise cancellation. All accessories and original box included.",
    startingPrice: 1800000, // ₹18,000 in paise
  },
  {
    title: "Handcrafted Kashmiri Pashmina Shawl",
    description:
      "Genuine Pashmina shawl from Kashmir, hand-embroidered with traditional Sozni work. Ultra-soft, lightweight. Certificate of authenticity included.",
    startingPrice: 350000, // ₹3,500 in paise
  },
  {
    title: "Samsung Galaxy Tab S9 Ultra (256GB)",
    description:
      "Samsung Galaxy Tab S9 Ultra, 14.6-inch AMOLED display, 256GB storage, with S Pen. Used for 2 months, immaculate condition. All accessories included.",
    startingPrice: 8500000, // ₹85,000 in paise
  },
  {
    title: "Antique Brass Telescope (19th Century)",
    description:
      "Restored 19th century brass telescope, fully functional. Exceptional collectible piece for astronomy enthusiasts or interior decor. Comes with wooden stand.",
    startingPrice: 1200000, // ₹12,000 in paise
  },
  {
    title: "Bose QuietComfort 45 Headphones",
    description:
      "Bose QC45 Wireless Noise Cancelling Headphones in White Smoke. Barely used, 3-month warranty remaining. Exceptional audio quality and battery life.",
    startingPrice: 2200000, // ₹22,000 in paise
  },
  {
    title: "Signed Virat Kohli Cricket Bat",
    description:
      "Official MRF bat signed by Virat Kohli during the 2023 World Cup. Comes in a sealed display case with certificate of authenticity from BCCI.",
    startingPrice: 5000000, // ₹50,000 in paise
  },
  {
    title: "DJI Mini 4 Pro Drone",
    description:
      "DJI Mini 4 Pro with RC 2 controller, 3 batteries and Fly More Combo. Under 250g, no registration required. 4K/60fps camera. Used twice.",
    startingPrice: 6500000, // ₹65,000 in paise
  },
  {
    title: "Rare First Edition — 'The God of Small Things'",
    description:
      "First edition hardcover of Arundhati Roy's Booker Prize-winning novel, 1997. Excellent condition with original dust jacket. A true collector's piece.",
    startingPrice: 250000, // ₹2,500 in paise
  },
  {
    title: "Kindle Scribe (64GB) with Premium Pen",
    description:
      "Kindle Scribe 64GB with Premium Pen. Barely used, perfect for reading and note-taking. Includes leather folio cover.",
    startingPrice: 900000, // ₹9,000 in paise
  },
];

/**
 * Runs one auction cycle:
 * 1. Acquires a distributed Redis lock so only ONE backend instance executes
 * 2. Selects 4 items from the pool (rotated based on current hour)
 * 3. Inserts 4 new active Listing rows with endsAt = now + 60 min
 * 4. Deletes old closed listings (closed more than 2 hours ago) — bids cascade-delete
 * 5. Broadcasts "new_listings" socket event to all connected clients
 */
export async function runCycle(io: Server): Promise<{ executed: boolean; message: string }> {
  const lockKey = "cycle:lock";
  const instanceId = process.env.INSTANCE_ID || "backend-1";

  // Try to acquire distributed lock — only one instance wins
  const acquired = await redisClient.set(lockKey, instanceId, "EX", 30, "NX");

  if (acquired !== "OK") {
    return { executed: false, message: "Lock not acquired — another instance is handling this cycle." };
  }

  console.log(`🔄 [${instanceId}] Cycle lock acquired — starting new auction cycle`);

  // Pick 4 items based on current hour (rotates through pool every cycle)
  const hourSlot = new Date().getHours() % Math.floor(AUCTION_POOL.length / 4);
  const startIdx = (hourSlot * 4) % AUCTION_POOL.length;
  const selectedItems = [
    AUCTION_POOL[startIdx % AUCTION_POOL.length],
    AUCTION_POOL[(startIdx + 1) % AUCTION_POOL.length],
    AUCTION_POOL[(startIdx + 2) % AUCTION_POOL.length],
    AUCTION_POOL[(startIdx + 3) % AUCTION_POOL.length],
  ];

  const endsAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (testing; change to 60 for production)

  // Insert 4 new fresh listings
  const newListings = await Promise.all(
    selectedItems.map((item) =>
      prisma.listing.create({
        data: {
          title: item.title,
          description: item.description,
          startingPrice: item.startingPrice,
          endsAt,
          status: "active",
        },
      })
    )
  );

  console.log(`✅ [${instanceId}] Created ${newListings.length} new listings for this cycle`);

  // Delete old closed listings (closed more than 4 minutes ago) — testing window
  // Change 4 * 60 * 1000 to 2 * 60 * 60 * 1000 for production (2 hours)
  const twoHoursAgo = new Date(Date.now() - 4 * 60 * 1000);
  const deleted = await prisma.listing.deleteMany({
    where: {
      status: "closed",
      updatedAt: { lt: twoHoursAgo },
    },
  });

  if (deleted.count > 0) {
    console.log(`🗑️  [${instanceId}] Deleted ${deleted.count} old closed listings`);
  }

  // Broadcast to all connected clients so Home page re-fetches
  io.emit("new_listings", {
    count: newListings.length,
    listingIds: newListings.map((l) => l.id),
  });

  return {
    executed: true,
    message: `Created ${newListings.length} new listings. Deleted ${deleted.count} old listings.`,
  };
}
