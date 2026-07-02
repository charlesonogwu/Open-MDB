# Mobile Demo

`demo.html` is a self-contained, dependency-free demo of a mobile-first
Open MDB dashboard view. It's used to record
[`docs/media/mobile-dashboard-demo.mp4`](../../docs/media/README.md).

Open it directly in a browser — no server, build step, or network needed:

```bash
open examples/mobile-demo/demo.html
```

It embeds the project's fictional **Acme Vending Co.** demo dataset (the same
operator as [`supabase/003_seed_demo_data.sql`](../../supabase/003_seed_demo_data.sql)):
three machines, a small catalog, and synthetic sales. No real data. Vend
timestamps are shifted at render time so the feed reads as recent.

Four views, mirroring a production mobile app's bottom navigation:

- **Inventory** — per-machine rows of slot cards with stock levels and
  low/out-of-stock highlighting
- **Vends** — recent sales feed with today / 7-day / 30-day revenue
- **Storage** — back-of-house stock counts
- **Products** — the product catalog

The machine tabs (Office / Warehouse / Gym) correspond to MACHINE-001,
MACHINE-002, and MACHINE-003.

> This is a static illustration of the UI, not the real dashboard. The
> working dashboard lives in [`reference/dashboard-nextjs/`](../../reference/dashboard-nextjs/).
