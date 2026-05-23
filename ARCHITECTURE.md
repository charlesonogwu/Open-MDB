# Architecture

Open MDB is a four-layer system. Each layer is replaceable.

## Layer 1 — Hardware (per machine)

| Component | Role |
|-----------|------|
| **Vending Machine VMC** | Acts as MDB bus master. Originates VEND events when a customer makes a purchase. |
| **Qibixx MDB Pi HAT** | Hardware adapter that plugs into the Raspberry Pi's GPIO header and exposes the MDB bus as a UART serial device. Handles the timing-sensitive 9-bit framing. |
| **Raspberry Pi** | Runs the listener service. Reads MDB frames over UART, parses vend events, and publishes them to the cloud. |

The Pi acts as a **cashless peripheral** on the MDB bus (MDB device level 0x10). This is a legitimate, non-invasive way to observe vend conversations because the VMC explicitly addresses peripherals — we're not snooping or breaking the spec.

## Layer 2 — Edge Transport

| Component | Role |
|-----------|------|
| **HTTPS POST** | The Pi sends each vend event as an HTTPS POST to the cloud ingestor. Bearer-token authentication via a shared `INGEST_SECRET`. |

We use plain HTTPS instead of an intermediate broker because:

- Cloudflare Workers are request-driven, not long-lived subscribers — HTTPS is their native idiom.
- One less moving part, one less service to host, one less credential to rotate.
- TLS termination, retries, and rate limiting are already handled by the Worker runtime.

The trade-off is that a vend dropped during a network outage is lost unless the Pi listener buffers locally. The reference listener does not currently include a local buffer; an SQLite WAL is a recommended enhancement for fleets with unreliable connectivity.

## Layer 3 — Ingestion + Storage

| Component | Role |
|-----------|------|
| **Cloud Worker (Cloudflare Worker / AWS Lambda)** | Receives HTTPS POSTs, validates them, writes to Postgres. Decrements inventory counts via DB trigger. |
| **Postgres database (Supabase)** | Source of truth for machines, products, slots, and vends. RLS-protected. |

The schema is intentionally minimal — see [`supabase/001_initial_schema.sql`](supabase/001_initial_schema.sql).

## Layer 4 — Presentation

| Component | Role |
|-----------|------|
| **Next.js dashboard (Vercel)** | Web UI for sales analytics, inventory editing, restock alerts. Reads from Supabase via REST. |

## Data Flow (Vend Event)

```
1. Customer pays for selection 24 on MACHINE-001
2. VMC sends VEND APPROVED frame on MDB bus
3. Qibixx HAT receives the frame, forwards over UART to the Pi
4. Pi listener parses { machine_id, selection, price_cents, payment_type, ts }
5. Pi POSTs the event to https://openvend-ingestor.<acct>.workers.dev/vends
6. Worker validates the bearer token and payload
7. Worker looks up the slot to snapshot the current product, then inserts into `vends`
8. A trigger on `vends` decrements `slots.current_stock`
9. Dashboard (already open in operator's browser) updates via Supabase realtime channel
```

End-to-end latency: typically < 2 seconds from physical vend to dashboard update.

## Why Cloudflare Workers Instead of a Server

- **Always-on** without paying for a VPS
- **Free tier** covers ~100K vend events/day per machine fleet
- **Edge-deployed** so latency is low globally
- **Stateless** so adding more machines doesn't require scaling work

An equivalent AWS Lambda implementation can be added under `reference/cloud-worker-aws-lambda/` for operators who prefer AWS.

## Why Supabase Instead of Self-Hosted Postgres

- **Free tier** covers up to ~50K vends/month
- **Auto-managed backups, RLS, REST API**
- **Postgres under the hood** — fully portable; export and migrate any time

If you outgrow the free tier (~1000 vends/day), upgrade is $25/month, or self-host Postgres on a $5 VPS.

## Failure Modes and Handling

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Pi loses internet | `requests` raises an exception; listener logs `ingestor unreachable` | Vend is dropped. Operators with critical fleets should extend the listener with an SQLite WAL that retries on reconnect. |
| Pi loses power | No new events published | Restart restores the listener; in-flight vends are lost (consider a UPS HAT). |
| Worker returns 5xx | Listener logs the rejection status and body | Retry logic is the listener's responsibility. The reference impl does not retry. |
| Supabase paused (free tier) | Dashboard shows stale data; Worker logs 503s | Scheduled daily keep-alive cron in the Worker prevents this; if it still happens, click "Restore" in Supabase. |
| MDB frame parse failure | Logged with raw hex at DEBUG level | Manual investigation; rare on stable VMCs. Submit raw hex via GitHub issue to add a parser variant. |
| Bearer token mismatch | Worker returns 401; listener logs the rejection | Rotate `INGEST_SECRET` on both sides if you suspect it leaked. |

See [`docs/10-troubleshooting.md`](docs/10-troubleshooting.md) for diagnosis steps.
