# 04 — Raspberry Pi Setup

## Flash the SD Card

1. Download **Raspberry Pi Imager** from raspberrypi.com
2. Insert your microSD card into your computer
3. In Imager:
   - **Device:** Raspberry Pi 5 (or whichever model you have)
   - **OS:** Raspberry Pi OS Lite (64-bit) — no desktop needed
   - **Storage:** your microSD card
4. Click ⚙️ to pre-configure:
   - Set hostname: `openvend-<machine-label>` (e.g., `openvend-office`)
   - Enable SSH with password OR public-key authentication
   - Set Wi-Fi SSID and password
   - Set locale and timezone
5. Write and verify

## First Boot

1. Insert the SD card into the Pi
2. Plug the Qibixx MDB Pi HAT onto the GPIO header (with Pi off)
3. Power up
4. SSH in from your laptop:
   ```bash
   ssh <pi-username>@openvend-office.local
   ```

## Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git

# Enable UART (required for Qibixx HAT communication)
sudo raspi-config nonint do_serial_hw 0     # enable serial hardware
sudo raspi-config nonint do_serial_cons 1   # disable serial console

# Reboot to apply UART changes
sudo reboot
```

After reboot, SSH back in and verify the serial device exists:

```bash
ls -la /dev/ttyAMA0   # should exist
```

## Install the Listener

```bash
git clone https://github.com/<your-fork>/openvend.git
cd openvend/reference/pi-listener-python

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configure the Listener

Copy the example env file and fill in your details:

```bash
cp .env.example .env
nano .env
```

You'll need:

```bash
MACHINE_ID=MACHINE-001
SERIAL_DEVICE=/dev/ttyAMA0
INGEST_URL=https://openvend-ingestor.<your-account>.workers.dev/vends
INGEST_SECRET=replace-with-the-same-value-you-set-on-the-worker
```

`INGEST_URL` is the URL your Cloudflare Worker prints after `wrangler deploy`. `INGEST_SECRET` must be identical to the secret you set on the Worker — see [`docs/07-cloud-ingestion.md`](07-cloud-ingestion.md).

## Run the Listener as a System Service

```bash
sudo cp openvend-listener.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable openvend-listener
sudo systemctl start openvend-listener
```

Check status:

```bash
sudo systemctl status openvend-listener
sudo journalctl -u openvend-listener -f
```

You should see startup logs and (after a test vend) parsed vend events.

## Test Without a Real Machine

The listener has a `--simulate` flag for development:

```bash
python main.py --simulate
```

This generates synthetic vend events every 30 seconds. Useful for verifying the full pipeline (Pi → Worker → Supabase → Dashboard) before you wire to a real machine.

## Next Step

[`docs/05-running-the-listener.md`](05-running-the-listener.md) — detailed operations: log rotation, restart policies, network reconnect handling.
