-- ============================================================================
-- Standalone DDL: leads table
-- M. Liang Realty — Public Inquiry Form
--
-- This file contains the minimal CREATE TABLE statement for the leads table
-- as specified in the public-website design document (Requirement 6.3).
--
-- NOTE: This table is already created by the main migration at:
--   supabase/migrations/20260101000000_initial_schema.sql
-- That migration also adds optional columns (status, notes, updated_at),
-- additional indexes, and an "authenticated_all_leads" policy for admin access.
--
-- Use this file as a standalone reference or to bootstrap a fresh environment
-- that does not run the full migration suite.
-- ============================================================================

CREATE TABLE leads (
  id           BIGSERIAL PRIMARY KEY,
  full_name    TEXT NOT NULL CHECK (char_length(full_name) <= 100),
  contact_number TEXT NOT NULL CHECK (contact_number ~ '^09[0-9]{9}$'),
  email        TEXT NOT NULL CHECK (char_length(email) <= 150),
  property_of_interest TEXT CHECK (char_length(property_of_interest) <= 200),
  message      TEXT NOT NULL CHECK (char_length(message) <= 1000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Allow anonymous insert (public inquiry form), deny select/update/delete
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON leads FOR INSERT TO anon WITH CHECK (true);
