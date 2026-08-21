import { prisma } from "../db/prisma.js";

const inr = (rupees: number) => rupees * 100;
const fromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000);

/**
 * Checks if the Listing table is empty. If empty, automatically seeds
 * initial auction listings. Runs programmatically inside Node.js startup.
 */
export async function seedListingsIfEmpty() {
  try {
    const count = await prisma.listing.count();
    if (count > 0) return;

    console.log("🌱 Database is empty — auto-seeding initial auction listings...");

    await Promise.all([
      prisma.listing.create({
        data: {
          title: "Vintage Rajasthani Miniature Painting",
          description:
            "An authentic hand-painted miniature painting from Rajasthan, circa 1970s. Depicts the royal court scene with intricate gold detailing. Framed in teakwood.",
          startingPrice: inr(5000),
          endsAt: fromNow(60),
          status: "active",
        },
      }),
      prisma.listing.create({
        data: {
          title: "Unused Apple MacBook Air M2 (2023)",
          description:
            "Brand new, sealed box MacBook Air M2 chip, 8GB RAM, 256GB SSD, Midnight colour. Indian warranty valid.",
          startingPrice: inr(75000),
          endsAt: fromNow(90),
          status: "active",
        },
      }),
      prisma.listing.create({
        data: {
          title: "Limited Edition IPL 2024 Match Ball (Signed)",
          description:
            "Official Kookaburra match ball used in IPL 2024 Final, signed by both team captains. Comes with certificate of authenticity.",
          startingPrice: inr(15000),
          endsAt: fromNow(45),
          status: "active",
        },
      }),
      prisma.listing.create({
        data: {
          title: "Sony WH-1000XM5 Wireless Headphones",
          description:
            "Sony WH-1000XM5 in Platinum Silver. Used for 3 months, excellent condition. Industry-leading noise cancellation.",
          startingPrice: inr(18000),
          endsAt: fromNow(30),
          status: "active",
        },
      }),
    ]);

    console.log("✅ Auto-seeded initial auction listings successfully");
  } catch (error) {
    console.error("⚠️ Auto-seed check failed:", error);
  }
}
