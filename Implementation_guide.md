# Real-Time Live Auction — Implementation Guide

## Project name (pick one)

| Name | Why it works |
|---|---|
| **BidWire** | Sounds like real infrastructure (a "wire" carrying live price updates), not a toy project |
| **AuctionPulse** | "Pulse" signals real-time/heartbeat — good if you want the README to lead with the sync problem |
| **GavelSync** | Most literal about what the project proves (sync across instances), good if you want the title itself to hint at the engineering story |

Recommendation: **BidWire** — short, sounds like a product a company would actually run, doesn't oversell it as a game.

---

## 1. Scope (final — don't add beyond this)

- Users pick a display name (no password) to "join" — stored in a short-lived session/cookie, not a real account
- A small number of active auction listings (seed 3–5 manually, no admin CRUD needed)
- Anyone can place a bid on an active listing
- Server is the only authority on the current highest bid — a bid is only accepted if it's higher than the current highest, checked atomically
- All connected clients viewing a listing see the new highest bid instantly, regardless of which backend instance they're connected to
- Each listing has a countdown timer; when it hits zero, the server (not the client) decides the listing is closed and broadcasts the winner
- Basic presence: show how many users are currently viewing a listing
- Reconnect handling: if a client's socket drops and reconnects, it re-syncs to the current state instead of showing stale data

Explicitly NOT in scope: payments, image uploads, admin panel, real user accounts, multiple auction categories, bid history pagination beyond the last few bids.

---

## 2. Tech stack (as decided)

- **Backend:** Node.js + Express, TypeScript
- **Real-time:** Socket.io (server + client), `@socket.io/redis-adapter` — actually, since you're on Express not NestJS, you're wiring `@socket.io/redis-adapter` directly rather than through a framework decorator. This is the part where you write the pub/sub logic yourself.
- **Redis client:** `ioredis`
- **Redis hosting:** Upstash (free tier, TCP-compatible so pub/sub works)
- **Database:** PostgreSQL + Prisma
- **DB hosting:** local Docker Postgres for dev → Supabase free tier for the deployed/demo version
- **Frontend:** React + `socket.io-client`
- **Local multi-instance simulation:** Docker Compose (two backend services on different ports + Postgres, all pointing at the same Upstash Redis)
- **Live deployment:** two separate Render free web services (same repo, two deploys) — sidesteps Render's free tier not supporting multi-instance scaling on one service

---

## 3. Data model

```
User (ephemeral — not a real table, just session data)
  - id (uuid, generated on "join")
  - displayName (string, user-entered)

Listing
  - id (uuid)
  - title (string)
  - description (string)
  - startingPrice (int, cents)
  - currentHighestBid (int, cents, nullable)
  - currentHighestBidderName (string, nullable)
  - endsAt (timestamp)
  - status (enum: active | closed)

Bid
  - id (uuid)
  - listingId (fk -> Listing)
  - bidderName (string)
  - amount (int, cents)
  - createdAt (timestamp)
```

Bids are append-only — never update or delete a Bid row. `Listing.currentHighestBid` is a denormalized cache of the max, updated transactionally when a valid bid lands.

---

## 4. The core mechanism — bid placement flow

This is the part your README needs to explain clearly, since it's the whole point of the project.

1. Client emits a `place_bid` socket event: `{ listingId, amount }`
2. The receiving server instance:
   a. Runs a DB transaction: lock the listing row (`SELECT ... FOR UPDATE`), check `amount > currentHighestBid`, and if valid, insert the Bid row and update `Listing.currentHighestBid` + `currentHighestBidderName`
   b. If invalid (someone else's bid already landed higher in the meantime), reject and tell only that client "bid too low, current highest is X"
   c. If valid, **publish** an event to a Redis channel named `listing:{listingId}`, containing the new highest bid
3. Every backend instance is **subscribed** to Redis channels for listings that have at least one client currently watching them
4. Each instance, on receiving the published event, emits a `bid_update` socket event to every one of its own locally-connected clients who are viewing that listing
5. Client UI updates the highest-bid display without a page refresh, no matter which backend instance it happens to be connected to

The DB transaction lock (step 2a) is what prevents two simultaneous bids on different instances from both thinking they're the highest — this is your race-condition story, on top of the cross-instance sync story.

---

## 5. Presence and reconnect

- On `join_listing`, store `SADD presence:{listingId} {socketId}` in Redis with a short expiry, refreshed on a heartbeat; broadcast the updated count via the same pub/sub channel
- On reconnect, client re-emits `join_listing`, and the server responds with the current `Listing` state pulled fresh from Postgres (not from memory) — this is what "replay what you missed" means in practice here; you don't need real event-log replay for this scope, re-fetching current state on reconnect is enough and honestly a more realistic pattern for a project this size

---

## 6. Build order (3 weeks)

**Week 1 — single instance, no Redis yet**
- Express + Prisma + Postgres running locally, seed 3–5 listings
- REST endpoints: list auctions, get one listing
- Socket.io wired up on a single instance: join a listing, place a bid, broadcast to clients on that same instance
- Get the DB-transaction bid validation correct and tested before touching Redis at all

**Week 2 — add Redis, prove cross-instance sync**
- Wire `@socket.io/redis-adapter` with Upstash
- Docker Compose: two backend containers on different ports + Postgres, both pointing at the same Upstash Redis
- Manual test: two browser tabs, one per port, bid from one, confirm the other updates
- Add presence counts

**Week 3 — polish, deploy, document**
- Countdown timer + auto-close logic (a small interval job checking `endsAt`, or scheduled per-listing)
- Reconnect re-sync
- Deploy as two separate Render free services pointed at the same Upstash + Supabase
- Record: max concurrent connections tested, event-propagation latency between instances, what happens on reconnect — put these numbers in the README, not just a tech-stack list

---

## 7. Folder structure

```
bidwire/
  backend/
    src/
      routes/          # REST endpoints (list/get listings)
      sockets/          # socket event handlers (join, place_bid)
      redis/            # pub/sub publish + subscribe setup
      db/               # Prisma schema + client
      services/         # bid validation logic (the transactional core)
    Dockerfile
  frontend/
    src/
      components/       # ListingCard, BidForm, PresenceBadge
      hooks/             # useSocket, useListing
  docker-compose.yml
  README.md
```

---

## 8. Open questions still worth deciding before you start coding

- Countdown auto-close: cron-style check every few seconds across all active listings, or a per-listing scheduled timeout? (Simpler: a single interval every 2–3 seconds checking all active listings' `endsAt` against `now()`.)
- Do you want bid amounts entered freely, or a "minimum increment" rule (e.g. must beat current bid by at least $1)? Minimum increment is a nice, cheap extra realism detail for the README if you want it — optional, not required.