# 01 — Bill of Materials

Everything you need per machine. Approximate USD prices as of 2026.

## Core Components (Required)

| # | Part | Qty | Approx Price | Source |
|---|------|-----|--------------|--------|
| 1 | Raspberry Pi 5 (4GB or 8GB) | 1 | $60-$80 | Adafruit, CanaKit, Micro Center |
| 2 | Qibixx MDB Pi HAT | 1 | $189 | qibixx.com |
| 3 | 16GB microSD card (Class 10 / A1) | 1 | $8 | Amazon (SanDisk / Samsung) |
| 4 | Official Pi 5 USB-C 27W power supply | 1 | $12 | Adafruit, official Pi store |
| 5 | MDB pigtail / harness (6-pin) | 1 | $20-$30 | Vendors Exchange, eBay |
| 6 | Active cooling case (Pi 5 needs it) | 1 | $10-$15 | Argon, FLIRC, Pi Foundation |

**Subtotal: ~$300 per machine**

## Optional but Recommended

| # | Part | Why | Approx Price |
|---|------|-----|--------------|
| 7 | Small DIN-rail enclosure or project box | Mount neatly inside the machine cabinet | $15 |
| 8 | Ethernet keystone or Wi-Fi USB adapter | Backup connectivity if onboard Wi-Fi is weak inside metal cabinet | $10 |
| 9 | Short HDMI cable + Pi power injector | Initial setup convenience | $15 |
| 10 | Heat-shrink tubing + zip ties | Tidy the harness inside the machine | $5 |
| 11 | 5V battery backup (e.g., UPS HAT) | Keep listener running through brief power blips | $30 |

## Earlier Pi Models

You can use a Pi 4, 3B+, or even 3B if you're trying to save money:

| Pi Model | Works? | Notes |
|----------|--------|-------|
| Pi 5 | ✅ | Reference platform; fastest |
| Pi 4 (2GB+) | ✅ | Slightly slower boot; identical runtime behavior |
| Pi 3B+ | ✅ | Adequate for one machine |
| Pi 3B | ✅ | Tight but works |
| Pi Zero 2 W | 🟡 | Works but Qibixx HAT mechanical fit is awkward; needs adapter |
| Pi Zero (original) | ❌ | Too slow for stable MDB timing |

## What NOT to Buy

- ❌ "MDB to USB" adapters from random eBay sellers — most don't follow the timing spec and you'll lose vend frames
- ❌ Generic GPIO-to-RS232 boards — MDB is **not** RS-232; it's a 9-bit serial protocol with specific voltage levels
- ❌ Older Pi (Zero, A+, etc.) — UART implementation is too slow for the 9600-baud 9-bit MDB timing

## Where to Source the MDB Harness

If your machine doesn't already have an exposed MDB cashless connector:

1. **Vendors Exchange** (`vendorsexchange.com`) — has off-the-shelf MDB Y-cables
2. **eBay** — search "MDB Y-cable" or "MDB pigtail"
3. **Build your own** — 6-pin Molex Mini-Fit Jr. connector, 24 AWG twisted pair. Pinout in [`docs/03-wiring-the-machine.md`](03-wiring-the-machine.md).

## Estimated Hardware Cost Per Fleet Size

| Fleet Size | One-Time Cost |
|------------|---------------|
| 1 machine | ~$300 |
| 5 machines | ~$1,500 |
| 10 machines | ~$3,000 |
| 25 machines | ~$7,500 |

For comparison, commercial alternatives charge **$300-$600 per machine for similar hardware** plus **$20-$40/month per machine in service fees**.

## Lead Times

- Raspberry Pi 5: usually in stock at major retailers (was scarce 2023-2024, fine now)
- Qibixx MDB Pi HAT: 2-3 week lead time direct from Qibixx; sometimes immediate from distributors
- MDB harness: 1-2 weeks from Vendors Exchange; immediate from eBay

## Next Step

Once parts arrive: [`docs/02-understanding-mdb.md`](02-understanding-mdb.md) — what MDB is, how it works, what we're going to talk to.
