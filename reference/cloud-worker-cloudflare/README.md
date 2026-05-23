# Open MDB ingestor — Cloudflare Worker

Reference implementation of the Open MDB cloud ingestor. Accepts vend events over HTTPS from one or more Raspberry Pi listeners and writes them to a Supabase Postgres database.

## What it does

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Liveness check. Returns `{"ok":true}`. No auth required. |
| `/vends` | POST | Accept a single vend event. Validates, snapshots product info from `slots`, inserts a row into `vends`. |
| `/vends/batch` | POST | Accept up to 500 events in a single array. All-or-nothing — any malformed event rejects the whole batch. |
| `scheduled` | cron | Daily `SELECT 1` against Supabase to prevent free-tier auto-pause. |

POST routes require an `Authorization: Bearer <INGEST_SECRET>` header. Anything else returns 401.

## Event shape

```json
{
  "machine_id":   "MACHINE-001",
  "selection":    "24",
  "ts":           1716381342.1,
  "price_cents":  150,
  "payment_type": "card",
  "raw_frame":    "131800960a"
}
```

- `machine_id` — non-empty string matching a row in the `machines` table
- `selection` — non-empty string (MDB selection number)
- `ts` — unix epoch seconds (number, fractional allowed)
- `price_cents` — non-negative integer
- `payment_type` — one of `cash`, `card`, `unknown`
- `raw_frame` — optional hex string of the original MDB frame (for debugging)

Unknown extra fields are accepted and ignored, so the payload can evolve without breaking older Workers.

## Required environment

Set as Cloudflare Worker secrets (production) or in `.dev.vars` (local):

| Name | Description |
|------|-------------|
| `SUPABASE_URL` | e.g. `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret (bypasses RLS) |
| `INGEST_SECRET` | Shared bearer token between Worker and Pi listeners. Generate with `openssl rand -hex 32`. |

## Local development

```bash
npm install
cp .env.example .dev.vars
# Fill in real values in .dev.vars (it is gitignored)
npm run dev
```

`wrangler dev` starts the Worker on `http://localhost:8787`. Test with:

```bash
curl -X POST http://localhost:8787/vends \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"machine_id":"MACHINE-001","selection":"24","ts":1716381342.1,"price_cents":150,"payment_type":"card"}'
```

## Tests

```bash
npm test           # one-shot
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
```

Tests cover the payload validator, auth gate, batch semantics, and the Supabase REST client shape using Vitest's built-in `vi.fn()` mocks. No external services are contacted.

## Deploying

```bash
wrangler login
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put INGEST_SECRET
npm run deploy
```

Wrangler prints the deployed URL — something like `https://openvend-ingestor.<your-account>.workers.dev`. Use that URL plus `/vends` as the `INGEST_URL` for each Pi listener.

## Free-tier capacity

| Vends per month | Worker requests | Cost |
|-----------------|-----------------|------|
| 10,000 | ~10K | $0 |
| 100,000 | ~100K | $0 |
| 1,000,000 | ~1M | ~$0.50 |

Each vend triggers two Supabase REST calls (slot lookup + insert) so DB capacity is the realistic bottleneck before Worker pricing matters.

## Known limitations

- **No idempotency.** If the Pi retries a POST after a network blip, you can get duplicate `vends` rows. Add a unique constraint on `(machine_id, ts, selection)` if your fleet does so much volume that this is a real concern.
- **No request-level retry.** A 5xx from Supabase is bubbled back to the Pi; the Pi has to retry. The Pi listener does not currently buffer locally — extending it with an SQLite WAL is a good first contribution.
- **No rate limiting beyond Cloudflare's defaults.** Treat `INGEST_SECRET` like a password.

## Replacing this Worker

The contract is just HTTPS + JSON + a bearer token, so any platform that can host an HTTPS endpoint works:

- AWS Lambda + API Gateway
- Google Cloud Run
- Fly.io
- A plain VPS running Caddy and a small Go/Python service

Reference implementations for those are welcome PRs.
