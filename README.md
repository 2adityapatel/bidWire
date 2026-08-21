# ⚡ BidWire — Distributed Real-Time Auction Engine

> A high-concurrency, multi-instance live auction platform built with **Node.js, TypeScript, Socket.IO, Redis, PostgreSQL (Prisma), and React**. Designed to demonstrate zero-race-condition bid processing, cross-node event propagation, distributed timer synchronization, and robust reconnect state re-syncing.

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL (Atomic row locking via `SELECT FOR UPDATE`)
- **Real-Time & Distributed Cache:** Socket.IO, `@socket.io/redis-adapter`, Redis (`ioredis`)
- **Frontend:** React 19, TypeScript, Vite, React Router v7
- **Orchestration & Cloud:** Docker Compose (Local dual-node simulation), Render (Backend services), Supabase (Database), Upstash (Serverless Redis), Vercel (Frontend SPA)

---

## 📐 Architecture Topology

```mermaid
flowchart TD
    subgraph Clients["Client Tier (React + Socket.IO Client)"]
        UserA["User A (Browser Tab 1)"]
        UserB["User B (Browser Tab 2)"]
    end

    subgraph Cluster["Backend Cluster Tier"]
        Node1["Backend Instance 1 (Port 3001)"]
        Node2["Backend Instance 2 (Port 3002)"]
    end

    subgraph Infrastructure["Persistence & Message Bus"]
        Redis[("Redis (Pub/Sub + Presence Sets + Distributed Lock)")]
        Postgres[("PostgreSQL Database (Prisma ORM)")]
    end

    UserA <-->|WebSocket / HTTP| Node1
    UserB <-->|WebSocket / HTTP| Node2

    Node1 <-->|Pub/Sub & Sets| Redis
    Node2 <-->|Pub/Sub & Sets| Redis

    Node1 -->|SELECT FOR UPDATE Transaction| Postgres
    Node2 -->|SELECT FOR UPDATE Transaction| Postgres
```

---

## 🚀 Key Engineering Mechanics & Architecture

### 1. Race-Condition Protection (`SELECT FOR UPDATE`)
In a live auction environment, multiple users may attempt to place a bid on the same listing simultaneously across different backend nodes. Simple read-then-write logic creates critical race conditions (dirty reads and phantom bid wins).

**Solution in `bidService.ts`:**
- Every bid placement executes within an isolated database transaction (`prisma.$transaction`).
- Raw SQL query `SELECT * FROM "Listing" WHERE id = $1 FOR UPDATE` locks the specific listing row at the PostgreSQL storage engine level.
- Subsequent concurrent transaction attempts on the same listing block until the active transaction completes.
- The new bid amount is validated against `currentHighestBid` inside the transaction. If valid, the `Bid` record is inserted and `Listing.currentHighestBid` is denormalized atomically.
- **32-Bit Integer Safety:** All monetary values are processed in paise (1 INR = 100 paise) and capped at PostgreSQL's 32-bit signed `INT4` maximum (`2,147,483,647` paise / ~₹2.14 Crore) to prevent numeric overflow exceptions.

```typescript
// backend/src/services/bidService.ts
export async function placeBid({ listingId, bidderName, amount }: PlaceBidParams) {
  return prisma.$transaction(async (tx) => {
    // Lock listing row exclusively for the duration of this transaction
    const listings = await tx.$queryRaw<Listing[]>`
      SELECT * FROM "Listing" WHERE id = ${listingId} FOR UPDATE
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

**Solution in `redis.ts` & `index.ts`:**
- `@socket.io/redis-adapter` binds Socket.IO rooms to Redis Pub/Sub channels using dual `ioredis` instances (`pubClient` and `subClient`).
- When `backend_1` receives an accepted bid, `io.to("listing:ID").emit("bid_update", ...)` publishes the payload to Redis.
- Redis fans out the message to `backend_2`, which instantly emits the WebSocket event to all locally connected clients in that room.
- Global room events (`home_bid_update`) are simultaneously broadcast so home page listing cards across all server nodes reflect live price increases without manual refreshes.

---

### 3. Distributed Timer Lock (`SET NX EX`)
Countdown timers trigger listing expiration when `endsAt` is reached. In a multi-node cluster, if each node runs an independent timer check, multiple nodes could attempt to close the auction simultaneously, causing duplicate notifications and redundant DB writes.

**Solution in `auctionTimer.ts`:**
- A periodic timer runs every 2 seconds on all backend instances.
- When an expired listing (`endsAt <= now()` and `status = active`) is detected, the instance attempts to acquire an atomic Redis lock:
  `SET auction:close:lock:{listingId} {instanceId} EX 10 NX`
- Only the **single node** that successfully acquires the Redis lock executes the database status update to `closed` and emits the room-wide `listing_closed` event with winner details.

```typescript
// backend/src/services/auctionTimer.ts
const lockKey = `auction:close:lock:${listing.id}`;
const acquired = await redisClient.set(lockKey, instanceId, "EX", 10, "NX");

if (acquired === "OK") {
  // Only this node executes auction closing
  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: "closed" }
  });
  io.to(`listing:${listing.id}`).emit("listing_closed", { ... });
}
```

---

### 4. Synchronized Presence Tracking (Redis Sets)
To accurately display how many users are actively viewing an auction across all cluster nodes:

- Joining an auction executes `SADD presence:{listingId} {socketId}` in Redis with an expiring TTL.
- Leaving or disconnecting executes `SREM presence:{listingId} {socketId}`.
- Viewer count is calculated in $O(1)$ time across all nodes using `SCARD presence:{listingId}` and broadcast to room viewers via `presence_update`.

---

### 5. Client Reconnect & State Re-sync
When a client experiences temporary network interruption or switches networks:
- Upon socket reconnection (`socket.on("connect")`), the client automatically re-emits `join_listing`.
- The server responds with `listing_state`, fetching the latest bid history and auction state directly from PostgreSQL rather than memory.
- If the auction closed while the client was offline, the client immediately updates UI state to render the winner banner with final price details.

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

3. **Run Seed Data Script (In another terminal):**
   ```bash
   cd backend
   npm run db:seed
   ```

4. **Start Frontend Development Server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Verify Cross-Instance Synchronization:**
   - Open Browser Window 1: `http://localhost:5173` (Connected to Backend 1 on 3001)
   - Open Browser Window 2 (Incognito / separate session): `http://localhost:5173`
   - Enter an auction room in both windows and place a bid. Observe instant price and presence updates across both sessions regardless of backend node distribution!

---

## ☁️ Production Cloud Deployment Guide

### 1. Database (Supabase PostgreSQL)
1. Create a project on [Supabase](https://supabase.com/).
2. Copy the Connection String (Transaction Pooler or Direct URI) under **Project Settings -> Database**.
3. Set `DATABASE_URL` in backend environment variables.

### 2. Redis (Upstash Serverless Redis)
1. Create a Redis database on [Upstash](https://upstash.com/).
2. Copy the TLS Redis URL (`rediss://default:...@...upstash.io:6379`).
3. Set `REDIS_URL` in backend environment variables.

### 3. Backend Cluster Deployment (Render)
1. Connect your repository to [Render](https://render.com/).
2. Render uses `render.yaml` to provision two web services: `bidwire-backend-1` and `bidwire-backend-2`.
3. Configure the environment variables (`DATABASE_URL`, `REDIS_URL`, `CORS_ORIGIN`) in the Render dashboard.

### 4. Frontend SPA Deployment (Vercel / Netlify)
1. Deploy `frontend/` to [Vercel](https://vercel.com/) or Netlify.
2. Set build command: `npm run build` and output directory: `dist`.
3. Set `VITE_BACKEND_URL` environment variable pointing to your deployed backend URL.

---

## 📁 Repository Directory Structure

```
bidwire/
├── backend/
│   ├── src/
│   │   ├── db/          # Prisma database client
│   │   ├── redis/       # ioredis & pub/sub client initialization
│   │   ├── routes/      # REST API endpoints (/api/listings)
│   │   ├── services/    # Bid transaction logic & distributed timer
│   │   ├── sockets/     # Socket.IO event handlers & presence tracking
│   │   └── index.ts     # Express server & socket adapter bootstrap
│   ├── prisma/          # Database schema & seed script
│   └── Dockerfile       # Production multi-stage Alpine build
├── frontend/
│   ├── src/
│   │   ├── components/  # ListingCard, BidForm, PresenceBadge, Countdown
│   │   ├── hooks/       # useListing & useSocket hooks
│   │   ├── lib/         # Socket.IO client singleton setup
│   │   └── pages/       # Home & AuctionRoom pages
│   └── vercel.json      # SPA routing config
├── docker-compose.yml   # Multi-instance local simulation
├── render.yaml          # Cloud dual-backend Render blueprint
└── README.md            # Technical engineering documentation
```

---

## 📄 License
MIT License. Created as a production-grade demonstration of real-time distributed system engineering.
