# 08 — Dashboard Quickstart

The dashboard is a Next.js web app that reads from Supabase and visualizes your fleet.

## Run Locally (recommended first)

```bash
cd reference/dashboard-nextjs
cp .env.example .env.local
# Edit .env.local — add your Supabase URL and anon key
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel (One Click)

> ⚠️ **Unverified.** This button's parameters haven't been tested end-to-end
> against a real Vercel account yet. If you try it, please report success or
> failure in a GitHub issue. You can always deploy manually: push the repo to
> your GitHub, import it in Vercel, set the root directory to
> `reference/dashboard-nextjs`, and add the two `NEXT_PUBLIC_SUPABASE_*` env
> vars.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharlesonogwu%2FOpen-MDB&root-directory=reference%2Fdashboard-nextjs&project-name=open-mdb-dashboard&repository-name=open-mdb-dashboard&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Your%20Supabase%20project%20URL%20and%20anon%20key%20%28Project%20Settings%20%E2%86%92%20API%29&envLink=https%3A%2F%2Fgithub.com%2Fcharlesonogwu%2FOpen-MDB%2Fblob%2Fmain%2Fdocs%2F08-dashboard-quickstart.md)

Clicking the button will:
1. Copy the dashboard into your own GitHub account
2. Prompt for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
   both are on your Supabase project's **Settings → API** page
3. Build and deploy
4. Give you a live URL like `your-fleet.vercel.app`

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
