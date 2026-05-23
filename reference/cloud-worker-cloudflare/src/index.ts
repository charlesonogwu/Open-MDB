import { insertVends, keepAlive, lookupSlot, type VendInsert } from './supabase';
import type { Env, VendEvent } from './types';
import { validateVend } from './validate';

const MAX_BATCH = 500;

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true });
    }
    if (req.method !== 'POST') {
      return new Response('method not allowed', { status: 405 });
    }
    if (!isAuthorized(req, env)) {
      return new Response('unauthorized', { status: 401 });
    }

    if (url.pathname === '/vends') return handleSingle(req, env);
    if (url.pathname === '/vends/batch') return handleBatch(req, env);
    return new Response('not found', { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    await keepAlive(env);
  },
} satisfies ExportedHandler<Env>;

function isAuthorized(req: Request, env: Env): boolean {
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${env.INGEST_SECRET}`;
}

async function handleSingle(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req);
  if (body.ok === false) return json({ error: body.error }, 400);

  const result = validateVend(body.value);
  if (!result.ok) return json({ error: result.error }, 400);

  try {
    const row = await buildInsert(env, result.value);
    await insertVends(env, [row]);
    return json({ ok: true }, 202);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }
}

async function handleBatch(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req);
  if (body.ok === false) return json({ error: body.error }, 400);

  const arr = body.value;
  if (!Array.isArray(arr)) {
    return json({ error: 'batch payload must be a JSON array' }, 400);
  }
  if (arr.length === 0) {
    return json({ error: 'batch payload must contain at least one event' }, 400);
  }
  if (arr.length > MAX_BATCH) {
    return json({ error: `batch size ${arr.length} exceeds limit of ${MAX_BATCH}` }, 400);
  }

  const events: VendEvent[] = [];
  for (let i = 0; i < arr.length; i++) {
    const result = validateVend(arr[i]);
    if (!result.ok) return json({ error: `event ${i}: ${result.error}` }, 400);
    events.push(result.value);
  }

  try {
    const rows = await Promise.all(events.map((e) => buildInsert(env, e)));
    await insertVends(env, rows);
    return json({ ok: true, inserted: rows.length }, 202);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }
}

async function buildInsert(env: Env, event: VendEvent): Promise<VendInsert> {
  const slot = await lookupSlot(env, event.machine_id, event.selection);
  return {
    ts: new Date(event.ts * 1000).toISOString(),
    machine_id: event.machine_id,
    selection: event.selection,
    product_sku: slot?.product_sku ?? null,
    product_name: slot?.products?.name ?? null,
    payment_type: event.payment_type,
    price_cents: event.price_cents,
    mdb_raw_frame: event.raw_frame ?? null,
  };
}

type ReadJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

async function readJson(req: Request): Promise<ReadJsonResult> {
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return { ok: false, error: 'request body is not valid JSON' };
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
