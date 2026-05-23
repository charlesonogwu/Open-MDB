"""Unit tests for the MDB frame parser in main.py."""

from main import MACHINE_ID, parse_mdb_vend


def test_returns_none_for_short_frame():
    assert parse_mdb_vend(b"\x01") is None


def test_returns_none_for_non_vend_command():
    # Second byte is the command; 0x01 is not a VEND APPROVED.
    frame = bytes([0x10, 0x01, 0x00, 0x00, 0x00])
    assert parse_mdb_vend(frame) is None


def test_parses_vend_approved_frame():
    # command=0x13 (VEND APPROVED), selection=24, price=0x0096=150 cents
    frame = bytes([0x10, 0x13, 24, 0x00, 0x96])
    event = parse_mdb_vend(frame)
    assert event is not None
    assert event.selection == "24"
    assert event.price_cents == 150
    assert event.payment_type == "card"
    assert event.machine_id == MACHINE_ID


def test_combines_price_msb_and_lsb():
    # price bytes 0x01, 0x00 = 256 cents
    frame = bytes([0x10, 0x13, 30, 0x01, 0x00])
    event = parse_mdb_vend(frame)
    assert event is not None
    assert event.price_cents == 256


def test_raw_frame_preserved_as_hex():
    frame = bytes([0x10, 0x13, 24, 0x00, 0x96])
    event = parse_mdb_vend(frame)
    assert event is not None
    assert event.raw_frame == "1013180096"
