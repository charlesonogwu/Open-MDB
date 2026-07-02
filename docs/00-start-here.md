# 00 — Start Here (No Engineering Degree Required)

This page is for you if you own or operate vending machines, you've heard you
can track sales and inventory from your phone without paying $20–40/month per
machine, and words like "MDB", "serial port", or "flash an SD card" are not
part of your daily vocabulary. That's fine. Every step in this project can be
done by following instructions carefully — none of it requires writing code.

## What You're Building, In Plain English

Think of it as a **fitness tracker for your vending machine**. A small
computer (a Raspberry Pi, about the size of a deck of cards) sits inside the
machine and listens to the machine's internal chatter. Every time someone buys
something, the Pi hears it and reports it to a free online database. A website
— your dashboard — reads that database and shows you, live, from anywhere:

- What just sold, on which machine, for how much
- How much money each machine made today / this week / this month
- What's running low, so you only drive out when a restock is actually needed
- What never sells, so you stop stocking it

The listening is **read-only**. The Pi is added *alongside* your existing
coin mech and card reader; it doesn't process payments and doesn't change how
the machine vends. If the Pi dies, the machine keeps vending like nothing
happened.

## What You Need to Be Able to Do

Honest checklist — you should be comfortable with all of these:

- [ ] Order parts online (~$300 per machine, one-time)
- [ ] Use a screwdriver and follow a wiring diagram with the machine **unplugged**
- [ ] Copy and paste commands into a terminal window exactly as written
- [ ] Create free accounts on three websites (Supabase, Cloudflare, Vercel)
- [ ] Ask for help when stuck (open a GitHub issue — that's what they're for)

You do **not** need to know how to program, what Linux is, or how databases
work. Where a step involves the terminal, the docs give you the exact commands
to paste.

## Time and Cost

| | |
|---|---|
| Hardware per machine | ~$307 one-time ([full parts list](01-bill-of-materials.md)) |
| Monthly cloud cost | $0 on free tiers |
| Cloud setup (steps 1–3 below) | one evening, from your couch |
| Pi setup + wiring (steps 4–5) | 1–2 hours at the machine |

## The Path

Do the cloud parts first, from home, before touching the machine. Each step
has a doc that walks you through it.

| Step | What you'll do | Where | Effort |
|------|----------------|-------|--------|
| 1. Order hardware | Buy the parts list | [01 — Bill of Materials](01-bill-of-materials.md) | Easy |
| 2. Create the database | Free Supabase account, paste in one file | [06 — Supabase Schema](06-supabase-schema.md) | Easy |
| 3. Deploy the ingestor | Free Cloudflare account, paste a few commands | [07 — Cloud Ingestion](07-cloud-ingestion.md) | Medium |
| 4. Deploy the dashboard | One click, then paste two settings | [08 — Dashboard Quickstart](08-dashboard-quickstart.md) | Easy |
| 5. Set up the Pi | Flash a memory card, run the install script — or use the [no-terminal path](04a-setup-without-terminal.md) | [04 — Raspberry Pi Setup](04-raspberry-pi-setup.md) | Medium |
| 6. Wire the machine | Plug the Pi into the machine's MDB harness | [03 — Wiring the Machine](03-wiring-the-machine.md) | Medium — go slow, machine unplugged |
| 7. Buy a snack | Watch it appear on your dashboard | — | The fun part |

Tip: at step 5 the Pi has a **simulate mode** (`--simulate`) that generates
fake sales. Use it to confirm your dashboard lights up *before* you ever open
the machine. If simulate mode works, everything except the wiring is proven.

## When You Get Stuck

1. Copy the exact error message into a web search — most errors are common.
2. Check [10 — Troubleshooting](10-troubleshooting.md); it covers the failures
   we know about.
3. Open a GitHub issue with: what step you were on, what you expected, what
   happened instead, and the error text. There are no dumb questions —
   confusing docs are a bug we want to fix.

## Glossary

| Term | What it actually means |
|------|------------------------|
| **MDB** | "Multi-Drop Bus" — the standard cable language your machine's brain uses to talk to its coin mech and card reader. Been standard since the 90s; almost every machine has it. |
| **VMC** | The machine's built-in control board (Vending Machine Controller) — its "brain". |
| **Raspberry Pi** | A tiny, cheap ($60) computer. Ours sits inside the machine and does the listening. |
| **HAT** | A circuit board that snaps on top of the Pi to give it new abilities. The Qibixx MDB HAT lets the Pi speak MDB. |
| **Flash / image an SD card** | Copying an operating system onto a memory card so the Pi can start up from it. A free app (Raspberry Pi Imager) does it in a few clicks. |
| **SSH** | A way to type commands into the Pi from your laptop over Wi-Fi, so the Pi never needs its own keyboard or screen. |
| **Terminal / command line** | The text window where you paste commands. On a Mac it's the "Terminal" app; on Windows, "PowerShell". |
| **Supabase** | A company that hosts databases for free (up to a generous limit). Your sales data lives here, in an account you own. |
| **Postgres** | The kind of database Supabase hosts. You never interact with it directly. |
| **Cloudflare Worker** | A tiny program running in Cloudflare's cloud (free tier) that receives reports from your Pi and files them into the database. |
| **Vercel** | A company that hosts websites for free. Your dashboard lives here. |
| **Anon key** | A long password-ish string from Supabase that lets your dashboard *read* the database. Safe to use in a website; it can't destroy data. |
| **systemd service** | The Linux way of saying "start this program automatically every time the Pi powers on, and restart it if it crashes." |
| **Repo / repository** | This project's folder of files on GitHub. "Cloning" it means downloading a copy. |

## FAQ

**Do I need to know how to code?**
No. Every command is provided to copy-paste. The only file you edit is a
settings file, and the docs show exactly what to put in it.

**Will this mess with my machine or its payments?**
The reference setup is listen-only ([why](02-understanding-mdb.md)): the Pi
joins the machine's internal bus as a silent second device. Coins, bills, and
cards keep working exactly as before. The real risk is physical — wiring
mistakes with the harness — which is why [03](03-wiring-the-machine.md) says:
machine unplugged, verify the pinout against your machine's manual.

**What if my machine isn't on the supported list?**
If it's MDB-compliant (nearly every machine made since the mid-90s), it very
likely works. Check [supported machines](supported-machines.md); if yours is
missing, it mostly means nobody has reported it yet.

**Do I have to be near the machine to see my data?**
No — that's the point. The dashboard is a website. Machine needs Wi-Fi or a
hotspot nearby, that's all.

**What does it cost per month?**
$0 on the Supabase, Cloudflare, and Vercel free tiers. A small fleet uses a
few percent of the free limits.

**What happens if the Pi loses internet or power?**
The machine keeps vending normally. Sales made while the Pi is offline are
not recorded (a buffering enhancement is on the roadmap). When it comes back,
reporting resumes on its own.

**Can I see what the finished thing looks like before I spend $300?**
Yes, two ways: watch the [demo videos](media/README.md), or actually build
the free half and watch simulated sales roll into your own live dashboard —
see [00b — Test-Drive It Free](00b-test-drive.md). One evening, $0.

## Ready?

Start with [01 — Bill of Materials](01-bill-of-materials.md).
