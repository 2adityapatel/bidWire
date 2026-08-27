# ⚡ BidWire — Comprehensive Implementation & Architecture Guide

## 1. Project Overview & Scope

**BidWire** is a high-concurrency, multi-instance real-time auction engine built to demonstrate production-grade distributed system engineering patterns:

- **Ephemeral Sessions:** Users enter a display name (stored in React state & Socket.IO auth handshake) to join auctions without sign-up overhead.
- **Atomic Bid Placement:** The database server is the sole authority on current highest bids. Bid submission uses row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL transactions to guarantee zero race conditions.
- **Cross-Node Event Fanout:** `@socket.io/redis-adapter` syncs bids, home page price feeds, and timer events across multiple backend instances via Redis Pub/Sub in real time.
- **Distributed Timer Locks & Expiration:** Distributed Redis spinlocks (`SET NX EX`) ensure only one backend instance executes auction expiration and cycle rotation.
- **Synchronized Presence:** Active viewer counts are tracked using Redis Sets (`SADD`, `SREM`, `SCARD`) across all server nodes in $O(1)$ time.
- **Automated Rotating Auction Cycle:** Upstash QStash triggers an hourly serverless cron endpoint (`POST /api/cron/new-cycle`) that creates 4 new listings from a 12-item pool, deletes old closed listings, and prevents Render free-tier idle spin-down.
- **Reconnect State Recovery:** Dropped WebSocket connections automatically re-subscribe on reconnect and fetch fresh state directly from PostgreSQL.
- **Visual Multi-Node Routing:** Multi-instance query parameter routing (`?server=2`) and a live UI `<InstanceBadge>` (`⚡ backend-1 Node 1` vs `⚡ backend-2 Node 2`) visually demonstrate distributed node handling.

---

## 2. Technology Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database & Pooling:** PostgreSQL (Atomic row locking via `SELECT FOR UPDATE`, PgBouncer transaction pooling with `?pgbouncer=true`)
- **Real-Time & Distributed Cache:** Socket.IO, `@socket.io/redis-adapter`, Redis (`ioredis`)
- **Frontend:** React 19, TypeScript, Vite, React Router v7, Custom CSS Design System
- **Automation & Serverless Cron:** Upstash QStash (HTTP-based scheduled cron runner & Render anti-sleep trigger)
- **Deployment & Cloud:** Docker Compose (Local dual-node simulation), Render (Dual Web Services), Supabase (PostgreSQL), Upstash (Serverless Redis), Vercel (Frontend SPA)

---

## 3. Data Model & Database Schema

```prisma
enum ListingStatus {
  active
  closed
}

model Listing {
  id                       String        @id @default(uuid())
  title                    String
  description              String
  startingPrice            Int           // in paise (1 INR = 100 paise)
  currentHighestBid        Int?          // in paise, null if no bids yet
  currentHighestBidderName String?
  endsAt                   DateTime
  status                   ListingStatus @default(active)
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt

  bids                     Bid[]

  @@map("listings")
}

model Bid {
  id          String   @id @default(uuid())
  listingId   String
  bidderName  String
  amount      Int      // in paise
  createdAt   DateTime @default(now())

  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@map("bids")
}
```

*Note: Bids are append-only. `Listing.currentHighestBid` and `Listing.currentHighestBidderName` are denormalized caches updated inside atomic transactions.*

---

## 4. Completed Implementation Phases

### Phase 1: Core Single-Instance Engine
- Express + TypeScript backend initialized with Prisma ORM and PostgreSQL.
- REST API routes (`GET /api/listings`, `GET /api/listings/:id`).
- Atomic bid placement engine in `bidService.ts` executing `SELECT * FROM listings WHERE id = $1 FOR UPDATE` within Prisma transactions.
- 32-bit signed integer cap validation (`2,147,483,647` paise / ~₹2.14 Crore) preventing database overflow exceptions.
- React 19 + Vite frontend with auction room, bid submission form, and live countdown timer components.

### Phase 2: Redis Integration & Multi-Instance Scaling
- `@socket.io/redis-adapter` configured with `pubClient` and `subClient` in `redis.ts` & `index.ts`.
- Multi-node presence tracking (`SADD`, `SREM`, `SCARD`) in `sockets/index.ts`.
- Distributed timer locking (`SET auction:close_lock:{id} 1 EX 30 NX`) in `services/auctionTimer.ts` preventing duplicate win broadcasts across backend nodes.
- Local multi-instance simulation via `docker-compose.yml` (`backend_1` on port 3001, `backend_2` on port 3002, `redis` on 6379, `postgres` on 5433).
- Real-time Home page price feed broadcast (`home_bid_update`).

### Phase 3: Production Polish, Cloud Deployment & Reconnect Hardening
- Reconnect state re-syncing: Socket `connect` listeners in `useListing.ts` and `Home.tsx` re-emit `join_listing` and re-fetch REST listings automatically.
- Production Cloud infrastructure setup: Supabase PostgreSQL (with `?pgbouncer=true` PgBouncer compatibility) & Upstash TLS Redis (`rediss://`).
- Dual Render backend deployment configuration via `render.yaml` (`bidwire-backend-1` and `bidwire-backend-2`).
- Vercel SPA frontend deployment configuration via `frontend/vercel.json`.
- Multi-instance demo client routing (`?server=2` in `lib/socket.ts`) and visual Node status badge (`InstanceBadge.tsx`).
- Detailed technical `README.md` documenting architecture topology and engineering mechanics.

### Phase 4: Automated Rotating Auction Cycle & QStash Integration
- **12-Item Rotating Pool (`cycleService.ts`):** Curated pool of 12 luxury & collectible items rotating 4 items per cycle.
- **Serverless Cron Route (`routes/cron.ts`):** `POST /api/cron/new-cycle` protected with `CRON_SECRET` header validation.
- **Distributed Cycle Lock:** Redis `cycle:lock` (`SET NX EX 30`) ensures single execution across Render instances.
- **Automated Garbage Collection:** Closed listings older than the result window are deleted; associated bids cascade-delete via database foreign keys.
- **Upstash QStash Integration:** QStash sends an hourly HTTP request to `/api/cron/new-cycle`, keeping Render free-tier backend instances from sleeping.
- **Split UI Layout:** Home page cleanly divides content into `Active Auctions` (live) and `🏆 Recent Winners & Results` (ended result window) with custom winner banners.

---

## 5. Folder & Codebase Structure

```
bidwire/
├── backend/
│   ├── src/
│   │   ├── db/              # Prisma DB client initialization
│   │   ├── redis/           # ioredis pubClient, subClient & redisClient
│   │   ├── routes/          # REST endpoints (/api/listings, /api/cron)
│   │   ├── services/        # Atomic bid placement, timer locks, cycle rotation, auto-seed
│   │   ├── sockets/         # Socket.IO event registration & presence tracking
│   │   └── index.ts         # Express server, Socket.IO adapter & app entry point
│   ├── prisma/              # Prisma schema & seed script
│   ├── package.json         # Scripts & dependencies
│   └── Dockerfile           # Multi-stage production Docker image
├── frontend/
│   ├── src/
│   │   ├── components/      # ListingCard, BidForm, PresenceBadge, InstanceBadge, Countdown
│   │   ├── hooks/           # useListing & useSocket custom React hooks
│   │   ├── lib/             # Socket.IO client singleton & ?server=2 query router
│   │   ├── pages/           # Home & AuctionRoom pages
│   │   ├── App.tsx          # App root with connection state banner
│   │   └── index.css        # Full Vanilla CSS design system
│   ├── package.json         # Vite & React dependencies
│   └── vercel.json          # Vercel SPA routing configuration
├── docker-compose.yml       # Local multi-instance cluster simulation
├── render.yaml              # Render blueprint specification for dual backends
├── Implementation_guide.md  # Comprehensive project implementation guide
└── README.md                # Engineering documentation & architecture breakdown
```

---

## 6. Verification & Health Checks

- **Backend Build:** `npm run build` in `backend/` (TypeScript `tsc` compilation).
- **Frontend Build:** `npm run build` in `frontend/` (TypeScript `tsc -b` and Vite bundle build).
- **Health Check Endpoint:** `GET /health` returns `{ status: "ok", timestamp: "..." }`.
- **Cron Cycle Endpoint:** `POST /api/cron/new-cycle` with header `x-cron-secret: <CRON_SECRET>` triggers new cycle rotation.