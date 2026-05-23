import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/types';

const env: Env = {
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'svc-key',
  INGEST_SECRET: 's3cret',
};

const validBody = JSON.stringify({
  machine_id: 'MACHINE-001',
  selection: '24',
  ts: 1716381342.1,
  price_cents: 150,
  payment_type: 'card',
});

beforeEach(() => {
  globalThis.fetch = vi.fn(async (url: string) => {
    if (url.includes('/rest/v1/slots')) {
      return new Response(
        JSON.stringify([{ product_sku: 'SODA-001', products: { name: 'Cola 12oz' } }]),
        { status: 200 },
      );
    }
    return new Response('', { status: 201 });
  }) as unknown as typeof fetch;
});

const ctx = {} as ExecutionContext;

describe('auth', () => {
  it('rejects requests without Authorization header (401)', async () => {
    const req = new Request('https://w/vends', { method: 'POST', body: validBody });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(401);
  });

  it('rejects requests with wrong bearer token (401)', async () => {
    const req = new Request('https://w/vends', {
      method: 'POST',
      body: validBody,
      headers: { Authorization: 'Bearer wrong' },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(401);
  });

  it('accepts requests with the correct bearer token (202)', async () => {
    const req = new Request('https://w/vends', {
      method: 'POST',
      body: validBody,
      headers: { Authorization: 'Bearer s3cret', 'Content-Type': 'application/json' },
    });
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(202);
  });

  it('allows GET /health without auth', async () => {
    const req = new Request('https://w/health');
    const res = await worker.fetch!(req, env, ctx);
    expect(res.status).toBe(200);
  });
});
