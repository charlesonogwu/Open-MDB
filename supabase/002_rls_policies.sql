-- OpenVend — Row Level Security and Grants
-- Apply after 001_initial_schema.sql.
-- These grants are REQUIRED if you'll be on a Supabase project created after May 30, 2026
-- (Supabase changed the default to "no implicit grants for tables in public").

-- =========================================================================
-- Grants
-- =========================================================================
-- Anon: dashboard reads (public live demos, no auth required)
GRANT SELECT
   ON public.machines, public.products, public.slots, public.vends
   TO anon;

-- Authenticated: operator users who log in via Supabase Auth (optional)
GRANT SELECT, INSERT, UPDATE, DELETE
   ON public.machines, public.products, public.slots, public.vends
   TO authenticated;

-- Service role: backend writes (the cloud worker that ingests MDB events)
GRANT SELECT, INSERT, UPDATE, DELETE
   ON public.machines, public.products, public.slots, public.vends
   TO service_role;

-- Required for the bigserial sequence on vends.id
GRANT USAGE, SELECT ON SEQUENCE vends_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vends_id_seq TO authenticated;

-- =========================================================================
-- Enable RLS on every table
-- =========================================================================
ALTER TABLE public.machines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vends     ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- Policies — anon can read everything (dashboard pattern)
-- =========================================================================
CREATE POLICY "anon_read_machines" ON public.machines FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_slots"    ON public.slots    FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_vends"    ON public.vends    FOR SELECT TO anon USING (true);

-- =========================================================================
-- Policies — authenticated users can do everything (single-tenant default)
-- For multi-tenant setups, scope by an `owner_id` column on each table.
-- =========================================================================
CREATE POLICY "auth_full_machines" ON public.machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_slots"    ON public.slots    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_vends"    ON public.vends    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_role bypasses RLS automatically — no policy needed for it.
