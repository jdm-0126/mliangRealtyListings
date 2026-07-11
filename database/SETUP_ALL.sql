-- ============================================================================
-- SETUP_ALL.sql — M. Liang Realty
-- Run this once in the Supabase SQL editor to set up the full schema.
-- Safe to re-run: all statements use IF NOT EXISTS / DROP ... IF EXISTS guards.
-- Order matters — tables are created before their dependents.
-- ============================================================================


-- ============================================================================
-- 1. ROLES & USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- 2. BROKERS & AGENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS brokers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  role TEXT NOT NULL DEFAULT 'Broker',
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_email ON brokers(email);
CREATE INDEX IF NOT EXISTS idx_brokers_status ON brokers(status);

ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_brokers" ON brokers;
CREATE POLICY "anon_all_brokers"
  ON brokers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_brokers" ON brokers;
CREATE POLICY "authenticated_all_brokers"
  ON brokers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS agents (
  id BIGSERIAL PRIMARY KEY,
  broker_id BIGINT REFERENCES brokers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  license_number TEXT,
  profile_photo TEXT,
  bio TEXT,
  specialization TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_broker_id ON agents(broker_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_agents" ON agents;
CREATE POLICY "anon_all_agents"
  ON agents FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_agents" ON agents;
CREATE POLICY "authenticated_all_agents"
  ON agents FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 3. PASSWORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_passwords (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT REFERENCES agents(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_passwords (
  id BIGSERIAL PRIMARY KEY,
  password_type TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_passwords_agent_id ON agent_passwords(agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_passwords_type ON shared_passwords(password_type);

ALTER TABLE agent_passwords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_agent_passwords" ON agent_passwords;
CREATE POLICY "anon_all_agent_passwords"
  ON agent_passwords FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE shared_passwords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_shared_passwords" ON shared_passwords;
CREATE POLICY "anon_all_shared_passwords"
  ON shared_passwords FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO shared_passwords (password_type, password_hash, created_by) VALUES
  ('agent',      'agentMliangRealty2026',  'system'),
  ('broker',     'brokerMliangAdmin2026',  'system'),
  ('superadmin', 'EuandaiteD_0126',        'system')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 4. MLIANGLISTINGS — columns, RLS, indexes
-- ============================================================================

-- Extra columns (table itself is pre-existing in Supabase)
ALTER TABLE mlianglistings ADD COLUMN IF NOT EXISTS featured       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mlianglistings ADD COLUMN IF NOT EXISTS "Preview Photo" TEXT;
ALTER TABLE mlianglistings ADD COLUMN IF NOT EXISTS "Listing Mode"  TEXT NOT NULL DEFAULT 'For Sale'
  CHECK ("Listing Mode" IN ('For Sale', 'For Rent'));
ALTER TABLE mlianglistings ADD COLUMN IF NOT EXISTS tenant_id      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE mlianglistings ADD COLUMN IF NOT EXISTS "Map URL"      TEXT;

-- Back-fill
UPDATE mlianglistings SET tenant_id = 1      WHERE tenant_id IS NULL;
UPDATE mlianglistings SET "Listing Mode" = 'For Rent' WHERE "Notes" ILIKE '[FOR RENT]%';

-- RLS
ALTER TABLE mlianglistings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_listings"        ON mlianglistings;
CREATE POLICY "public_read_listings"
  ON mlianglistings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_write_listings" ON mlianglistings;
CREATE POLICY "authenticated_write_listings"
  ON mlianglistings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_featured_listings" ON mlianglistings;
CREATE POLICY "anon_update_featured_listings"
  ON mlianglistings FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_listings" ON mlianglistings;
CREATE POLICY "anon_insert_listings"
  ON mlianglistings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON mlianglistings;
CREATE POLICY "anon_delete_listings"
  ON mlianglistings FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mlianglistings_featured
  ON mlianglistings (featured) WHERE featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_id
  ON mlianglistings (tenant_id);

CREATE INDEX IF NOT EXISTS idx_mlianglistings_property_id
  ON mlianglistings ("property_id" DESC);

CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_property_id
  ON mlianglistings (tenant_id, "property_id" DESC);

CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_status_property_id
  ON mlianglistings (tenant_id, "Status", "property_id" DESC);


-- ============================================================================
-- 5. LEADS
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

ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert"    ON leads;
DROP POLICY IF EXISTS "anon_insert_leads"      ON leads;
CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_leads" ON leads;
CREATE POLICY "authenticated_all_leads"
  ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 6. FACEBOOK POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS facebook_posts (
  id SERIAL PRIMARY KEY,
  property_id INTEGER,
  messenger_name TEXT NOT NULL,
  location TEXT,
  price TEXT,
  size TEXT,
  facebook_url TEXT,
  messenger_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facebook_posts_property_id ON facebook_posts(property_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_created_at  ON facebook_posts(created_at DESC);


-- ============================================================================
-- 7. SOLD PROPERTIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sold_properties (
  id BIGSERIAL PRIMARY KEY,
  property_id INTEGER,
  property_title TEXT NOT NULL,
  property_location TEXT,
  sale_price NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC DEFAULT 3.0,
  date_sold TIMESTAMPTZ NOT NULL,
  date_commission_received TIMESTAMPTZ,
  agent_name TEXT,
  broker_name TEXT,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sold_properties_date_sold ON sold_properties(date_sold DESC);
CREATE INDEX IF NOT EXISTS idx_sold_properties_status    ON sold_properties(status);
CREATE INDEX IF NOT EXISTS idx_sold_properties_agent     ON sold_properties(agent_name);


-- ============================================================================
-- 8. GALLERY (GalleryMliang)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GalleryMliang" (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID,
  category              TEXT        NOT NULL DEFAULT 'general'
                                    CHECK (category IN ('property', 'event', 'general')),
  title                 TEXT,
  description           TEXT,
  cloudinary_public_id  TEXT        NOT NULL,
  cloudinary_url        TEXT        NOT NULL,
  cloudinary_secure_url TEXT        NOT NULL,
  width                 INTEGER,
  height                INTEGER,
  format                TEXT,
  bytes                 INTEGER,
  listing_id            INTEGER,
  is_featured           BOOLEAN     NOT NULL DEFAULT false,
  display_order         INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "GalleryMliang" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery" ON "GalleryMliang";
CREATE POLICY "anon_select_gallery" ON "GalleryMliang" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_gallery" ON "GalleryMliang";
CREATE POLICY "anon_insert_gallery" ON "GalleryMliang" FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gallery" ON "GalleryMliang";
CREATE POLICY "anon_update_gallery" ON "GalleryMliang" FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gallery" ON "GalleryMliang";
CREATE POLICY "anon_delete_gallery" ON "GalleryMliang" FOR DELETE TO anon USING (true);


-- ============================================================================
-- 9. WEBSITE CONTENT & SYSTEM SETTINGS
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
  ON website_content FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "authenticated_all_content" ON website_content;
CREATE POLICY "authenticated_all_content"
  ON website_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
  ON system_settings FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS "authenticated_all_settings" ON system_settings;
CREATE POLICY "authenticated_all_settings"
  ON system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- 10. UPDATED_AT TRIGGER (shared function + per-table triggers)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_updated_at           ON roles;
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at            ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at            ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_website_content_updated_at  ON website_content;
CREATE TRIGGER trg_website_content_updated_at
  BEFORE UPDATE ON website_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at  ON system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
