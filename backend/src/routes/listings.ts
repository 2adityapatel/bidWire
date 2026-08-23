import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const listingsRouter = Router();

// GET /api/listings — active listings + recently closed (within 2h result window)
listingsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    // Show closed listings for 4 minutes result window (testing; change to 2 * 60 * 60 * 1000 for production)
    const twoHoursAgo = new Date(Date.now() - 4 * 60 * 1000);

    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { status: "active" },
          // Show closed listings for up to 2 hours so users see winner results
          { status: "closed", updatedAt: { gte: twoHoursAgo } },
        ],
      },
      orderBy: [
        // Active listings first, then closed
        { status: "asc" },
        { endsAt: "asc" },
      ],
    });
    res.json({ listings });
  } catch (error) {
    console.error("GET /api/listings error:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /api/listings/:id — single listing + last 10 bids
listingsRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json({ listing });
  } catch (error) {
    console.error(`GET /api/listings/${id} error:`, error);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});
