# 08 — Dashboard Quickstart

The dashboard is a Next.js web app that reads from Supabase and visualizes your fleet.

## Deploy to Vercel (One Click)

In the repo root, click the "Deploy to Vercel" button in the README (coming soon). It will:
1. Fork the dashboard
2. Prompt for `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Build and deploy
4. Give you a live URL like `your-fleet.vercel.app`

## Or Run Locally

```bash
cd reference/dashboard-nextjs
cp .env.example .env.local
# Edit .env.local — add your Supabase URL and anon key
npm install
npm run dev
```

Open http://localhost:3000.

## What You'll See

Out of the box, the dashboard has:

- **Live vends feed** — every vend as it happens
- **Fleet overview** — revenue, vend count, busiest day per machine
- **Per-machine view** — sales, inventory, restock alerts
- **Top sellers** — across the fleet or per machine
- **Dead stock alerts** — slots with low velocity that may need a product swap
- **Inventory editor** — change product assignments and counts

## Inventory editor permissions

The dashboard reads via the Supabase `anon` role, which has SELECT-only access by default. To use the inventory editor without setting up Supabase Auth, apply [`supabase/004_dashboard_writes.sql`](../supabase/004_dashboard_writes.sql). This grants UPDATE on the `slots` table to `anon`. The trade-off is documented in that file.

If you do set up Supabase Auth, the existing `authenticated` policies already grant full CRUD — adapt the dashboard to sign users in before showing the editor.

## Customizing

The dashboard is intentionally minimal. Fork it and add:

- Authentication (Supabase Auth) for multi-user
- Email alerts when stock drops below threshold
- Restock route planner (Google Maps API)
- Profit margin calculations (combine `products.unit_cost_cents` with `vends.price_cents`)
- PWA installation for mobile-first restocking

## Free Tier on Vercel

| Resource | Free Tier |
|----------|-----------|
| Bandwidth | 100 GB/month |
| Build minutes | 6000/month |
| Cron jobs | Unlimited |
| Edge functions | 500K invocations/month |

A typical small-fleet dashboard uses < 1% of these.

## Next Step

[`docs/09-adding-more-machines.md`](09-adding-more-machines.md) — bring a second, third, fourth machine into the fleet.
