# 10 — Troubleshooting

Most issues fall into one of five buckets. Diagnose in this order.

## Bucket 1 — Pi can't read MDB

**Symptoms:** No vend events in logs even after a real vend happens.

| Check | Command / How |
|-------|---------------|
| Serial device exists | `ls -la /dev/ttyAMA0` |
| User has serial access | `groups $USER` should include `dialout` |
| UART hardware enabled | Re-run `sudo raspi-config` → Interface → Serial |
| Qibixx HAT LED on | Look at the HAT — green LED means power, blink means data |
| Machine MDB bus active | Power-cycle machine. The HAT should see VMC poll frames within 2 sec |
| Wiring correct | Re-check pinout against your machine's service manual |

## Bucket 2 — Pi can read but can't reach the ingestor

**Symptoms:** Listener log shows `ingestor unreachable` or `ingestor rejected vend`.

| Check | Command |
|-------|---------|
| Pi has internet | `ping 1.1.1.1` |
| DNS works | `nslookup open-mdb-ingestor.<your-account>.workers.dev` |
| `INGEST_URL` correct | Check `.env` matches the URL Wrangler printed at deploy time |
| `INGEST_SECRET` matches | Re-set on both Pi and Worker; mismatched values yield 401 responses |
| HTTPS reachable | `curl https://<your-worker>.workers.dev/health` should return `{"ok":true}` |
| Worker rejects POST | Tail Cloudflare Worker logs: `wrangler tail` |

## Bucket 3 — Events POST but DB doesn't update

**Symptoms:** Listener logs show vends POSTed successfully (HTTP 202), but the Supabase `vends` table doesn't grow.

| Check | Where |
|-------|-------|
| Worker is deployed and running | Cloudflare dashboard → Workers → your worker |
| Worker logs show received messages | `wrangler tail` or Cloudflare dashboard → Logs |
| `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set as Worker secrets | `wrangler secret list` |
| `machine_id` in event matches a row in `machines` | INSERT or fix spelling if not |
| RLS not blocking writes | Service role bypasses RLS automatically; only relevant if you accidentally used the anon key |

## Bucket 4 — DB has data but dashboard doesn't show it

**Symptoms:** `SELECT * FROM vends LIMIT 5` returns rows, but dashboard is empty.

| Check | Where |
|-------|-------|
| Dashboard `.env` has correct Supabase URL + anon key | `reference/dashboard-nextjs/.env.local` |
| Anon read policies in place | Re-run `supabase/002_rls_policies.sql` |
| Dashboard build was successful | Vercel dashboard → Deployments → latest |
| Browser cache | Hard refresh (Cmd-Shift-R / Ctrl-F5) |
| Realtime channels subscribed | Open dashboard → DevTools → Network → look for `realtime` WebSocket |

## Bucket 5 — Vends are parsed but with wrong selection or price

**Symptoms:** Events arrive, but `selection` doesn't match the button pressed, OR `price_cents` looks wrong.

This is almost always a frame parser mismatch. The Qibixx HAT firmware version and your machine's MDB level (1, 2, or 3) determine which bytes are which.

1. Enable debug logging: `python main.py --log-level DEBUG`
2. Look at the raw hex of a vend frame
3. Compare to [`docs/mdb-protocol-reference.md`](mdb-protocol-reference.md)
4. Adjust `parse_mdb_vend()` in `main.py` accordingly
5. Open an issue in the Open MDB repo with the raw hex and your machine model — we'll add a parser variant

## Bucket 6 — Supabase project got auto-paused

**Symptoms:** Dashboard suddenly shows no data; Worker returns 5xx with "project paused" in the response body.

Supabase pauses free-tier projects after 7 days with no activity.

**Fix:** Open the Supabase dashboard, click "Restore project". Data is preserved.

**Prevent:** The Worker's scheduled handler runs a daily keep-alive query against Supabase. If yours still pauses, confirm the cron is enabled in `wrangler.toml` and that `wrangler deploy` registered it.

## When to File a GitHub Issue

After you've checked all the above and it's still not working, file an issue including:

- Pi model
- Machine make + model
- Qibixx HAT firmware version
- Listener log output (last 50 lines)
- Worker tail output (last 50 lines) from `wrangler tail`
- A raw MDB frame from `--log-level DEBUG`

Without those, we can only guess.
