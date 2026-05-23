export type PaymentType = 'cash' | 'card' | 'unknown';

export type VendEvent = {
  machine_id: string;
  ts: number;
  selection: string;
  price_cents: number;
  payment_type: PaymentType;
  raw_frame?: string;
};

export type SlotLookup = {
  product_sku: string | null;
  products: { name: string } | null;
};

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  INGEST_SECRET: string;
};

export type ValidationResult =
  | { ok: true; value: VendEvent }
  | { ok: false; error: string };
