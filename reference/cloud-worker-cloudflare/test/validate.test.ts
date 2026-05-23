import { describe, expect, it } from 'vitest';
import { validateVend } from '../src/validate';

const valid = {
  machine_id: 'MACHINE-001',
  selection: '24',
  ts: 1716381342.1,
  price_cents: 150,
  payment_type: 'card',
};

describe('validateVend', () => {
  it('accepts a complete valid payload', () => {
    expect(validateVend(valid).ok).toBe(true);
  });

  it("accepts payment_type 'unknown'", () => {
    expect(validateVend({ ...valid, payment_type: 'unknown' }).ok).toBe(true);
  });

  it('is lenient on extra unknown fields', () => {
    expect(validateVend({ ...valid, future_field: 'whatever' }).ok).toBe(true);
  });

  it('accepts optional raw_frame as a string', () => {
    const r = validateVend({ ...valid, raw_frame: '131800960a' });
    expect(r.ok).toBe(true);
  });

  it('rejects missing machine_id', () => {
    const { machine_id: _m, ...rest } = valid;
    expect(validateVend(rest).ok).toBe(false);
  });

  it('rejects empty-string machine_id', () => {
    expect(validateVend({ ...valid, machine_id: '' }).ok).toBe(false);
  });

  it('rejects missing selection', () => {
    const { selection: _s, ...rest } = valid;
    expect(validateVend(rest).ok).toBe(false);
  });

  it('rejects price_cents as a string', () => {
    expect(validateVend({ ...valid, price_cents: '150' }).ok).toBe(false);
  });

  it('rejects negative price_cents', () => {
    expect(validateVend({ ...valid, price_cents: -1 }).ok).toBe(false);
  });

  it('rejects non-integer price_cents', () => {
    expect(validateVend({ ...valid, price_cents: 1.5 }).ok).toBe(false);
  });

  it("rejects payment_type 'crypto'", () => {
    expect(validateVend({ ...valid, payment_type: 'crypto' }).ok).toBe(false);
  });

  it('rejects ts as an ISO string', () => {
    expect(validateVend({ ...valid, ts: '2026-05-22T14:32:10Z' }).ok).toBe(false);
  });

  it('rejects raw_frame as a number', () => {
    expect(validateVend({ ...valid, raw_frame: 12345 }).ok).toBe(false);
  });

  it('rejects null', () => {
    expect(validateVend(null).ok).toBe(false);
  });

  it('rejects arrays', () => {
    expect(validateVend([valid]).ok).toBe(false);
  });
});
