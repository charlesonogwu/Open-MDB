# 07 — Cloud Ingestion

The cloud ingestor is the bridge between the Pi (which POSTs vend events over HTTPS) and Supabase (where they're stored).

This doc walks through the **Cloudflare Worker** reference implementation. An AWS Lambda alternative can be added under `reference/cloud-worker-aws-lambda/` for operators who prefer AWS — the contract is just HTTPS + JSON + a bearer token.

## Why Cloudflare Workers

- Free tier: 100K requests/day — way more than any small operator needs
- Always-on, no VPS to manage
- Edge-deployed for low latency
- Built-in TLS termination
- Built-in cron triggers for the daily Supabase keep-alive

## Prerequisites

- A Cloudflare account (free)
- `wrangler` CLI installed: `npm install -g wrangler`
- Node.js 18+ (for `npm install` and tests)

## Deploy

```bash
cd reference/cloud-worker-cloudflare
npm install

# Log in
wrangler login

# Set secrets (these are NOT committed to the repo)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put INGEST_SECRET   # generate with: openssl rand -hex 32

# Deploy
npm run deploy
```

Wrangler prints the deployed URL, for example:

```
https://openvend-ingestor.<your-account>.workers.dev
```

Use that URL plus `/vends` as the `INGEST_URL` for each Pi listener. Use the same `INGEST_SECRET` value on every Pi.

## What It Does

For each POST to `/vends`:

1. Verify the `Authorization: Bearer <INGEST_SECRET>` header — anything else gets 401
2. Validate the JSON payload (`machine_id`, `selection`, `ts`, `price_cents`, `payment_type`)
3. Look up the slot to snapshot the current `product_sku` and product name
4. Insert the row into `vends`
5. A trigger on the `vends` table auto-decrements `slots.current_stock`

The whole round-trip from Pi POST → DB write → dashboard update is typically < 1 second.

## Endpoints

| Route | Method | Notes |
|-------|--------|-------|
| `/health` | GET | Liveness check, no auth required. Returns `{"ok":true}`. |
| `/vends` | POST | One event per request. Bearer auth required. |
| `/vends/batch` | POST | Up to 500 events per array. All-or-nothing on validation. |
| `scheduled()` | cron | Daily `SELECT 1` against Supabase to prevent free-tier auto-pause. |

## Verifying

After deploying, run the Pi listener in `--simulate` mode (see [`docs/05-running-the-listener.md`](05-running-the-listener.md)). Within 30 seconds you should see fake vends appearing in the `vends` table in Supabase.

You can also test manually with `curl`:

```bash
curl -X POST https://openvend-ingestor.<your-account>.workers.dev/vends \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"machine_id":"MACHINE-001","selection":"24","ts":1716381342.1,"price_cents":150,"payment_type":"card"}'
```

A successful insert returns `{"ok":true}` with status 202.

## Cost at Scale

| Vends/month | Worker requests | Free tier? |
|-------------|-----------------|------------|
| 10,000 (small operator) | ~10K | ✅ |
| 100,000 (medium) | ~100K | ✅ |
| 1,000,000 (large) | ~1M | ~$0.50/month |

Each vend triggers two Supabase REST calls (slot lookup + insert) so Supabase capacity is the realistic bottleneck before Worker pricing matters.

## Next Step

[`docs/08-dashboard-quickstart.md`](08-dashboard-quickstart.md) — deploy the dashboard to see the data.
