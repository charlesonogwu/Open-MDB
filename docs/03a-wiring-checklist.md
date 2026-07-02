# 03a — Wiring Day Checklist (Print This Page)

One page to take to the machine. It assumes you read
[03 — Wiring the Machine](03-wiring-the-machine.md) once at home, and that
the Pi is already set up ([04](04-raspberry-pi-setup.md) or
[04a](04a-setup-without-terminal.md)) and tested with Wi-Fi.

*To print from GitHub: open this page → browser menu → Print.*

---

## Bring

- [ ] Pi + Qibixx HAT, already assembled and SD card inserted
- [ ] MDB Y-cable / pigtail
- [ ] USB-C power supply (wall plug — you need a mains outlet in or behind the machine)
- [ ] Multimeter
- [ ] Screwdrivers, velcro tabs or small enclosure, zip ties
- [ ] Machine keys · your machine's service manual if you have it
- [ ] Phone with the dashboard open and your Wi-Fi hotspot ready (backup network)
- [ ] Some coins or a card for the test vend

## Safety — do in this order, every time

- [ ] 1. **UNPLUG THE MACHINE FROM THE WALL.** Not just "off". Unplugged.
- [ ] 2. Open the cabinet
- [ ] 3. Find the MDB harness — 6-pin Molex connector chain near the control board (VMC), also feeding the coin mech / bill validator / card reader
- [ ] 4. Multimeter check between pin 1 (+34V, usually red) and pin 2 (ground, usually black): must read **0V** before you touch anything
- [ ] 5. Wire colors vary by manufacturer — when in doubt, trust the service manual over this checklist

## Pinout (standard MDB, Molex Mini-Fit Jr. 6-pin)

| Pin | Function | Typical color |
|-----|----------|---------------|
| 1 | +34V DC supply | Red |
| 2 | Ground | Black |
| 3 | Data from VMC (master out) | White |
| 4 | Data from peripherals (slave out) | Green |
| 5 | Reserved | — |
| 6 | Reserved | — |

## Connect (Pattern B — keeps your existing card reader working)

- [ ] 6. Plug the Y-cable into the MDB chain: one leg back to the existing reader, one leg to the Qibixx HAT
- [ ] 7. Mount Pi + HAT inside the cabinet — away from the compressor, not blocking the door
- [ ] 8. Pi power from the **wall outlet** (never from the machine's internal 24V)
- [ ] 9. Route the power cord through an existing service hole — no new holes
- [ ] 10. Tidy cables with zip ties; nothing near door hinges or moving parts

## Power Up & Verify

- [ ] 11. Plug the machine back in, power up
- [ ] 12. Qibixx HAT LED lights **green**
- [ ] 13. Wait ~2 minutes for the Pi to boot and connect
- [ ] 14. **Buy something from the machine** (the fun checklist item)
- [ ] 15. The vend appears on your phone's dashboard within a few seconds

## If Step 15 Fails

Don't debug with the cabinet open longer than needed — the machine works
fine regardless of the Pi. Close up, then work through
[10 — Troubleshooting](10-troubleshooting.md) from home; the flowchart at
the top narrows it down in a few questions. Most first-day misses are Wi-Fi
signal inside the metal cabinet (move the Pi nearer the door, or use the
hotspot to confirm).
