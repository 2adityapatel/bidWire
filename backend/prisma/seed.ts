import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: paise value (1 INR = 100 paise)
const inr = (rupees: number) => rupees * 100;

// Helper: future date from now
const fromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60 * 1000);

async function main() {
  console.log("🌱 Seeding BidWire listings...");

  // Clear existing data (dev only)
  await prisma.bid.deleteMany();
  await prisma.listing.deleteMany();

  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        title: "Vintage Rajasthani Miniature Painting",
        description:
          "An authentic hand-painted miniature painting from Rajasthan, circa 1970s. Depicts the royal court scene with intricate gold detailing. Framed in teakwood.",
        startingPrice: inr(5000),
        endsAt: fromNow(60), // ends in 60 minutes
        status: "active",
      },
    }),
    prisma.listing.create({
      data: {
        title: "Unused Apple MacBook Air M2 (2023)",
        description:
          "Brand new, sealed box MacBook Air M2 chip, 8GB RAM, 256GB SSD, Midnight colour. Indian warranty valid. Reason for selling: received as gift, already have a laptop.",
        startingPrice: inr(75000),
        endsAt: fromNow(90),
        status: "active",
      },
    }),
    prisma.listing.create({
      data: {
        title: "Limited Edition IPL 2024 Match Ball (Signed)",
        description:
          "Official Kookaburra match ball used in IPL 2024 Final, signed by both team captains. Comes with certificate of authenticity and display case.",
        startingPrice: inr(15000),
        endsAt: fromNow(45),
        status: "active",
      },
    }),
    prisma.listing.create({
      data: {
        title: "Sony WH-1000XM5 Wireless Headphones",
        description:
          "Sony WH-1000XM5 in Platinum Silver. Used for 3 months, excellent condition. Industry-leading noise cancellation. All accessories and original box included.",
        startingPrice: inr(18000),
        endsAt: fromNow(30),
        status: "active",
      },
    }),
  ]);

  console.log(`✅ Seeded ${listings.length} listings:`);
  listings.forEach((l) => {
    console.log(
      `   • [${l.id.slice(0, 8)}] ${l.title} — starting ₹${l.startingPrice / 100}`
    );
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
