# Demo Videos

Both videos use the project's fictional **Acme Vending Co.** demo dataset
(see [`supabase/003_seed_demo_data.sql`](../../supabase/003_seed_demo_data.sql)) —
three demo machines, a small catalog, and synthetic sales. No real operator
data. Recorded with Playwright driving Chromium.

## mobile-dashboard-demo.mp4

A phone-sized walkthrough of a mobile dashboard view: per-machine inventory
rows with low-stock highlighting, switching between machines (Office /
Warehouse / Gym), the live vends feed with today / 7-day / 30-day revenue,
storage back-stock, and the product catalog.

The UI shown is the self-contained demo in
[`examples/mobile-demo/`](../../examples/mobile-demo/) — open it in any
browser, no server needed.

## open-mdb-dashboard-walkthrough.mp4

A walkthrough of the reference dashboard in
[`reference/dashboard-nextjs/`](../../reference/dashboard-nextjs/): fleet
overview (revenue today, live vends, top sellers), a machine's slot grid with
restock alerts, and the inventory editor saving a stock change.
