# ⚡ BidWire — Distributed Real-Time Auction Engine

> A high-concurrency, multi-instance live auction platform built with **Node.js, TypeScript, Socket.IO, Redis, PostgreSQL (Prisma), and React**. Designed to demonstrate zero-race-condition bid processing, cross-node event propagation, distributed timer & cycle synchronization, automated serverless cron rotation, and robust reconnect state re-syncing.

---

## 🛠 Tech Stack

- **Backend Framework & Language:** Node.js, Express, TypeScript, Prisma ORM
- **Database & Pooling:** PostgreSQL (Atomic row locking via `SELECT FOR UPDATE`, PgBouncer transaction pooling)
- **Real-Time Communication & Caching:** Socket.IO, `@socket.io/redis-adapter`, Redis (`ioredis`)
- **Frontend Framework & UI:** React 19, TypeScript, Vite, React Router v7, Vanilla CSS Design System
- **Automation & Serverless Cron:** Upstash QStash (HTTP-based cron runner & anti-sleep pinger)
- **Orchestration & Hosting:** Docker Compose (Local dual-node simulation), Render (Backend web services), Supabase (PostgreSQL), Upstash (Serverless Redis), Vercel (Frontend SPA)

---

## 📐 Architecture & Deployment Topology

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

## 🚀 Detailed System Mechanics & Implementation Guide

### 1. Race-Condition Protection (`SELECT FOR UPDATE`)
In a live auction environment, multiple users may attempt to place a bid on the same listing simultaneously across different backend nodes. Simple read-then-write logic creates critical race conditions (dirty reads and phantom bid wins).

**Implementation in `bidService.ts`:**
- Every bid placement executes within an isolated database transaction (`prisma.$transaction`).
- Raw SQL query `SELECT * FROM "Listing" WHERE id = $1 FOR UPDATE` locks the specific listing row exclusively at the PostgreSQL storage engine level.
- Concurrent transaction attempts on the same listing block until the active transaction completes.
- The new bid amount is validated against `currentHighestBid` inside the transaction. If valid, the `Bid` record is inserted and `Listing.currentHighestBid` + `currentHighestBidderName` are denormalized atomically.
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
When horizontally scaled across multiple backend nodes (`backend_1` and `backend_2`), clients connected to `backend_2` must immediately see bids placed through `backend_1`.

**Implementation in `redis.ts` & `index.ts`:**
- `@socket.io/redis-adapter` binds Socket.IO rooms to Redis Pub/Sub channels using dual `ioredis` instances (`pubClient` and `subClient`).
- When `backend_1` receives an accepted bid, `io.to("listing:ID").emit("bid_update", ...)` publishes the payload to Redis.
- Redis fans out the message to `backend_2`, which instantly emits the WebSocket event to all locally connected clients in that room.
- Global room events (`home_bid_update`) are simultaneously broadcast so home page listing cards across all server nodes reflect live price increases without manual refreshes.

---

### 3. Distributed Timer Lock (`SET NX EX`)
Countdown timers trigger listing expiration when `endsAt` is reached. In a multi-node cluster, if each node runs an independent timer check, multiple nodes could attempt to close the auction simultaneously, causing duplicate notifications and redundant DB writes.

**Implementation in `auctionTimer.ts`:**
- A periodic timer runs every 3 seconds on all backend instances.
- When an expired listing (`endsAt <= now()` and `status = active`) is detected, the instance attempts to acquire an atomic Redis lock:
  `SET auction:close_lock:{listingId} 1 EX 30 NX`
- Only the **single node** that successfully acquires the Redis lock executes the database status update to `closed` and emits the room-wide `listing_closed` event with winner details.

---

### 4. Automated Rotating Auction Cycle & QStash Anti-Sleep
To keep the application alive, dynamic, and realistic 24/7 without manual database seeding:

- **12-Item Rotating Pool (`cycleService.ts`):** 12 curated luxury & collectible items rotate through 4 slots every cycle.
- **Distributed Cycle Execution:** `POST /api/cron/new-cycle` acquires a `cycle:lock` in Redis (`SET NX EX 30`) ensuring only ONE node executes cycle rotation when QStash triggers.
- **Automatic Garbage Collection:** Closed listings older than their result window are deleted from Postgres; associated bids cascade-delete automatically via Foreign Key constraints.
- **Render Anti-Sleep:** Upstash QStash sends an HTTP `POST` ping every hour to `/api/cron/new-cycle` with an `x-cron-secret` header. This request prevents Render's free tier from hitting its 15-minute inactivity spin-down.

---

### 5. Synchronized Presence Tracking (Redis Sets)
To accurately display how many users are actively viewing an auction across all cluster nodes:

- Joining an auction executes `SADD presence:{listingId} {socketId}` in Redis with an expiring TTL.
- Leaving or disconnecting executes `SREM presence:{listingId} {socketId}`.
- Viewer count is calculated in $O(1)$ time across all nodes using `SCARD presence:{listingId}` and broadcast to room viewers via `presence_update`.

---

### 6. Client Reconnect & State Re-sync
When a client experiences temporary network interruption or switches networks:
- Upon socket reconnection (`socket.on("connect")`), the client automatically re-emits `join_listing`.
- The server responds with `listing_state`, fetching the latest bid history and auction state directly from PostgreSQL rather than memory.
- If the auction closed while the client was offline, the client immediately updates UI state to render the winner banner with final price details.

---

### 7. Multi-Instance Client Routing & Visual Node Badge
- Frontend `lib/socket.ts` supports query parameter routing: visiting `https://bidwire.vercel.app?server=2` routes the client session directly to **Backend Node 2** (`VITE_BACKEND_URL_2`).
- Upon connection, the backend emits a `welcome` event containing its `INSTANCE_ID`.
- An `<InstanceBadge>` component renders top-right displaying `⚡ backend-1 Node 1` (purple) or `⚡ backend-2 Node 2` (amber), visually proving multi-node connection handling.

---

### 8. Frontend UI Layout & Split Sections
- **Active Auctions:** Displays ONLY live, ongoing auctions (`status === "active"`) with live countdown timers and current highest bids.
- **🏆 Recent Winners & Results:** Dedicated section displaying ended auctions (`status === "closed"`) with winner banners, final prices, and winner names during their result window.

---

## ⚡ Local Development & Multi-Instance Simulation

You can simulate a production multi-node cluster locally using Docker Compose.

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)

### Step-by-Step Setup

1. **Clone & Environment Setup:**
   ```bash
   git clone https://github.com/your-username/bidwire.git
   cd bidwire
   ```

2. **Start Multi-Instance Cluster via Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   This provisions:
   - `bidwire_postgres`: PostgreSQL DB on port `5433`
   - `bidwire_redis`: Redis server on port `6379`
   - `bidwire_backend_1`: Express instance 1 on port `3001`
   - `bidwire_backend_2`: Express instance 2 on port `3002`

3. **Start Frontend Development Server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Verify Cross-Instance Synchronization:**
   - Open Window 1: `http://localhost:5173` (Connected to Node 1 on port 3001 — purple badge)
   - Open Window 2: `http://localhost:5173?server=2` (Connected to Node 2 on port 3002 — amber badge)
   - Place a bid in Window 1 and watch Window 2 update instantly via Redis Pub/Sub!

---

## ☁️ Production Cloud Deployment Guide

### 1. Database (Supabase PostgreSQL)
1. Create a PostgreSQL database on [Supabase](https://supabase.com/).
2. Use the SQL Editor to create `listings` and `bids` tables and the `ListingStatus` Enum.
3. For application runtime, set `DATABASE_URL` in backend environment variables with `?pgbouncer=true`:
   `postgresql://postgres:[PASS]@...pooler.supabase.com:6543/postgres?pgbouncer=true`

### 2. Redis (Upstash Serverless Redis)
1. Create a Redis database on [Upstash](https://upstash.com/).
2. Copy the TLS Redis URL (`rediss://default:[PASS]@[ENDPOINT].upstash.io:6379`).
3. Set `REDIS_URL` in backend environment variables.

### 3. Backend Cluster Deployment (Render)
1. Connect your repository to [Render](https://render.com/).
2. Render uses `render.yaml` to provision two web services: `bidwire-backend-1` and `bidwire-backend-2`.
3. Configure environment variables (`DATABASE_URL`, `REDIS_URL`, `CORS_ORIGIN`, `CRON_SECRET`, `INSTANCE_ID`).

### 4. Serverless Cron (Upstash QStash)
1. Create a schedule in Upstash QStash targeting `https://bidwire-backend-1.onrender.com/api/cron/new-cycle`.
2. Set Cron expression: `0 * * * *` (every hour).
3. Set Header: `Upstash-Forward-x-cron-secret: <CRON_SECRET>`.

### 5. Frontend SPA Deployment (Vercel)
1. Deploy `frontend/` to [Vercel](https://vercel.com/) with Root Directory set to `frontend`.
2. Configure `VITE_BACKEND_URL` and `VITE_BACKEND_URL_2` environment variables.

---

## 📁 Repository Directory Structure

```
bidwire/
├── backend/
│   ├── src/
│   │   ├── db/          # Prisma database client
│   │   ├── redis/       # ioredis & pub/sub client initialization
│   │   ├── routes/      # REST API endpoints (/api/listings, /api/cron)
│   │   ├── services/    # Bid transactions, auction timer, cycle rotation, auto-seed
│   │   ├── sockets/     # Socket.IO event handlers & presence tracking
│   │   └── index.ts     # Express server & socket adapter bootstrap
│   ├── prisma/          # Database schema (listings & bids mapping)
│   └── Dockerfile       # Production multi-stage Alpine build
├── frontend/
│   ├── src/
│   │   ├── components/  # ListingCard, BidForm, PresenceBadge, InstanceBadge, Countdown
│   │   ├── hooks/       # useListing & useSocket hooks
│   │   ├── lib/         # Socket.IO client singleton & ?server=2 query router
│   │   └── pages/       # Home & AuctionRoom pages
│   └── vercel.json      # SPA rewrite routing config
├── docker-compose.yml   # Multi-instance local simulation
├── render.yaml          # Cloud dual-backend Render blueprint
└── README.md            # Technical engineering documentation
```

---

## 📄 License
MIT License. Created as a production-grade demonstration of real-time distributed system engineering.
