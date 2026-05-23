# Supported Machines

This list grows as the community reports compatibility. Add yours via PR.

## Verified Working

| Machine Family | Specific Model | MDB Level | Notes |
|----------------|----------------|-----------|-------|
| AMS Combo | AMS 39 (Sensit 3) | Level 3 | Reference platform — fully tested |

## Community-Tested (1+ Confirmation)

| Machine Family | Model | MDB Level | Confirmed By |
|----------------|-------|-----------|--------------|
| _(none yet)_ | | | |

## Not Yet Tested — PRs Welcome

| Machine Family | Model | Expected MDB Level |
|----------------|-------|-------------------|
| Crane Merchant | 4-series | Level 2/3 |
| Dixie-Narco | 5000 series | Level 2 |
| Dixie-Narco | DN-501T | Level 2 |
| Vendo | 721 | Level 2 |
| Vendo | 540 | Level 1/2 |
| Royal Vendors | 660 | Level 2 |
| Royal Vendors | RVCDE | Level 2 |
| National | 167 | Level 2 |
| National | 474 | Level 2 |
| AMS Sensit 4 | (newer than reference) | Level 3 |

## How to Add Your Machine

1. Get Open MDB running on your machine
2. Make at least 10 successful test vends and confirm they all show up in the dashboard
3. Run `python main.py --log-level DEBUG` and capture a few raw frame hex strings
4. Open a PR adding your machine to the "Verified Working" table above
5. Include:
   - Machine make and model
   - VMC firmware version (if known)
   - MDB level the machine supports
   - Any quirks (e.g., "vend frame has an extra byte we had to ignore")

## Known Incompatibilities

| Machine | Why |
|---------|-----|
| Pre-1995 proprietary serial machines | No MDB bus |
| Modern "smart" vendor-cloud machines | Don't use MDB; manufacturer's cloud is the only data source |
| Machines with broken/missing coin mech or bill validator | MDB bus may not have power |
