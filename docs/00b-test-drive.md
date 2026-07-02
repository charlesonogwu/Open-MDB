# 00b — Test-Drive It Free (Before Buying Any Hardware)

You can build and see the entire system working — live dashboard included —
for **$0, in one evening, without a Raspberry Pi or a vending machine**. The
listener has a built-in simulator that generates pretend sales; everything
downstream (the database, the cloud ingestor, the dashboard) is the real
thing running on free tiers.

If you finish this page, you have already done all the hard cloud setup. The
$300 hardware only replaces the simulator with a real machine.

## What You'll Have at the End

Your own private dashboard URL showing a "machine" selling snacks every 30
seconds — live revenue, a vend feed, top sellers. Open it on your phone.

## Step 1 — The Cloud Half (same as the real setup)

Do these three docs in order. They are all copy-paste:

1. [06 — Supabase Schema](06-supabase-schema.md) — free database (~15 min)
2. [07 — Cloud Ingestion](07-cloud-ingestion.md) — free Cloudflare Worker (~30 min)
3. [08 — Dashboard Quickstart](08-dashboard-quickstart.md) — one-click dashboard (~15 min)

At the end you have an **ingest URL**, an **ingest secret**, and a
**dashboard URL**. Keep all three handy.

## Step 2 — Run the Simulator on Your Own Computer

You need Python 3, which Macs already have and Windows installs in one click
from [python.org/downloads](https://www.python.org/downloads/) (tick **"Add
python.exe to PATH"** during install).

Open a terminal (Mac: Terminal app · Windows: PowerShell) and paste, one
block at a time:

**Mac / Linux:**

```bash
git clone https://github.com/charlesonogwu/Open-MDB.git
cd Open-MDB/reference/pi-listener-python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export MACHINE_ID=TEST-1
export INGEST_URL=https://open-mdb-ingestor.YOUR-ACCOUNT.workers.dev/vends
export INGEST_SECRET=your-secret-here

python main.py --simulate
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/charlesonogwu/Open-MDB.git
cd Open-MDB\reference\pi-listener-python
py -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:MACHINE_ID = "TEST-1"
$env:INGEST_URL = "https://open-mdb-ingestor.YOUR-ACCOUNT.workers.dev/vends"
$env:INGEST_SECRET = "your-secret-here"

python main.py --simulate
```

(No `git`? Use GitHub's green **Code → Download ZIP** button instead of the
first line, unzip, and `cd` into the same folder.)

Replace the URL and secret with your real values from Step 1.

## Step 3 — Watch

Open your dashboard URL. Every ~30 seconds a new simulated vend appears in
the live feed and the revenue counter ticks up. That's the exact pipeline a
real machine uses — Pi → Worker → database → dashboard — with your laptop
playing the part of the Pi.

Press `Ctrl+C` in the terminal to stop the simulator.

## Cleaning Up the Fake Sales

When you're done playing, remove the test data so your real stats start
clean. In Supabase: **SQL Editor → New query**, paste, and run:

```sql
delete from vends where machine_id = 'TEST-1';
```

## Decision Time

- **Liked it?** Order the [parts list](01-bill-of-materials.md). Your cloud
  half is already done — hardware setup is [04](04-raspberry-pi-setup.md) or
  the [no-terminal path](04a-setup-without-terminal.md), then
  [wiring](03-wiring-the-machine.md).
- **Not for you?** Delete the three free accounts and you've spent nothing.
