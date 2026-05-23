"""
OpenVend - MDB vend listener (reference implementation, Python)

Reads vend events from an MDB-compliant traditional vending machine
via the Qibixx MDB Pi HAT, then POSTs them to the OpenVend cloud
ingestor (a Cloudflare Worker) over HTTPS.

This is a REFERENCE implementation. Fork and adapt to your environment.
Do not deploy unmodified to production without reviewing.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import time
from dataclasses import dataclass, asdict
from typing import Optional

import requests
import serial


log = logging.getLogger("openvend")


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MACHINE_ID    = os.environ.get("MACHINE_ID", "MACHINE-001")
INGEST_URL    = os.environ.get("INGEST_URL", "https://example.workers.dev/vends")
INGEST_SECRET = os.environ.get("INGEST_SECRET", "")
SERIAL_DEVICE = os.environ.get("SERIAL_DEVICE", "/dev/ttyAMA0")
BAUD          = 9600
HTTP_TIMEOUT  = 5.0


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class VendEvent:
    machine_id:    str
    ts:            float          # unix epoch seconds
    selection:     str
    price_cents:   int
    payment_type:  str            # 'cash' / 'card' / 'unknown'
    raw_frame:     str            # original MDB frame as hex


# ---------------------------------------------------------------------------
# MDB frame parser (illustrative; real parser depends on Qibixx HAT firmware)
# ---------------------------------------------------------------------------

def parse_mdb_vend(frame: bytes) -> Optional[VendEvent]:
    """
    Parse a VEND APPROVED frame from the MDB cashless peripheral conversation.
    See docs/mdb-protocol-reference.md for the byte layout.

    Returns None if the frame is not a vend event (most aren't — the bus
    has constant chatter for keep-alive polls etc.)
    """
    if len(frame) < 5:
        return None

    # Illustrative only. Real frame parsing depends on the Qibixx HAT
    # firmware's reporting format. Consult Qibixx documentation.
    command_byte = frame[1]

    # Example: VEND APPROVED command on cashless level 1 is 0x13
    if command_byte != 0x13:
        return None

    selection_byte = frame[2]
    price_msb      = frame[3]
    price_lsb      = frame[4]

    return VendEvent(
        machine_id=MACHINE_ID,
        ts=time.time(),
        selection=str(selection_byte),
        price_cents=(price_msb << 8) | price_lsb,
        payment_type="card",   # cashless = card; cash vends come from coin/bill peripherals
        raw_frame=frame.hex(),
    )


# ---------------------------------------------------------------------------
# HTTPS publisher
# ---------------------------------------------------------------------------

def publish_vend(event: VendEvent) -> None:
    """
    POST a vend event to the OpenVend ingestor.

    A failed publish is logged and dropped. This reference implementation
    does not buffer locally — adding an SQLite WAL is a recommended
    enhancement for production deployments with unreliable connectivity.
    """
    payload = asdict(event)
    headers = {
        "Authorization": f"Bearer {INGEST_SECRET}",
        "Content-Type":  "application/json",
    }
    try:
        resp = requests.post(INGEST_URL, json=payload, headers=headers, timeout=HTTP_TIMEOUT)
    except requests.RequestException as exc:
        log.warning("ingestor unreachable, dropping vend: %s", exc)
        return

    if resp.status_code >= 300:
        log.warning("ingestor rejected vend (status=%d): %s", resp.status_code, resp.text[:200])
        return

    log.info("published vend: %s", json.dumps(payload))


# ---------------------------------------------------------------------------
# Main loop — real MDB
# ---------------------------------------------------------------------------

def run_listener() -> None:
    log.info("opening serial device %s @ %d baud", SERIAL_DEVICE, BAUD)
    ser = serial.Serial(SERIAL_DEVICE, BAUD, timeout=1)

    log.info("openvend listener running for %s", MACHINE_ID)
    while True:
        raw = ser.read(64)
        if not raw:
            continue
        event = parse_mdb_vend(raw)
        if event is None:
            continue
        publish_vend(event)


# ---------------------------------------------------------------------------
# Main loop — simulator (no hardware required)
# ---------------------------------------------------------------------------

def run_simulator() -> None:
    """
    Emit fake vend events every ~30 seconds. Useful for verifying the
    full pipeline (Pi -> Worker -> DB -> Dashboard) before you have
    hardware wired up.
    """
    selections   = ["10", "12", "14", "20", "22", "30", "32", "40", "42", "44"]
    prices_cents = [100, 125, 150, 200, 350]

    log.info("openvend simulator running for %s — Ctrl-C to stop", MACHINE_ID)
    while True:
        event = VendEvent(
            machine_id=MACHINE_ID,
            ts=time.time(),
            selection=random.choice(selections),
            price_cents=random.choice(prices_cents),
            payment_type=random.choice(["cash", "card"]),
            raw_frame="simulated",
        )
        publish_vend(event)
        time.sleep(random.uniform(15, 45))


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="emit fake vend events on a timer (no hardware required)",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s [%(name)s] %(message)s",
    )

    if args.simulate:
        run_simulator()
    else:
        run_listener()


if __name__ == "__main__":
    main()
