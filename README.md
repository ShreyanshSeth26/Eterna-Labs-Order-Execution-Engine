# Order Execution Engine (Mock)

Backend that accepts **market orders**, routes them between two mock DEX venues (“raydium”, “meteora”), runs the job through a queue/worker, stores progress in Postgres, and streams live status over WebSocket.

> Scope: **mock implementation** for the assignment (no real blockchain).
> Routing, pricing, and execution are simulated.

---

## What it does

- REST endpoint to create a **market** order
- Picks best venue by **net price (price + fee)**
- Enqueues work on **BullMQ** (with retries/backoff)
- Persists to **Postgres** (`orders`, `order_events`)
- Streams order lifecycle via **WebSocket**:
  `routing → building → submitted → confirmed|failed`
- **Idempotency** using Redis (`Idempotency-Key` header)
- Simple **per-minute rate limit** using Redis

---

## Tech

- **API**: Fastify (TypeScript)
- **Queue/Worker**: BullMQ (Redis)
- **DB**: Postgres
- **WS**: @fastify/websocket
- **Validation**: zod
- **Logging**: pino

---

## Prerequisites

- Node.js 20+ (also works on Node 24 LTS)
- pnpm (`corepack enable`), or install pnpm separately
- Docker Desktop (for Postgres + Redis)
- Windows/macOS/Linux (examples below use Windows paths—adjust as needed)

---

## Quick start

1) **Infra** (Postgres + Redis)

```powershell
docker compose -f .\docker\docker-compose.yml up -d
docker compose -f .\docker\docker-compose.yml ps
docker compose -f .\docker\docker-compose.yml exec redis redis-cli ping   # expect PONG
```

2) **App**

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

You should see:

```
Server listening at http://0.0.0.0:3000
```

---

## Configuration

Copy `.env.example` to `.env` and tweak if required.

```
PORT=3000
DATABASE_URL=postgres://app:app@localhost:5432/orders
REDIS_URL=redis://127.0.0.1:6379
WS_HEARTBEAT_MS=15000
QUEUE_CONCURRENCY=10

# Optional delay ranges (for nicer demos)
ROUTING_DELAY_MS_MIN=150
ROUTING_DELAY_MS_MAX=300
BUILD_DELAY_MS_MIN=200
BUILD_DELAY_MS_MAX=500
SUBMIT_DELAY_MS_MIN=2000
SUBMIT_DELAY_MS_MAX=3000

# Controls
RATE_LIMIT_PER_MIN=100
IDEMPOTENCY_TTL_SEC=600
```

> Tip: prefer `127.0.0.1` over `localhost` for Redis on Windows to avoid `::1` IPv6 issues.

---

## API

### Health

```
GET /healthz
→ 200 { "ok": true }
```

### Create market order

```
POST /api/orders/execute
Content-Type: application/json
Idempotency-Key: <any-string>   # optional but recommended

Body:
{
  "type": "market",
  "baseMint": "So111...",
  "quoteMint": "USDC...",
  "side": "buy",                 # "buy" | "sell"
  "amountIn": 0.5                # number or string
}

Response:
200 { "orderId": "<uuid>" }
```

- **Idempotency**: re-sending with the same `Idempotency-Key` returns the **same** `orderId`.
- **Rate-limit**: on bursts above `RATE_LIMIT_PER_MIN`, API returns `429`.

### Live status (WebSocket)

```
GET ws://localhost:3000/api/orders/execute?orderId=<uuid>
```

Example messages:

```json
{ "orderId":"...", "status":"routing" }
{ "orderId":"...", "status":"building", "chosen_dex":"meteora", "reason":"better net price ..." }
{ "orderId":"...", "status":"submitted" }
{ "orderId":"...", "status":"confirmed" }
```

(Or `"failed"` with `"error"` in a small percentage of mock runs.)

---

## Postman

A collection is provided at `postman/collection.json`:

- **Health** – quick GET
- **Execute Order (market)** – sample order body + `Idempotency-Key` header
- **WS Status (connect)** – connects to `ws://localhost:3000/api/orders/execute?orderId={{orderId}}`

To automatically store `orderId` after calling `Execute Order (market)`, add to the **Tests** tab:

```js
const data = pm.response.json();
pm.collectionVariables.set("orderId", data.orderId);
```

---

## Database

Schema is applied by the Postgres container on startup (`db/init/01_schema.sql`).

**orders**

- `id uuid` (PK)
- `type text` (e.g., `market`)
- `base_mint text`, `quote_mint text`
- `side text` (`buy|sell`)
- `amount_in numeric`
- `status text` (`pending|routing|submitted|confirmed|failed`)
- `chosen_dex text` (nullable)
- `tx_hash text` (nullable; mock string)
- `error text` (nullable)
- `created_at timestamptz`, `updated_at timestamptz`

**order_events**

- `order_id uuid` (FK → orders.id)
- `status text`
- `detail jsonb` (nullable)
- `created_at timestamptz`

Handy commands:

```powershell
# Last 5 orders
docker compose -f .\docker\docker-compose.yml exec postgres `
  psql -U app -d orders -c "select id,type,status,chosen_dex,tx_hash,created_at from orders order by created_at desc limit 5;"

# Event timeline for an order
$oid="<paste-order-id>"
docker compose -f .\docker\docker-compose.yml exec postgres `
  psql -U app -d orders -c "select status, detail, created_at from order_events where order_id='$oid' order by created_at;"
```

---

## Tests

Basic unit tests for router logic, schema, utilities, and status bus.

```powershell
pnpm test
```

---

## Project layout

```
src/
  db/          # pg repo (CRUD)
  queue/       # BullMQ queue + worker
  routes/      # REST + WS endpoints
  services/    # router (mock pricing), status bus
  utils/       # env, ids, redis, logger
docker/
  docker-compose.yml
db/
  init/01_schema.sql
postman/
  collection.json
```

---
