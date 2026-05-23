# 03 — Wiring the Machine

⚠️ **Safety first.** Unplug the machine before opening it. The VMC and bill validator handle line voltage in places. The MDB bus itself is low voltage (24V DC) but mistakes can damage the VMC.

## What You're Connecting To

Inside every MDB-compliant machine, the VMC has a daisy-chained 6-pin MDB connector. Existing peripherals (coin mech, bill validator, card reader) tap into this chain.

Standard MDB connector pinout (Molex Mini-Fit Jr. 6-pin):

| Pin | Function | Wire color (typical) |
|-----|----------|---------------------|
| 1 | +34V DC supply | Red |
| 2 | Ground | Black |
| 3 | Master out / Slave in (MDB-DATA from VMC) | White |
| 4 | Slave out / Master in (MDB-DATA from peripherals) | Green |
| 5 | Reserved (sometimes used for power) | — |
| 6 | Reserved | — |

> ⚠️ Pinouts can vary by manufacturer. **Verify against your machine's service manual** before plugging anything in. If you fry the VMC, this guide cannot help you.

## Two Wiring Patterns

### Pattern A — Replace existing cashless reader

If the machine already has an old card reader you want to remove:

```
[VMC] ─── MDB ─── [Coin Mech] ─── [Bill Validator] ─── [Qibixx HAT (replaces old reader)]
```

Disconnect the old reader. Connect the Qibixx HAT to the same MDB harness it was using.

### Pattern B — Add OpenVend alongside existing reader (recommended for non-destructive setup)

```
[VMC] ─── MDB ─── [Coin Mech] ─── [Bill Validator] ─── [Existing Reader] ─── [Qibixx HAT]
```

Daisy-chain a Y-cable so both the existing reader AND the Qibixx HAT are on the bus. The Qibixx is configured at a different MDB address from the existing reader (typically `0x60` instead of `0x10`).

This is the safer option if you want to keep collecting card payments via your existing vendor (Cantaloupe / Nayax / etc.) while ALSO running OpenVend for telemetry.

## Step-by-Step (Pattern B)

1. **Power down** the machine. Confirm with a multimeter on the MDB +34V pin (should read 0V).
2. **Locate the MDB harness.** Usually a 6-pin Molex connector inside the cabinet near the VMC.
3. **Insert the Y-cable.** One leg keeps the existing reader connected. The other leg goes to the Qibixx HAT.
4. **Mount the Qibixx HAT + Pi** somewhere inside the cabinet using a small enclosure or velcro tabs. Avoid placing it near the compressor (vibration).
5. **Connect Pi power.** Use a 5V/3A USB-C supply that plugs into mains, **not** the machine's internal 24V (the converters get hot).
6. **Connect Pi network.** Either:
   - Onboard Wi-Fi (works fine if the machine isn't a metal Faraday cage)
   - Ethernet via a USB adapter (recommended for warehouse/basement locations)
7. **Close the cabinet.** Run the Pi's power cord out through an existing service hole; don't drill new holes.
8. **Power up the machine.** The Qibixx HAT LED should illuminate green.
9. **SSH into the Pi** and run the listener. See [`docs/05-running-the-listener.md`](05-running-the-listener.md).

## Verification

Once the listener is running, perform a test vend:

1. Insert cash (or use a card on the existing reader)
2. Press a selection
3. Within 1-2 seconds, the listener log should show a parsed vend event:
   ```
   [openvend] vend: { machine_id: MACHINE-001, selection: '24', price_cents: 150, payment_type: 'card', ts: ... }
   ```
4. Refresh the dashboard. The vend should appear in the live feed.

If no event fires, see [`docs/10-troubleshooting.md`](10-troubleshooting.md).

## What If My Machine Doesn't Have MDB?

Some very old machines (pre-1995) use proprietary serial protocols, not MDB. Some very new "smart vending" machines use only the manufacturer's proprietary cloud API instead of MDB.

OpenVend is **MDB-only by design**. If your machine doesn't have an MDB bus, this project is not for you. Consider:
- Adding an MDB-compatible coin mech / bill validator (turns most pre-MDB machines into MDB machines)
- Or using the manufacturer's own platform if you can stomach the monthly fee

## Next Step

[`docs/04-raspberry-pi-setup.md`](04-raspberry-pi-setup.md) — flash the SD card, install dependencies, prep the Pi.
