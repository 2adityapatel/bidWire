import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const listingsRouter = Router();

// GET /api/listings — all active listings
listingsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "active" },
      orderBy: { endsAt: "asc" },
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
