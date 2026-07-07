-- ============================================================================
-- Migration: 001 - Initial Schema
-- M. Liang Realty
-- Safe to re-run: uses IF NOT EXISTS and DROP ... IF EXISTS guards
-- ============================================================================

BEGIN;

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ============================================================================
-- MLIANGLISTINGS (existing table — add RLS policies only)
-- ============================================================================

-- Public site and admin both need to read listings.
-- anon role = public visitors and server-side fetches using the anon key.
ALTER TABLE mlianglistings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_listings" ON mlianglistings;
CREATE POLICY "public_read_listings"
  ON mlianglistings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_write_listings" ON mlianglistings;
CREATE POLICY "authenticated_write_listings"
  ON mlianglistings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to update the featured column (admin uses anon key with sessionStorage auth)
DROP POLICY IF EXISTS "anon_update_featured_listings" ON mlianglistings;
CREATE POLICY "anon_update_featured_listings"
  ON mlianglistings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- LEADS (already exists — only add missing columns and policies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (char_length(full_name) <= 100),
  contact_number TEXT NOT NULL CHECK (contact_number ~ '^09[0-9]{9}$'),
  email TEXT NOT NULL CHECK (char_length(email) <= 150),
  property_of_interest TEXT CHECK (char_length(property_of_interest) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add optional columns if they don't exist yet
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- RLS — drop first so re-runs don't error
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert" ON leads;
-- (remove old name if it existed from a previous attempt)

DROP POLICY IF EXISTS "authenticated_all_leads" ON leads;
CREATE POLICY "authenticated_all_leads"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- WEBSITE CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'html', 'json')),
  content_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_content" ON website_content;
CREATE POLICY "public_read_active_content"
  ON website_content FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "authenticated_all_content" ON website_content;
CREATE POLICY "authenticated_all_content"
  ON website_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_public_settings" ON system_settings;
CREATE POLICY "public_read_public_settings"
  ON system_settings FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "authenticated_all_settings" ON system_settings;
CREATE POLICY "authenticated_all_settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_website_content_updated_at ON website_content;
CREATE TRIGGER trg_website_content_updated_at
  BEFORE UPDATE ON website_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
