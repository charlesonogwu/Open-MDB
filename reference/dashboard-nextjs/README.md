# Open MDB dashboard — Next.js

Reference implementation of the Open MDB operator dashboard. Reads from Supabase via the anon key, displays live vend events, summarizes revenue and top sellers, and exposes a per-machine inventory editor.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Fleet overview — live vends feed, today's revenue, top 10 sellers (last 30 days), list of machines with 7-day vend counts. |
| `/machines/[id]` | Single-machine view — slot grid with low-stock highlighting, last 20 vends. |
| `/machines/[id]/inventory` | Inventory editor — bulk edit stock count, capacity, product assignment, and retail price for every slot. |

The home page subscribes to Supabase Realtime so new vends animate in without a refresh.

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

1. Push this repo to your own GitHub
2. Import the repo on vercel.com — set the **Root Directory** to `reference/dashboard-nextjs`
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as project environment variables
4. Deploy

## Inventory editor permissions

The dashboard reads as `anon`, which has SELECT-only access by default per `supabase/002_rls_policies.sql`. The inventory editor needs UPDATE on `slots`.

Two ways to enable it:

1. **No auth (single-operator default):** apply `supabase/004_dashboard_writes.sql`. This grants UPDATE on `slots` to `anon`. Anyone with the dashboard URL can edit inventory, so keep the URL out of public indexes.
2. **With Supabase Auth:** sign in users via Supabase Auth before they hit the editor. The existing `authenticated` policies in `002_rls_policies.sql` already allow full table access. Adapting the editor to require sign-in is a good first contribution.

## What's intentionally missing

The dashboard is a reference, not a SaaS:

- No authentication flow
- No multi-operator scoping
- No restock route planner
- No PWA / offline mode
- No email or push alerts
- No profit-margin calculations (you have `products.unit_cost_cents` and `vends.price_cents` — wire it up if you want)
- No charts beyond raw tables

Fork it and add what your operation needs. Total source weight is intentionally small so the diff stays readable.

## Tech stack

- Next.js 14 App Router (client components throughout — no server fetches)
- React 18
- TypeScript strict mode
- Tailwind CSS 3
- `@supabase/supabase-js` v2 for queries and Realtime
