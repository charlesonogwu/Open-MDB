-- Open MDB — Optional: allow the dashboard's anon role to edit slot inventory.
-- Apply ONLY if you intend to use the reference dashboard's inventory editor
-- without setting up Supabase Auth.
--
-- Trade-off: anyone with your dashboard URL can also change inventory counts.
-- For a single-operator deployment behind a hard-to-guess Vercel URL this is
-- acceptable. For shared deployments, instead use Supabase Auth and the
-- `authenticated` policies that already exist in 002_rls_policies.sql.

GRANT UPDATE ON public.slots TO anon;

CREATE POLICY "anon_update_slots"
  ON public.slots
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
