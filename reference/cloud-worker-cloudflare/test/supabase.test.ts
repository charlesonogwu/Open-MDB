import { beforeEach, describe, expect, it, vi } from 'vitest';
import { insertVends, lookupSlot, type VendInsert } from '../src/supabase';
import type { Env } from '../src/types';

const env: Env = {
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'svc-key',
  INGEST_SECRET: 's3cret',
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('lookupSlot', () => {
  it('issues a correctly-shaped GET to /rest/v1/slots', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ product_sku: 'SODA-001', products: { name: 'Cola 12oz' } }]),
        { status: 200 },
      ),
    );

    const slot = await lookupSlot(env, 'MACHINE-001', '24');
    expect(slot?.product_sku).toBe('SODA-001');
    expect(slot?.products?.name).toBe('Cola 12oz');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const u = new URL(calledUrl);
    expect(u.origin + u.pathname).toBe('https://demo.supabase.co/rest/v1/slots');
    expect(u.searchParams.get('machine_id')).toBe('eq.MACHINE-001');
    expect(u.searchParams.get('selection')).toBe('eq.24');
    expect(u.searchParams.get('select')).toBe('product_sku,products(name)');
    expect(u.searchParams.get('limit')).toBe('1');

    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBe('svc-key');
    expect(headers.Authorization).toBe('Bearer svc-key');
  });

  it('returns null when no slot row exists for the machine/selection', async () => {
    fetchMock.mockResolvedValueOnce(new Response('[]', { status: 200 }));
    const slot = await lookupSlot(env, 'MACHINE-999', '99');
    expect(slot).toBeNull();
  });
});

describe('insertVends', () => {
  it('POSTs the rows to /rest/v1/vends with service-role headers', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 201 }));
    const row: VendInsert = {
      ts: '2026-05-22T14:32:10.000Z',
      machine_id: 'MACHINE-001',
      selection: '24',
      product_sku: 'SODA-001',
      product_name: 'Cola 12oz',
      payment_type: 'card',
      price_cents: 150,
      mdb_raw_frame: null,
    };
    await insertVends(env, [row]);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('https://demo.supabase.co/rest/v1/vends');
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Prefer).toBe('return=minimal');
    expect(headers.Authorization).toBe('Bearer svc-key');
    expect(JSON.parse(init.body as string)).toEqual([row]);
  });

  it('is a no-op when given an empty row list', async () => {
    await insertVends(env, []);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
