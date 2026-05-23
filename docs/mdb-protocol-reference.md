# MDB Protocol Reference

A working programmer's cheat sheet. For the authoritative spec, get the **NAMA MDB-ICP 4.3** document.

## Bus Electrical

| Property | Value |
|----------|-------|
| Baud | 9600 |
| Bits | 9 data + 1 stop (the 9th bit is the address marker) |
| Parity | None |
| Voltage | Open-collector, ~24V DC supply rail |
| Max wire length | ~15-20 ft |

## Roles

- **VMC** (Vending Machine Controller) — bus master. The machine's main brain.
- **Peripheral** — bus slave. Coin mech, bill validator, cashless reader.

## Peripheral Addresses (MDB Levels)

| Hex | Device |
|-----|--------|
| 0x00-0x0F | Reserved |
| 0x10 | Cashless device #1 |
| 0x18 | Communications gateway |
| 0x20 | Energy management |
| 0x30 | Bill validator |
| 0x40 | Coin mechanism |
| 0x60 | Cashless device #2 (newer spec — allows two cashless devices coexisting) |

OpenVend listens at `0x10` or `0x60` depending on whether another cashless device is already present.

## Address Byte vs Data Byte

The 9th bit distinguishes them:
- **9th bit = 1** → this is an ADDRESS byte (start of new frame, targets a specific peripheral)
- **9th bit = 0** → this is a DATA byte (continuation of current frame)

## VMC Polling Loop (Cashless Level)

The VMC continuously asks each peripheral: "Anything for me?" via a POLL command.

```
VMC → Cashless: POLL (0x12)
Cashless → VMC: ACK or response data
```

## Vend Sequence (Simplified)

```
1. Customer selects an item
2. VMC → Cashless: VEND REQUEST (0x13, 0x00, selection, price_msb, price_lsb)
3. Cashless → VMC: VEND APPROVED (0x05, vend_amount_msb, vend_amount_lsb)
        OR        : VEND DENIED   (0x06)
4. Machine dispenses
5. VMC → Cashless: VEND SUCCESS (0x13, 0x02, selection_msb, selection_lsb)
        OR        : VEND FAILED   (0x13, 0x04)
6. Cashless → VMC: ACK
```

The interesting events for OpenVend are:
- **VEND REQUEST** (step 2) — tells us a vend is *about* to happen
- **VEND SUCCESS** (step 5) — tells us it actually happened

We typically log on VEND SUCCESS to avoid double-counting denied/failed vends.

## Frame Byte Layout — Example VEND SUCCESS

```
Byte 0: 0x13              ← cashless extended command
Byte 1: 0x02              ← subcommand: VEND SUCCESS
Byte 2: 0x00              ← selection MSB (high byte)
Byte 3: 0x18              ← selection LSB (low byte) = selection 24
Byte 4: 0xAB              ← checksum
```

Parse selection as `(byte[2] << 8) | byte[3]`.

## Common Selection Numbering

| Style | Example |
|-------|---------|
| AMS rows 1-2 use even numbers only | 10, 12, 14, 16, 18 |
| AMS rows 3+ use consecutive numbers | 30, 31, 32, 33... |
| Crane uses alpha-numeric on display but reports numeric on MDB | A1 = 11, B2 = 22, etc. |
| Dixie-Narco uses pure numeric | 100, 101, 200, 201... |

The MDB protocol itself just reports a number. Mapping it to the displayed selection is per-machine.

## Useful Tools

- **mdb-decoder.com** — paste hex frames, see decoded fields
- **Qibixx documentation** — vendor-specific firmware commands

## See Also

- [`docs/02-understanding-mdb.md`](02-understanding-mdb.md) — conceptual overview
- [`reference/pi-listener-python/main.py`](../reference/pi-listener-python/main.py) — reference parser
