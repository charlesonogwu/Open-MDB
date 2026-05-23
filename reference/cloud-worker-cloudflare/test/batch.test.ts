import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/types';

const env: Env = {
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'svc-key',
  INGEST_SECRET: 's3cret',
};

const validEvent = {
  machine_id: 'MACHINE-001',
  selection: '24',
  ts: 1716381342.1,
  price_cents: 150,
  payment_type: 'card',
};

let fetchMock: ReturnType<typeof vi.fn>;
const ctx = {} as ExecutionContext;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string) => {
    if (url.includes('/rest/v1/slots')) {
      return new Response(
        JSON.stringify([{ product_sku: 'SODA-001', products: { name: 'Cola 12oz' } }]),
        { status: 200 },
      );
    }
    return new Response('', { status: 201 });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function batchReq(body: unknown): Request {
  return new Request('https://w/vends/batch', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: 'Bearer s3cret', 'Content-Type': 'application/json' },
  });
}

function vendInsertCalls(): unknown[] {
  return fetchMock.mock.calls.filter(([url]) =>
    String(url).endsWith('/rest/v1/vends'),
  );
}

describe('batch endpoint', () => {
  it('rejects empty array (400)', async () => {
    const res = await worker.fetch!(batchReq([]), env, ctx);
    expect(res.status).toBe(400);
    expect(vendInsertCalls()).toHaveLength(0);
  });

  it('accepts 50 valid events (202, single bulk insert)', async () => {
    const fifty = Array.from({ length: 50 }, () => validEvent);
    const res = await worker.fetch!(batchReq(fifty), env, ctx);
    expect(res.status).toBe(202);
    expect(vendInsertCalls()).toHaveLength(1);
  });

  it('rejects array with one bad event (400, no inserts performed)', async () => {
    const mixed = [validEvent, { ...validEvent, payment_type: 'crypto' }, validEvent];
    const res = await worker.fetch!(batchReq(mixed), env, ctx);
    expect(res.status).toBe(400);
    expect(vendInsertCalls()).toHaveLength(0);
  });

  it('rejects non-array payload (400)', async () => {
    const res = await worker.fetch!(batchReq({ not: 'an array' }), env, ctx);
    expect(res.status).toBe(400);
  });
});
