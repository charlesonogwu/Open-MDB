# 04a — Pi Setup Without a Terminal (Beta)

This is the alternative to [04 — Raspberry Pi Setup](04-raspberry-pi-setup.md)
for people who would rather not use SSH or a command line at all. You flash
the SD card, copy two files onto it, edit one of them in a normal text
editor, and boot the Pi. The Pi installs everything itself and writes a
report you can read from your computer.

> ⚠️ **Beta — unverified on hardware, community testing wanted.** This flow
> has not yet been run end-to-end on a real Raspberry Pi. The scripts are
> provided so early adopters can try and report back. It requires **Raspberry
> Pi OS Bookworm (October 2023 or newer)** — just use the latest, which is
> what the Imager offers by default. If anything goes wrong, nothing is lost:
> the classic [terminal path](04-raspberry-pi-setup.md) is the tested route,
> and re-flashing the card gives you a clean start. **Please report success or
> failure in a GitHub issue** so this can be promoted from beta or fixed.

## What You Need

- The microSD card and a computer with a card reader
- Your Wi-Fi network name and password
- Your ingest URL and secret from [07 — Cloud Ingestion](07-cloud-ingestion.md)
- The two files in this repo's [`boot-setup/`](../boot-setup/) folder
  (on the GitHub page, open each file, click the **Download raw file** button)

## Step 1 — Flash the Card

1. Install **Raspberry Pi Imager** from
   [raspberrypi.com/software](https://www.raspberrypi.com/software/)
2. Choose your Pi model, then **OS → Raspberry Pi OS (other) → Raspberry Pi
   OS Lite (64-bit)**, then your SD card
3. When the Imager asks about **OS customisation**, click **Edit settings**:
   - Set a hostname (e.g. `open-mdb-office`), username, and password
   - **Enter your Wi-Fi name and password** — this is how the Pi gets online
   - Set your timezone
4. Save, write, and wait for it to finish

## Step 2 — Copy the Two Files

1. Unplug and re-insert the SD card. A small drive named **bootfs** appears.
2. Copy **`firstrun-openmdb.sh`** and **`open-mdb.txt`** from this repo's
   `boot-setup/` folder onto that drive.

## Step 3 — Edit Your Settings

Open **`open-mdb.txt`** on the SD card in Notepad (Windows) or TextEdit
(Mac) and fill in your three values:

```
MACHINE_ID=OFFICE-1
INGEST_URL=https://open-mdb-ingestor.YOUR-ACCOUNT.workers.dev/vends
INGEST_SECRET=paste-your-secret-here
```

Save the file.

## Step 4 — Add One Line to cmdline.txt

On the same drive, open **`cmdline.txt`**. It contains a single long line.
Click at the very end of that line, add **one space**, then paste this:

```
systemd.run=/boot/firstrun-openmdb.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target
```

Keep everything on one line — don't press Enter. Save the file.

*(This is the standard Raspberry Pi "run something on first boot" mechanism —
the same one the Imager itself used for years. It removes itself after
running once.)*

## Step 5 — Boot and Wait

1. Eject the card, put it in the Pi (HAT attached, Pi powered off first)
2. Power up and wait **about 10 minutes** — the Pi reboots itself once,
   connects to your Wi-Fi, downloads and installs everything
3. Power off, pull the card, and put it back into your computer

## Step 6 — Read the Report

On the **bootfs** drive there is now a file called **`open-mdb-setup.log`**.
Open it. The last lines tell you what happened:

- **`SUCCESS`** — done. Put the card back in the Pi and continue to
  [03 — Wiring the Machine](03-wiring-the-machine.md). The listener starts
  by itself on every boot.
- **`FAILED: …`** — the message says exactly what to fix (usually a typo in
  `open-mdb.txt` or Wi-Fi details). Fix it, put the card back, and boot
  again — setup retries automatically.
- **No log file at all** — the first-boot hook didn't run. Check Step 4:
  the line in `cmdline.txt` must be one single line with a space before
  `systemd.run`.

## How It Works (for the curious)

`firstrun-openmdb.sh` runs once before the system is fully up. It installs a
one-time "provisioning" service and removes itself. On the next boot, that
service waits for the network, reads your `open-mdb.txt`, installs the
listener exactly the way [`scripts/pi-install.sh`](../scripts/pi-install.sh)
does, starts it under a dedicated low-privilege user, and writes the report
to the boot drive — the one place you can read without any tools.
