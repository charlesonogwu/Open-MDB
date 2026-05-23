# 05 — Running the Listener

This doc covers what the listener does once it's running, how to monitor it, and how to keep it healthy.

## What "Running" Means

The listener is a long-lived Python process that:

1. Opens the serial port to the Qibixx HAT (`/dev/ttyAMA0`)
2. Reads bytes from the bus continuously
3. Parses each VEND APPROVED frame
4. POSTs a JSON event to your cloud ingestor at `INGEST_URL`

It does **not** maintain local state. Every event is fire-and-forget over HTTPS. A vend lost during a network outage is logged and dropped; see [Reliability trade-off](#reliability-trade-off) below.

## Recommended Setup

Run as a systemd service so it survives reboots, crashes, and SSH disconnects. See [`openvend-listener.service`](../reference/pi-listener-python/openvend-listener.service).

## Monitoring

```bash
# Tail logs live
sudo journalctl -u openvend-listener -f

# Last 100 lines
sudo journalctl -u openvend-listener -n 100

# Restart
sudo systemctl restart openvend-listener

# Check status
sudo systemctl status openvend-listener
```

## Health Checks

- The Pi should be online — `ping <pi-hostname>.local` from your laptop
- The ingestor should respond — `curl https://<your-worker>.workers.dev/health` returns `{"ok":true}`
- A test vend should produce a log line within 2 seconds

## Log Rotation

systemd-journald handles rotation by default. To cap journal size:

```bash
sudo nano /etc/systemd/journald.conf
# Set: SystemMaxUse=200M
sudo systemctl restart systemd-journald
```

## Reliability trade-off

The reference listener does **not** buffer locally. If the Pi can't reach the ingestor for any reason — Wi-Fi drop, ISP outage, Worker scheduled deploy — the vend is logged and lost.

For operators with unreliable connectivity this is unacceptable. Recommended enhancement: extend `publish_vend` in `main.py` to write to a local SQLite WAL, then add a background thread that drains the WAL on a timer. The Worker's `/vends/batch` endpoint accepts up to 500 events per request, which makes drain-on-reconnect efficient.

A community PR adding this is very welcome.

## What You'll See in Logs

```
2026-05-22 14:32:10 [openvend] opening serial device /dev/ttyAMA0 @ 9600 baud
2026-05-22 14:32:10 [openvend] openvend listener running for MACHINE-001
2026-05-22 14:35:42 [openvend] published vend: {"machine_id":"MACHINE-001","ts":1716381342.1,"selection":"24","price_cents":150,"payment_type":"card","raw_frame":"131800960a"}
```

## Next Step

[`docs/06-supabase-schema.md`](06-supabase-schema.md) — set up the database that receives these events.
