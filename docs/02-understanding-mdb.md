# 02 — Understanding MDB

You don't need to be a protocol engineer to use Open MDB, but understanding **what MDB is** makes everything else click.

## What MDB Is

**MDB = Multi-Drop Bus.** It's the open serial protocol used to connect a vending machine's "brain" (the VMC, or Vending Machine Controller) to its accessories:

- Coin mechanism (counts coins, makes change)
- Bill validator (accepts cash)
- Cashless reader (card readers, contactless, app payments)
- Energy management modules
- Telemetry units (this is what Open MDB pretends to be)

It's maintained by NAMA (National Automatic Merchandising Association). The current spec is **MDB v4.3**.

## Why It Matters for Open MDB

MDB is **the universal language** of traditional vending machines from the last 25 years. AMS, Crane, Dixie-Narco, Vendo, Royal, National — they all speak it. If a machine has a coin mech or a card reader installed, it has an MDB bus.

That means a single piece of software (this project's listener) works across every machine in the spec, regardless of brand.

## How the Bus Works (Plain English)

The VMC is the **master**. Everything else is a **slave**. The VMC constantly polls each slave with addressed commands like "Hey coin mech, anything new?" and the slave either responds with data or stays silent.

When a customer makes a purchase:

1. Customer presses a selection
2. VMC asks the cashless reader (us): "Approve $1.50 for selection 24?"
3. We respond: "Approved."
4. VMC dispenses
5. VMC tells us: "Vend complete."

That **VEND APPROVED → VEND COMPLETE** conversation is what Open MDB listens for and logs.

## What "Cashless Peripheral" Means

The Qibixx HAT can be set to behave as a cashless reader (MDB device address `0x10` or `0x60`). This is the same role a Cantaloupe / Nayax / USA Tech reader plays.

We **don't replace** the machine's existing card reader if one is present. Instead:

- **Option A (preferred):** Replace the existing reader entirely with Open MDB. The Pi handles both payments and telemetry.
- **Option B (simpler):** Run the Pi as a *second* cashless device on the bus alongside the existing reader. We can listen to vend events even without processing payments.

This project's reference implementation uses **Option B (listen-only)** because it's:
- Less invasive
- Doesn't break existing card processing
- Lets you keep your current payment vendor while still getting telemetry

## Electrical Spec (You Don't Have to Memorize)

- **Baud:** 9600
- **Format:** 9 data bits, 1 stop bit, no parity (the 9th bit signals "this is an address byte")
- **Voltage:** Not RS-232. Open-collector-ish with internal pull-ups. The Qibixx HAT handles all of this for you.
- **Wire:** Twisted pair, ~15-20 feet max from VMC to peripheral.

If you've seen "MDB-to-USB" cables on eBay — most of them fudge the 9-bit framing and miss events. The Qibixx HAT does it correctly in hardware, which is why we recommend it specifically.

## What MDB Tells Us (and Doesn't)

Open MDB can reliably observe:

- ✅ Vend approved (selection + price)
- ✅ Vend complete (success/failure)
- ✅ Payment type (cash via coin mech vs card via cashless)
- ✅ Selection number physically pressed

What MDB does NOT tell us:

- ❌ Product name (we map selection → product via our own `slots` table)
- ❌ Customer identity (anonymized by design)
- ❌ Inventory count (we maintain it ourselves by decrementing on each vend)
- ❌ Machine internal temperature, door open status (different MDB peripheral types we don't currently support)

Building those gaps yourself is the whole point of having your own database under your control.

## Further Reading

- NAMA MDB specification: search "MDB-ICP 4.3" — official spec PDF
- Qibixx documentation: https://qibixx.com/docs
- Open MDB's [`docs/mdb-protocol-reference.md`](mdb-protocol-reference.md) — frame byte layout cheat sheet

## Next Step

[`docs/03-wiring-the-machine.md`](03-wiring-the-machine.md) — physically connecting the Pi + HAT to the machine.
