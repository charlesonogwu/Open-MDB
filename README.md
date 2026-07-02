# Open MDB

**Track any traditional MDB vending machine with a Raspberry Pi.**

Open MDB is an open-source telemetry stack for MDB-compliant traditional vending machines — AMS, Crane, Dixie-Narco, Vendo, Royal, National, and others. Built around the Raspberry Pi and the Qibixx MDB Pi HAT. No vendor cloud, no monthly fees, no protocol lock-in.

> **New to this kind of project?** If "MDB", "flash an SD card", or "terminal"
> aren't words you use every day, start with
> [**docs/00-start-here.md**](docs/00-start-here.md) — a plain-English guide
> with a glossary and FAQ. No coding is required anywhere in this project.

**See it in action:** [dashboard walkthrough videos](docs/media/README.md) — a real fleet's live vends, inventory, and revenue.

---

## What You Get

- **Real-time vend events** — see sales the moment they happen
- **Inventory tracking** — current stock per slot, restock alerts
- **Sales dashboard** — daily/weekly/monthly revenue, top sellers, dead stock
- **Mobile-friendly** — restock from your phone, no laptop needed
- **You own your data** — Postgres database you control, no vendor extraction

## What It Costs

| | Cost |
|---|---|
| Hardware (per machine, one-time) | ~$290 |
| Cloud services (Supabase + Cloudflare + Vercel) | $0/month on free tiers |
| Vendor licensing fees | $0 |

Compare to commercial alternatives charging $20-40/month per machine.

---

## Bill of Materials (Per Machine)

| Part | Approx Cost | Notes |
|------|-------------|-------|
| Raspberry Pi 5 (4GB) | $60 | Any model from Pi 3B+ onward works |
| Qibixx MDB Pi HAT | $189 | The hardware that speaks MDB — [qibixx.com](https://qibixx.com) |
| 16GB+ microSD card | $8 | For Pi OS |
| MDB pigtail / harness | $25 | To connect HAT to machine's MDB bus |
| USB-C 5V power supply | $10 | Official Pi PSU recommended |
| Small enclosure (optional) | $15 | Inside the machine |
| **Total per machine** | **~$307** | |

Full details: [`docs/01-bill-of-materials.md`](docs/01-bill-of-materials.md)

---

## Architecture

```
 ┌─────────────────┐    MDB     ┌──────────────┐   HTTPS    ┌─────────────────┐    SQL    ┌──────────┐
 │ Vending Machine │ ─────────► │ Raspberry Pi │ ─────────► │ Cloud Ingestor  │ ────────► │ Postgres │
 │  (MDB-capable)  │  (serial)  │ + Qibixx HAT │  (POST)    │ (Cloudflare WK) │           │(Supabase)│
 └─────────────────┘            └──────────────┘            └─────────────────┘           └────┬─────┘
                                                                                               │
                                                                                          REST │
                                                                                               ▼
                                                                                       ┌──────────────┐
                                                                                       │  Dashboard   │
                                                                                       │  (Next.js)   │
                                                                                       └──────────────┘
```

Full architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Quick Start (30 minutes)

> Not sure yet? [Test-drive the whole system free](docs/00b-test-drive.md) —
> a simulator on your laptop plays the part of the machine, no hardware needed.

1. **Order hardware** — see BOM above
2. **Deploy the database** — paste `supabase/001_initial_schema.sql` into a free Supabase project ([`docs/06-supabase-schema.md`](docs/06-supabase-schema.md))
3. **Deploy the cloud ingestor** — `wrangler deploy` to Cloudflare, or the one-click button (see doc) ([`docs/07-cloud-ingestion.md`](docs/07-cloud-ingestion.md))
4. **Deploy the dashboard** — run locally or one-click to Vercel (see doc) ([`docs/08-dashboard-quickstart.md`](docs/08-dashboard-quickstart.md))
5. **Set up the Pi** — flash the SD card, install the listener; there's an install script and a no-terminal option ([`docs/04-raspberry-pi-setup.md`](docs/04-raspberry-pi-setup.md))
6. **Wire it to the machine** — MDB harness connection ([`docs/03-wiring-the-machine.md`](docs/03-wiring-the-machine.md))
7. **Make a vend** — see it show up on the dashboard live

---

## Documentation

### Getting Started
- [00 — Start Here (plain-English guide)](docs/00-start-here.md)
- [00b — Test-Drive It Free (no hardware needed)](docs/00b-test-drive.md)

### Hardware
- [01 — Bill of Materials](docs/01-bill-of-materials.md)
- [02 — Understanding MDB Protocol](docs/02-understanding-mdb.md)
- [03 — Wiring the Machine](docs/03-wiring-the-machine.md)
- [03a — Wiring Day Checklist (printable)](docs/03a-wiring-checklist.md)
- [04 — Raspberry Pi Setup](docs/04-raspberry-pi-setup.md)
- [04a — Pi Setup Without a Terminal (beta)](docs/04a-setup-without-terminal.md)

### Software
- [05 — Running the Listener](docs/05-running-the-listener.md)
- [06 — Supabase Schema](docs/06-supabase-schema.md)
- [07 — Cloud Ingestion](docs/07-cloud-ingestion.md)
- [08 — Dashboard Quickstart](docs/08-dashboard-quickstart.md)
- [09 — Adding More Machines](docs/09-adding-more-machines.md)
- [10 — Troubleshooting](docs/10-troubleshooting.md)

### Reference
- [MDB Protocol Reference](docs/mdb-protocol-reference.md)
- [Supported Machines](docs/supported-machines.md)

---

## Supported Machines

Tested or community-verified compatibility with:

| Machine Family | Status |
|----------------|--------|
| AMS 39 Combo (Sensit 3) | Reference platform |
| Crane Merchant series | Community-tested |
| Dixie-Narco 5000 | Needs verification — PRs welcome |
| Vendo 721 | Needs verification |
| Royal Vendors 660 | Needs verification |
| National 167 | Needs verification |

Add your machine to [`docs/supported-machines.md`](docs/supported-machines.md) via PR after you confirm it works.

---

## License

MIT — see [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). New machine compatibility reports, troubleshooting tips, and alternative implementations (Rust, AWS Lambda, Svelte, etc.) all welcome.
