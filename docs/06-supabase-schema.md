# 06 — Supabase Schema

## Create a Free Supabase Project

1. Go to https://supabase.com — sign up if needed
2. Create a new project (any region close to your machines)
3. Wait for the project to provision (~2 minutes)
4. Note down two values from **Project Settings → API**:
   - **Project URL** (e.g. `https://your-project.supabase.co`)
   - **anon public key**
   - **service_role secret key** (treat like a password — never commit)

## Apply the Schema

In the Supabase dashboard, go to **SQL Editor → New query**. Paste and run, in order:

1. [`supabase/001_initial_schema.sql`](../supabase/001_initial_schema.sql)
2. [`supabase/002_rls_policies.sql`](../supabase/002_rls_policies.sql)
3. (Optional, for demo data) [`supabase/003_seed_demo_data.sql`](../supabase/003_seed_demo_data.sql)
4. (Optional, to enable the dashboard's inventory editor without Supabase Auth) [`supabase/004_dashboard_writes.sql`](../supabase/004_dashboard_writes.sql)

You should see "Success. No rows returned." for each.

## Verify

In the dashboard, go to **Table Editor**. You should see four tables:

- `machines`
- `products`
- `slots`
- `vends`

If you ran the seed script, each table has demo rows.

## What Each Table Does

- **`machines`** — your fleet. Add one row per physical machine.
- **`products`** — your SKU catalog. Add one row per unique product you stock.
- **`slots`** — the layout of each machine. One row per coil per machine, linked to a product.
- **`vends`** — every vend event ever recorded. Append-only; never delete unless decommissioning a machine.

A trigger on `vends` auto-decrements `slots.current_stock` so your inventory stays in sync without extra code.

## Free Tier Limits

| Resource | Free Tier |
|----------|-----------|
| Database size | 500 MB |
| Egress | 2 GB/month |
| Active rows | Unlimited |
| Auto-pause after inactivity | 7 days |

A single machine generates ~50 vends/day = ~18K vends/year. 500 MB holds ~10 million vend rows easily. The free tier accommodates 100+ machines for years.

## Avoiding Auto-Pause

Supabase pauses free-tier projects after 7 days with no queries. Your cloud worker writing vends counts as activity. If you have weeks without sales, set up a daily keep-alive cron in your Cloudflare Worker that runs `SELECT 1` against Supabase.

## Next Step

[`docs/07-cloud-ingestion.md`](07-cloud-ingestion.md) — deploy the Cloudflare Worker that catches vend events and writes them here.
