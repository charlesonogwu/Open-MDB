---
name: Bug report
about: A vend event isn't appearing, a parser is mis-decoding, or something else is broken
title: "[bug] "
labels: bug
assignees: ''
---

## What's broken

A clear, one-paragraph description of what's happening and what you expected to happen instead.

## Hardware

- **Pi model:** (e.g., Raspberry Pi 5 4GB)
- **Qibixx MDB Pi HAT firmware version:** (run the Qibixx info command to print this)
- **Vending machine make + model:** (e.g., AMS 39 Combo, Sensit 3)
- **MDB level the machine supports:** (1, 2, or 3)

## Software

- **Listener commit / version:** (`git rev-parse --short HEAD` from your checkout)
- **Cloud Worker URL:** redact the subdomain if you want, but include `https://` and whether it's Cloudflare / AWS / other
- **Supabase project region:** (e.g., us-east-1)
- **Dashboard URL:** optional

## Steps to reproduce

1.
2.
3.

## Listener logs (last 50 lines)

```
paste output of: sudo journalctl -u open-mdb-listener -n 50
```

## Worker logs (last 50 lines)

```
paste output of: wrangler tail   (or the Cloudflare dashboard log view)
```

## Raw MDB frame (if relevant)

If the bug is about a misparsed vend, run the listener with `--log-level DEBUG` and paste the raw hex of the offending frame here.

```
paste hex frame here
```

## Anything else
