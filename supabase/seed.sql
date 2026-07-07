-- ============================================================================
-- M. Liang Realty Supabase Seed Data
-- ============================================================================
-- This seed file creates sample data for development and testing
-- Run: psql -h <host> -U postgres -d <database> -f supabase/seed.sql
-- Or use Supabase CLI: supabase db reset (includes seeds)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. USERS & ROLES
-- ============================================================================

-- Create roles table (if not exists via migration)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table (if not exists via migration)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- In production, use proper auth (Supabase Auth)
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (id, name, description, permissions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'superadmin', 'Full system access', '["*"]'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'broker', 'Broker access - manage properties and agents', '["properties.*", "agents.read", "leads.*", "settings.read"]'::jsonb),
  ('00000000-0000-0000-0000-000000000003', 'agent', 'Agent access - view properties and leads', '["properties.read", "leads.read"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Seed users
-- NOTE: In production, use Supabase Auth and proper password hashing
-- These are placeholder hashes for development only
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'jn16h7@gmail.com',
    '$2a$10$dummyhashfordev.EuandaiteD_0126', -- Superadmin password: EuandaiteD_0126
    'Superadmin User',
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'broker@realtyprov1.com',
    '$2a$10$dummyhashfordev.brokerMliangAdmin2026', -- Broker password: brokerMliangAdmin2026
    'M. Liang',
    '00000000-0000-0000-0000-000000000002',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'agent@realtyprov1.com',
    '$2a$10$dummyhashfordev.brokerMliangAdmin2026', -- Agent password: brokerMliangAdmin2026
    'Agent User',
    '00000000-0000-0000-0000-000000000003',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Whether visible on public site
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
  (
    'business_info',
    '{
      "businessName": "M. Liang Realty",
      "brokerName": "M. Liang",
      "brokerTitle": "Licensed Real Estate Broker",
      "prcNumber": "0019653",
      "officeAddress": "S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga",
      "contactNumber": "09393440944",
      "emailAddress": "contact@realtyprov1.com"
    }'::jsonb,
    'Primary business information',
    TRUE
  ),
  (
    'social_media',
    '{
      "facebook": "https://facebook.com/mliangRealty",
      "instagram": "https://instagram.com/mliangRealty",
      "tiktok": "",
      "youtube": "",
      "viber": "viber://contact?number=09393440944",
      "whatsapp": "https://wa.me/639393440944"
    }'::jsonb,
    'Social media profile URLs',
    TRUE
  ),
  (
    'site_meta',
    '{
      "siteTitle": "M. Liang Realty – Houses, Lots & Condos in Pampanga",
      "siteDescription": "Browse house and lot, commercial properties, and lot-only listings in Pampanga. M. Liang Realty, licensed broker PRC No. 0019653.",
      "ogImage": "/og-image.svg",
      "canonicalUrl": "https://realtyprov1.com"
    }'::jsonb,
    'SEO and site metadata',
    TRUE
  ),
  (
    'feature_flags',
    '{
      "enableChatWidget": true,
      "enablePropertySearch": true,
      "enableLeadCapture": true,
      "maintenanceMode": false
    }'::jsonb,
    'Feature toggles',
    FALSE
  )
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 3. CONTACT MESSAGES (from InquiryForm on public site)
-- ============================================================================

-- Ensure leads table exists (created in design doc)
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (char_length(full_name) <= 100),
  contact_number TEXT NOT NULL CHECK (contact_number ~ '^09[0-9]{9}$'),
  email TEXT NOT NULL CHECK (char_length(email) <= 150),
  property_of_interest TEXT CHECK (char_length(property_of_interest) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) <= 1000),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam')),
  notes TEXT, -- Internal notes by staff
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed sample contact messages/leads
INSERT INTO leads (full_name, contact_number, email, property_of_interest, message, status) VALUES
  (
    'Juan Dela Cruz',
    '09171234567',
    'juan.delacruz@example.com',
    'House and Lot in San Fernando',
    'Good day! I am interested in a 3-bedroom house and lot in San Fernando area. Budget is around 3-4M. Can you send me available listings? Thank you!',
    'new'
  ),
  (
    'Maria Santos',
    '09281234567',
    'maria.santos@example.com',
    'Lot Only in Angeles City',
    'Looking for a 100-150 sqm lot in Angeles City for future construction. Budget: 2M-3M.',
    'contacted'
  ),
  (
    'Pedro Reyes',
    '09391234567',
    'pedro.reyes@example.com',
    'Commercial Property near Clark',
    'Interested in commercial properties near Clark Freeport Zone for a restaurant business. Please send available listings.',
    'new'
  ),
  (
    'Anna Mendoza',
    '09451234567',
    'anna.mendoza@example.com',
    NULL,
    'Hi! Can you help me find a townhouse in Mabalacat? Budget is 2.5M. Thank you!',
    'new'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. WEBSITE CONTENT (for CMS-like content blocks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE, -- e.g., 'hero_tagline', 'services_intro'
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'html', 'json')),
  content_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed website content blocks
INSERT INTO website_content (section_key, content_type, content_value, is_active, display_order) VALUES
  (
    'hero_title',
    'text',
    'M. Liang Realty',
    TRUE,
    1
  ),
  (
    'hero_tagline',
    'text',
    'Your trusted partner for properties in Pampanga',
    TRUE,
    2
  ),
  (
    'services_intro',
    'text',
    'What we offer to buyers and investors in Pampanga',
    TRUE,
    3
  ),
  (
    'service_1_title',
    'text',
    'Property Sales',
    TRUE,
    4
  ),
  (
    'service_1_description',
    'html',
    '<p>We specialize in house and lot sales as well as commercial properties across Pampanga. Whether you are looking for a family home, a townhouse, or an investment commercial space, we have options suited to your budget and needs.</p>',
    TRUE,
    5
  ),
  (
    'service_2_title',
    'text',
    'Rental Properties',
    TRUE,
    6
  ),
  (
    'service_2_description',
    'html',
    '<p>Looking for a place to rent in Pampanga? We offer a variety of residential rental units including houses, apartments, and condominiums in San Fernando and surrounding areas — perfect for individuals, families, and business professionals.</p>',
    TRUE,
    7
  ),
  (
    'service_3_title',
    'text',
    'Lot Sales',
    TRUE,
    8
  ),
  (
    'service_3_description',
    'html',
    '<p>Build the home of your dreams on your terms. We offer lot-only properties in prime locations across Pampanga, giving you the freedom to design and construct a custom home that perfectly suits your lifestyle and vision.</p>',
    TRUE,
    9
  ),
  (
    'footer_tagline',
    'text',
    'Your trusted partner for properties in Pampanga',
    TRUE,
    10
  )
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================================
-- 5. PROPERTY LISTING SAMPLE DATA (seed a few listings for testing)
-- ============================================================================

-- Note: The project uses an existing mlianglistings table with specific column names
-- This seed adds a few test properties if the table exists

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mlianglistings') THEN
    INSERT INTO mlianglistings (
      "Type", "Location", "Village", "Listing Price", "Lot Area sqm", 
      "Floor Area sqm", "Bedroom", "Bathroom", "Notes", "Status", "Preview Photo"
    ) VALUES
      (
        'House & Lot',
        'San Fernando',
        'Villa Mercedes Subdivision',
        3500000,
        120,
        80,
        3,
        2,
        'Beautiful 3-bedroom house and lot in a peaceful subdivision. Near schools, malls, and main roads. Perfect for families.',
        'active',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
      ),
      (
        'Lot Only',
        'Angeles City',
        'Clark Residential Area',
        2800000,
        150,
        NULL,
        NULL,
        NULL,
        'Prime 150 sqm residential lot in Clark area. Clean title, ready for construction. Great investment opportunity.',
        'active',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
      ),
      (
        'Commercial',
        'Mabalacat',
        'McArthur Highway',
        8500000,
        200,
        180,
        NULL,
        2,
        'Commercial building along McArthur Highway. High traffic area, suitable for restaurant or retail business.',
        'active',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Public read access to system_settings where is_public = true
DROP POLICY IF EXISTS "Public settings are viewable by anyone" ON system_settings;
CREATE POLICY "Public settings are viewable by anyone"
  ON system_settings FOR SELECT
  USING (is_public = TRUE);

-- Admin full access to system_settings
DROP POLICY IF EXISTS "Admins have full access to system_settings" ON system_settings;
CREATE POLICY "Admins have full access to system_settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'authenticated'); -- Adjust based on your auth setup

-- Allow anonymous insert on leads (public inquiry form)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public lead insertion" ON leads;
CREATE POLICY "Allow public lead insertion"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin read/update access to leads
DROP POLICY IF EXISTS "Admins can view and manage leads" ON leads;
CREATE POLICY "Admins can view and manage leads"
  ON leads FOR ALL
  USING (auth.role() = 'authenticated'); -- Adjust based on your auth setup

-- Public read access to website_content where is_active = true
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active website content is viewable by anyone" ON website_content;
CREATE POLICY "Active website content is viewable by anyone"
  ON website_content FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- 7. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', tbl, tbl);
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    ', tbl, tbl);
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
-- Run SELECT count(*) FROM users, roles, leads, system_settings, website_content;
-- to verify seed data was inserted successfully.
-- ============================================================================
