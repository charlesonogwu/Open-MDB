export type PaymentType = 'cash' | 'card' | 'unknown';

export type Machine = {
  id: string;
  label: string;
  location_name: string | null;
  notes: string | null;
  installed_at: string;
  archived_at: string | null;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  unit_cost_cents: number | null;
  category: string | null;
  created_at: string;
};

export type Slot = {
  machine_id: string;
  selection: string;
  capacity: number;
  current_stock: number;
  product_sku: string | null;
  retail_price_cents: number | null;
  last_restocked_at: string | null;
  updated_at: string;
};

export type Vend = {
  id: number;
  ts: string;
  machine_id: string;
  selection: string;
  product_sku: string | null;
  product_name: string | null;
  payment_type: PaymentType | null;
  price_cents: number | null;
  mdb_raw_frame: string | null;
  created_at: string;
};
