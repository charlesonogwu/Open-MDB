-- OpenVend — Demo seed data
-- Loads a fictional operator "Acme Vending Co." with 3 demo machines, 12 products,
-- and a realistic slot layout. Run on a fresh schema to see the dashboard come alive.

-- =========================================================================
-- machines
-- =========================================================================
INSERT INTO machines (id, label, location_name, installed_at) VALUES
  ('MACHINE-001', 'Demo Office',    'Office Building A',   now() - interval '90 days'),
  ('MACHINE-002', 'Demo Warehouse', 'Warehouse District',  now() - interval '60 days'),
  ('MACHINE-003', 'Demo Gym',       'Fitness Center',      now() - interval '30 days');

-- =========================================================================
-- products
-- =========================================================================
INSERT INTO products (sku, name, unit_cost_cents, category) VALUES
  ('SODA-001',   'Cola 12oz',              45,  'beverage'),
  ('SODA-002',   'Lemon-Lime 12oz',        45,  'beverage'),
  ('SODA-003',   'Root Beer 12oz',         48,  'beverage'),
  ('WATER-001',  'Bottled Water 16.9oz',   25,  'beverage'),
  ('ENERGY-001', 'Energy Drink 16oz',     175,  'beverage'),
  ('ENERGY-002', 'Sugar-Free Energy 16oz',175,  'beverage'),
  ('CHIP-001',   'Salted Chips 1oz',       38,  'snack'),
  ('CHIP-002',   'BBQ Chips 1oz',          38,  'snack'),
  ('CHIP-003',   'Cheese Puffs 1.25oz',    42,  'snack'),
  ('CANDY-001',  'Chocolate Bar',          75,  'candy'),
  ('CANDY-002',  'Peanut Bar',             75,  'candy'),
  ('CANDY-003',  'Fruit Chews',            65,  'candy');

-- =========================================================================
-- slots — MACHINE-001 (40 slots: snacks rows 1-3, beverages rows 4-5)
-- =========================================================================
INSERT INTO slots (machine_id, selection, capacity, current_stock, product_sku, retail_price_cents) VALUES
  -- Row 1 — chips (depth 7)
  ('MACHINE-001', '10', 7,  5, 'CHIP-001',   125),
  ('MACHINE-001', '12', 7,  3, 'CHIP-002',   125),
  ('MACHINE-001', '14', 7,  6, 'CHIP-003',   150),
  ('MACHINE-001', '16', 7,  2, 'CHIP-001',   125),
  ('MACHINE-001', '18', 7,  4, 'CHIP-002',   125),
  -- Row 2 — snacks (depth 10)
  ('MACHINE-001', '20', 10, 8, 'CHIP-001',   125),
  ('MACHINE-001', '22', 10, 7, 'CHIP-003',   150),
  ('MACHINE-001', '24', 10, 9, 'CHIP-002',   125),
  -- Row 3 — candy (depth 12)
  ('MACHINE-001', '30', 12,10, 'CANDY-001',  200),
  ('MACHINE-001', '32', 12, 5, 'CANDY-002',  200),
  ('MACHINE-001', '34', 12,11, 'CANDY-003',  200),
  -- Row 4 — beverages (depth 5)
  ('MACHINE-001', '40', 5,  3, 'SODA-001',   150),
  ('MACHINE-001', '42', 5,  4, 'SODA-002',   150),
  ('MACHINE-001', '44', 5,  2, 'ENERGY-001', 350),
  ('MACHINE-001', '46', 5,  5, 'WATER-001',  100);

-- =========================================================================
-- vends — synthesize 200 sample vends across the last 30 days
-- =========================================================================
INSERT INTO vends (ts, machine_id, selection, product_sku, product_name, payment_type, price_cents)
SELECT
  now() - (random() * interval '30 days'),
  'MACHINE-001',
  sel.selection,
  sel.product_sku,
  p.name,
  CASE WHEN random() < 0.55 THEN 'cash' ELSE 'card' END,
  sel.retail_price_cents
FROM
  (SELECT selection, product_sku, retail_price_cents
     FROM slots
    WHERE machine_id = 'MACHINE-001'
      AND product_sku IS NOT NULL) sel
  CROSS JOIN generate_series(1, 14) AS g
  LEFT JOIN products p ON p.sku = sel.product_sku;
