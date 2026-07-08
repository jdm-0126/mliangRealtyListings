-- Migration: 20260103000005 - RLS policies for agents and brokers
-- The admin panel uses the anon key, so anon needs full write access.

BEGIN;

-- ── brokers ──────────────────────────────────────────────────────────────────
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_brokers" ON brokers;
CREATE POLICY "anon_all_brokers"
  ON brokers FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_brokers" ON brokers;
CREATE POLICY "authenticated_all_brokers"
  ON brokers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── agents ───────────────────────────────────────────────────────────────────
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_agents" ON agents;
CREATE POLICY "anon_all_agents"
  ON agents FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_agents" ON agents;
CREATE POLICY "authenticated_all_agents"
  ON agents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── agent_passwords / shared_passwords ───────────────────────────────────────
ALTER TABLE agent_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_agent_passwords" ON agent_passwords;
CREATE POLICY "anon_all_agent_passwords"
  ON agent_passwords FOR ALL TO anon
  USING (true) WITH CHECK (true);

ALTER TABLE shared_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_shared_passwords" ON shared_passwords;
CREATE POLICY "anon_all_shared_passwords"
  ON shared_passwords FOR ALL TO anon
  USING (true) WITH CHECK (true);

COMMIT;
