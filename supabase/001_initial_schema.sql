-- Open MDB — Initial Schema
-- Apply this in the Supabase SQL Editor on a fresh project.

-- =========================================================================
-- machines
-- =========================================================================
CREATE TABLE machines (
  id            text        PRIMARY KEY,                  -- e.g. 'MACHINE-001'
  label         text        NOT NULL,                     -- e.g. 'Demo Office'
  location_name text,                                     -- e.g. 'Office Building A'
  notes         text,
  installed_at  timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz                                -- non-null = decommissioned
);

-- =========================================================================
-- products
-- =========================================================================
CREATE TABLE products (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  sku              text    UNIQUE NOT NULL,               -- e.g. 'SODA-001'
  name             text    NOT NULL,                      -- e.g. 'Cola 12oz'
  unit_cost_cents  integer,                                -- your wholesale cost
  category         text,                                   -- 'beverage' / 'snack' / 'candy'
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- slots
-- =========================================================================
CREATE TABLE slots (
  machine_id           text    NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  selection            text    NOT NULL,                  -- MDB selection number ('24', 'A1', etc.)
  capacity             integer NOT NULL,                  -- max units that fit in this coil
  current_stock        integer NOT NULL DEFAULT 0,        -- live count, decremented on each vend
  product_sku          text    REFERENCES products(sku),
  retail_price_cents   integer,                            -- what the machine displays
  last_restocked_at    timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (machine_id, selection)
);

CREATE INDEX idx_slots_machine ON slots(machine_id);
CREATE INDEX idx_slots_product ON slots(product_sku);

-- =========================================================================
-- vends
-- =========================================================================
CREATE TABLE vends (
  id            bigserial   PRIMARY KEY,
  ts            timestamptz NOT NULL,                     -- when the vend physically happened
  machine_id    text        NOT NULL REFERENCES machines(id),
  selection     text        NOT NULL,
  product_sku   text,                                      -- snapshot at vend time (may differ from current slot)
  product_name  text,                                      -- snapshot at vend time
  payment_type  text        CHECK (payment_type IN ('cash', 'card', 'unknown')),
  price_cents   integer,
  mdb_raw_frame text,                                      -- optional: hex of original MDB frame for debugging
  created_at    timestamptz NOT NULL DEFAULT now()        -- when our ingestor recorded it
);

CREATE INDEX idx_vends_machine_ts ON vends(machine_id, ts DESC);
CREATE INDEX idx_vends_product    ON vends(product_sku);

-- =========================================================================
-- Convenience: decrement slot stock on each new vend
-- =========================================================================
CREATE OR REPLACE FUNCTION decrement_slot_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE slots
     SET current_stock = GREATEST(0, current_stock - 1),
         updated_at    = now()
   WHERE machine_id = NEW.machine_id
     AND selection  = NEW.selection;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vends_decrement_slot
  AFTER INSERT ON vends
  FOR EACH ROW
  EXECUTE FUNCTION decrement_slot_stock();
