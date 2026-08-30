# BidWire — Distributed Real-Time Auction Engine

> A high-concurrency, multi-instance live auction platform built with **Node.js, TypeScript, Socket.IO, Redis, PostgreSQL (Prisma), and React**. Designed to demonstrate race-condition-safe bid processing, cross-node event propagation, distributed timer & cycle synchronization, automated serverless cron rotation, and robust reconnect state re-syncing.

---

## Live Links

| Resource | URL |
|:---|:---|
| **Live Demo (Frontend)** | https://bid-wire-seven.vercel.app/ |
| **Case Study & Architecture** | https://bidwire-landing.vercel.app |
| **GitHub Repository** | https://github.com/2adityapatel/bidWire |

To test cross-instance sync:
- **Node 1 tab:** `https://bid-wire-seven.vercel.app/`
- **Node 2 tab:** `https://bid-wire-seven.vercel.app/?server=2`

Place a bid in one tab — watch it reflect in the other instantly via Redis Pub/Sub.

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database & Pooling:** PostgreSQL via Supabase (row locking via `SELECT FOR UPDATE`, PgBouncer transaction pooling with `?pgbouncer=true`)
- **Real-Time & Caching:** Socket.IO, `@socket.io/redis-adapter`, Redis (`ioredis`)
- **Frontend:** React 19, TypeScript, Vite, React Router v7, Vanilla CSS
- **Cron & Automation:** Upstash QStash (HTTP-based cron runner & anti-sleep pinger)
- **Hosting:** Render (dual backend instances), Supabase (PostgreSQL), Upstash (Serverless Redis), Vercel (Frontend + Landing)

---

## Architecture & Deployment Topology

```mermaid
flowchart TD
    subgraph Clients["Client Tier (React + Socket.IO Client)"]
        UserA["User A (Tab 1 -> Node 1)"]
        UserB["User B (Tab 2 -> Node 2 via ?server=2)"]
    end

    subgraph QStash["Serverless Automation"]
        Cron["Upstash QStash Cron (POST /api/cron/new-cycle)"]
    end

    subgraph Cluster["Backend Cluster Tier (Render Web Services)"]
        Node1["Backend Instance 1 (Port 3001 / bidwire-backend-1)"]
        Node2["Backend Instance 2 (Port 3002 / bidwire-backend-2)"]
    end

    subgraph Infrastructure["Persistence & Message Bus Tier"]
        Redis[("Upstash Redis (Pub/Sub + Presence Sets + Distributed Lock)")]
        Postgres[("Supabase PostgreSQL (Prisma ORM with SELECT FOR UPDATE)")]
    end

    Cron -->|Hourly HTTP Ping| Node1

    UserA <-->|WebSocket / HTTP| Node1
    UserB <-->|WebSocket / HTTP| Node2

    Node1 <-->|Pub/Sub & Sets| Redis
    Node2 <-->|Pub/Sub & Sets| Redis

    Node1 -->|Transaction Lock| Postgres
    Node2 -->|Transaction Lock| Postgres
```

---

## Detailed System Mechanics & Implementation Guide

### 1. Race-Condition Protection (`SELECT FOR UPDATE`)
In a live auction environment, multiple users may attempt to place a bid on the same listing simultaneously across different backend nodes. Simple read-then-write logic creates critical race conditions (dirty reads and phantom bid wins).

**Implementation in `bidService.ts`:**
- Every bid placement executes within an isolated database transaction (`prisma.$transaction`).
- Raw SQL query `SELECT * FROM "listings" WHERE id = $1 FOR UPDATE` locks the specific listing row exclusively at the PostgreSQL storage engine level.
- Concurrent transaction attempts on the same listing block until the active transaction completes.
- The new bid amount is validated against `currentHighestBid` inside the transaction. If valid, the `Bid` record is inserted and `Listing.currentHighestBid` + `currentHighestBidderName` are updated atomically.
- **32-Bit Integer Safety:** All monetary values are processed in paise (1 INR = 100 paise) and capped at PostgreSQL's 32-bit signed `INT4` maximum (`2,147,483,647` paise / ~₹2.14 Crore) to prevent numeric overflow exceptions.

```typescript
// backend/src/services/bidService.ts
export async function placeBid({ listingId, bidderName, amount }: PlaceBidParams) {
  return prisma.$transaction(async (tx) => {
    // Lock listing row exclusively for the duration of this transaction
    const listings = await tx.$queryRaw<Listing[]>`
      SELECT * FROM "listings" WHERE id = ${listingId} FOR UPDATE
    `;
    const listing = listings[0];

    // Validate bid amount against atomic current max
    const currentMax = listing.currentHighestBid ?? listing.startingPrice;
    if (amount <= currentMax) {
      return { success: false, error: "Bid must be higher than current highest bid" };
    }

    // Insert immutable Bid row & update denormalized Listing cache
    const bid = await tx.bid.create({ data: { listingId, bidderName, amount } });
    await tx.listing.update({
      where: { id: listingId },
      data: { currentHighestBid: amount, currentHighestBidderName: bidderName }
    });

    return { success: true, bidId: bid.id, currentHighestBid: amount };
  });
}
```

---

### 2. Cross-Instance Event Synchronization (`@socket.io/redis-adapter`)
When horizontally scaled across multiple backend nodes, clients connected to `backend_2` must immediately see bids placed through `backend_1`.

**Implementation in `redis.ts` & `index.ts`:**
- `@socket.io/redis-adapter` binds Socket.IO rooms to Redis Pub/Sub channels using dual `ioredis` instances (`pubClient` and `subClient`).
- When `backend_1` accepts a bid, `io.to("listing:ID").emit("bid_update", ...)` publishes the payload to Redis.
- Redis fans out the message to `backend_2`, which instantly emits the WebSocket event to all locally connected clients in that room.
- Global `home_bid_update` events are simultaneously broadcast so home page listing cards across all server nodes reflect live price increases without manual refreshes.

---

### 3. Distributed Timer Lock (`SET NX EX`)
In a multi-node cluster, each node runs an independent timer check. Without coordination, multiple nodes could simultaneously close the same auction — causing duplicate notifications and redundant DB writes.

**Implementation in `auctionTimer.ts`:**
- A periodic timer runs every 3 seconds on all backend instances.
- When an expired listing (`endsAt <= now()` and `status = active`) is detected, the instance attempts to acquire an atomic Redis lock:
  `SET auction:close_lock:{listingId} 1 EX 30 NX`
- Only the **single node** that wins the lock executes the DB status update to `closed` and emits the `listing_closed` event with winner details.

**Known Limitation:** The `SET NX EX 30` lock does not use a unique token with a Lua-script release (Redlock pattern), so in an edge case where the lock TTL expires before the operation completes, a second instance could acquire the lock. Acceptable for a portfolio project; production would use Redlock.

---

### 4. Automated Rotating Auction Cycle & QStash Anti-Sleep
To keep the application live, dynamic, and realistic 24/7 without manual seeding:

- **12-Item Rotating Pool (`cycleService.ts`):** 12 curated items rotate through 4 slots every cycle.
- **Distributed Cycle Execution:** `POST /api/cron/new-cycle` acquires a `cycle:lock` in Redis (`SET NX EX 30`) ensuring only one node executes cycle rotation when QStash triggers.
- **Automatic Garbage Collection:** Closed listings older than their result window are deleted from Postgres; associated bids cascade-delete via Foreign Key constraints.
- **Render Anti-Sleep:** QStash pings `/api/cron/new-cycle` hourly with an `x-cron-secret` header, preventing Render's free tier 15-minute inactivity spin-down.

---

### 5. Synchronized Presence Tracking (Redis Sets)
To accurately display how many users are actively viewing an auction across all cluster nodes:

- Joining an auction executes `SADD presence:{listingId} {socketId}` in Redis with an expiring TTL.
- Leaving or disconnecting executes `SREM presence:{listingId} {socketId}`.
- Viewer count is calculated in O(1) time across all nodes using `SCARD presence:{listingId}` and broadcast via `presence_update`.

---

### 6. Client Reconnect & State Re-sync
When a client experiences network interruption:
- Upon socket reconnection, the client automatically re-emits `join_listing`.
- The server responds with `listing_state`, fetching the latest bid history and auction state directly from PostgreSQL.
- If the auction closed while the client was offline, the UI immediately renders the winner banner with final price details.

---

### 7. Multi-Instance Client Routing & Visual Node Badge
- `lib/socket.ts` reads `?server=2` from the URL to route the socket connection to Backend Node 2 (`VITE_BACKEND_URL_2`).
- This is a **demo/visualization device** for showing cross-instance sync — not production load balancing.
- Upon connection, the backend emits a `welcome` event with its `INSTANCE_ID`.
- An `<InstanceBadge>` renders top-right displaying `backend-1 Node 1` (purple) or `backend-2 Node 2` (amber).
- **Important:** The socket singleton is only created **after** the user enters their display name. Creating it at app root level would lock `displayName` to `"Guest"` before the user types — causing all bids to be attributed to "Guest" across both instances.

---

### 8. PgBouncer & Transaction Pooling Compatibility
Supabase provides PgBouncer as a connection pooler. Prisma's default prepared-statement caching is incompatible with PgBouncer in transaction mode. The connection string must include `?pgbouncer=true` to disable prepared statements:

```
postgresql://postgres:[PASS]@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

Without this flag, the app throws `prepared statement already exists` errors under concurrent load.

---

## Local Development & Multi-Instance Simulation

Simulate a production multi-node cluster locally using Docker Compose.

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/2adityapatel/bidWire.git
   cd bidWire
   ```

2. **Start multi-instance cluster:**
   ```bash
   docker-compose up --build
   ```
   This provisions:
   - `bidwire_postgres`: PostgreSQL on port `5433`
   - `bidwire_redis`: Redis on port `6379`
   - `bidwire_backend_1`: Express instance 1 on port `3001`
   - `bidwire_backend_2`: Express instance 2 on port `3002`

3. **Start the frontend dev server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Start the landing page dev server (optional):**
   ```bash
   cd landing
   npm install
   npm run dev
   ```

5. **Verify cross-instance sync:**
   - **Node 1:** `http://localhost:5173` (purple badge)
   - **Node 2:** `http://localhost:5173?server=2` (amber badge)
   - Place a bid in one tab — watch the other update instantly via Redis Pub/Sub.

---

## Production Cloud Deployment Guide

### 1. Database (Supabase PostgreSQL)
1. Create a PostgreSQL database on [Supabase](https://supabase.com/).
2. Set `DATABASE_URL` with `?pgbouncer=true`:
   `postgresql://postgres:[PASS]@...pooler.supabase.com:6543/postgres?pgbouncer=true`

### 2. Redis (Upstash Serverless Redis)
1. Create a Redis database on [Upstash](https://upstash.com/).
2. Copy the TLS Redis URL and set as `REDIS_URL`.

### 3. Backend Cluster (Render)
1. Connect your repository to [Render](https://render.com/).
2. Render uses `render.yaml` to provision `bidwire-backend-1` and `bidwire-backend-2`.
3. Set environment variables: `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGIN`, `CRON_SECRET`, `INSTANCE_ID`.

### 4. Serverless Cron (Upstash QStash)
1. Create a schedule targeting `https://bidwire-backend-1.onrender.com/api/cron/new-cycle`.
2. Cron expression: `0 * * * *` (every hour).
3. Header: `Upstash-Forward-x-cron-secret: <CRON_SECRET>`.

### 5. Frontend SPA (Vercel)
1. Deploy `frontend/` to [Vercel](https://vercel.com/) with Root Directory set to `frontend`.
2. Environment variables:
   - `VITE_BACKEND_URL` → `https://bidwire-backend-1.onrender.com`
   - `VITE_BACKEND_URL_2` → `https://bidwire-backend-2.onrender.com`
   - `VITE_LANDING_URL` → your deployed landing page URL

### 6. Case Study Landing Page (Vercel)
1. Deploy `landing/` to [Vercel](https://vercel.com/) as a **separate Vercel project** with Root Directory set to `landing`.
2. Framework Preset: `Vite`. Build Command: `npm run build`. Output Directory: `dist`.
3. To add your screen recording demo: place `demo.mp4` in `landing/public/demo.mp4` before deploying.

---

## Repository Directory Structure

```
bidwire/
├── backend/
│   ├── src/
│   │   ├── db/          # Prisma database client
│   │   ├── redis/       # ioredis & pub/sub client initialization
│   │   ├── routes/      # REST API endpoints (/api/listings, /api/cron)
│   │   ├── services/    # Bid transactions, auction timer, cycle rotation
│   │   ├── sockets/     # Socket.IO event handlers & presence tracking
│   │   └── index.ts     # Express server & socket adapter bootstrap
│   ├── prisma/          # Database schema (listings & bids)
│   └── Dockerfile       # Production multi-stage Alpine build
├── frontend/
│   ├── src/
│   │   ├── components/  # ListingCard, BidForm, PresenceBadge, InstanceBadge, Countdown
│   │   ├── hooks/       # useListing & useSocket hooks
│   │   ├── lib/         # Socket.IO client singleton & ?server=2 query router
│   │   └── pages/       # Home & AuctionRoom pages
│   └── vercel.json      # SPA rewrite routing config
├── landing/
│   ├── src/
│   │   ├── components/  # HeroSection, ArchitectureDiagram, DualInstanceSimulator,
│   │   │                #   VideoPreview, TechStackSection, WalkthroughSection,
│   │   │                #   LimitationsSection, RealWorldSection, MetricsSection
│   │   └── App.tsx      # Section assembly & Navbar/Footer
│   ├── public/          # Place demo.mp4 here for video preview
│   └── vercel.json      # SPA rewrite routing config
├── docker-compose.yml   # Multi-instance local simulation
├── render.yaml          # Cloud dual-backend Render blueprint
└── README.md            # This file
```

---

## Known Limitations

| Limitation | Detail |
|:---|:---|
| Redis `SET NX EX 30` lock | Does not use Redlock (unique token + Lua release). Edge case: lock TTL expiry before operation completes. |
| Redis Pub/Sub delivery | Fire-and-forget — no acknowledgement or guaranteed delivery if a subscriber is momentarily offline. |
| `?server=2` routing | Demo visualization device only, not production load balancing. |
| Render free tier | Cold-start latency on first request after inactivity (mitigated by QStash hourly ping). |

---

## License
MIT License. Created as a production-grade demonstration of real-time distributed system engineering.
