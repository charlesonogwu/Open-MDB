import type { PaymentType, ValidationResult, VendEvent } from './types';

const PAYMENT_TYPES: ReadonlySet<PaymentType> = new Set(['cash', 'card', 'unknown']);

export function validateVend(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'payload must be a JSON object' };
  }
  const v = input as Record<string, unknown>;

  if (typeof v.machine_id !== 'string' || v.machine_id.length === 0) {
    return { ok: false, error: 'machine_id is required and must be a non-empty string' };
  }
  if (typeof v.selection !== 'string' || v.selection.length === 0) {
    return { ok: false, error: 'selection is required and must be a non-empty string' };
  }
  if (typeof v.ts !== 'number' || !Number.isFinite(v.ts)) {
    return { ok: false, error: 'ts is required and must be a finite number (unix epoch seconds)' };
  }
  if (
    typeof v.price_cents !== 'number' ||
    !Number.isInteger(v.price_cents) ||
    v.price_cents < 0
  ) {
    return { ok: false, error: 'price_cents is required and must be a non-negative integer' };
  }
  if (
    typeof v.payment_type !== 'string' ||
    !PAYMENT_TYPES.has(v.payment_type as PaymentType)
  ) {
    return { ok: false, error: "payment_type must be one of 'cash', 'card', 'unknown'" };
  }
  if (v.raw_frame !== undefined && typeof v.raw_frame !== 'string') {
    return { ok: false, error: 'raw_frame, if present, must be a string' };
  }

  const event: VendEvent = {
    machine_id: v.machine_id,
    selection: v.selection,
    ts: v.ts,
    price_cents: v.price_cents,
    payment_type: v.payment_type as PaymentType,
    ...(typeof v.raw_frame === 'string' ? { raw_frame: v.raw_frame } : {}),
  };
  return { ok: true, value: event };
}
