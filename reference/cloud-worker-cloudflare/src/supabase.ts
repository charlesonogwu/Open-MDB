import type { Env, PaymentType, SlotLookup } from './types';

export type VendInsert = {
  ts: string;
  machine_id: string;
  selection: string;
  product_sku: string | null;
  product_name: string | null;
  payment_type: PaymentType;
  price_cents: number;
  mdb_raw_frame: string | null;
};

function authHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

export async function lookupSlot(
  env: Env,
  machineId: string,
  selection: string,
): Promise<SlotLookup | null> {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/slots`);
  url.searchParams.set('machine_id', `eq.${machineId}`);
  url.searchParams.set('selection', `eq.${selection}`);
  url.searchParams.set('select', 'product_sku,products(name)');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: { ...authHeaders(env), Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`slot lookup failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as SlotLookup[];
  return rows[0] ?? null;
}

export async function insertVends(env: Env, rows: VendInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/vends`, {
    method: 'POST',
    headers: {
      ...authHeaders(env),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`vend insert failed: ${res.status} ${await res.text()}`);
  }
}

export async function keepAlive(env: Env): Promise<void> {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/machines`);
  url.searchParams.set('select', 'id');
  url.searchParams.set('limit', '1');
  await fetch(url.toString(), { headers: authHeaders(env) });
}
