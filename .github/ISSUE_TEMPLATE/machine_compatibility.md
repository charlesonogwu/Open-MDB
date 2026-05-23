---
name: Machine compatibility report
about: You got OpenVend working on a machine that isn't yet listed as verified
title: "[compat] "
labels: compatibility
assignees: ''
---

Thanks for testing OpenVend on a new machine. This report helps the next operator with the same model.

## Machine

- **Make:** (AMS, Crane, Dixie-Narco, Vendo, Royal, National, other)
- **Model:** (e.g., 39 Combo, Merchant 4, DN-501T)
- **VMC firmware version:** if visible on the machine's diagnostic screen
- **MDB level:** 1, 2, or 3
- **Year of manufacture:** approximate is fine

## Setup details

- **Wiring pattern used:** A (replaced existing reader) or B (Y-cable alongside)
- **Qibixx MDB Pi HAT firmware version:**
- **Number of successful test vends:** (e.g., 12 of 12)

## Quirks encountered

Did the reference parser work out of the box, or did you have to adjust `parse_mdb_vend` in `main.py`? Describe any non-default behavior:

- Frame layout differences
- Selection-number encoding (numeric? alpha-numeric mapped to numeric?)
- Price reporting quirks (cents vs $$.cc vs raw machine units)

## Sample raw frame

Paste one VEND APPROVED frame as hex from `--log-level DEBUG`:

```
paste hex frame here
```

## Anything else
