-- ============================================================================
-- Migration: 20260103000004 - bookings + projects tables
-- ============================================================================

BEGIN;

-- ── projects ────────────────────────────────────────────────────────────────
-- Stores developer projects shown in the booking form dropdown.
-- Full project detail DB (map, commission, inventory) lives here for later.
CREATE TABLE IF NOT EXISTS projects (
  id                  BIGSERIAL   PRIMARY KEY,
  tenant_id           INTEGER     NOT NULL DEFAULT 1,
  name                TEXT        NOT NULL,
  developer           TEXT,
  area                TEXT,                        -- e.g. "San Fernando, Pampanga"
  map_url             TEXT,
  commission_scheme   TEXT,                        -- e.g. "5% on net selling price"
  contact_number      TEXT,
  available_inventory INTEGER,
  status              TEXT        NOT NULL DEFAULT 'Active'
                                  CHECK (status IN ('Active', 'Sold Out', 'Coming Soon', 'Draft')),
  is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_status    ON projects (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_featured  ON projects (tenant_id, is_featured) WHERE is_featured = TRUE;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_projects" ON projects;
CREATE POLICY "public_read_active_projects"
  ON projects FOR SELECT TO anon, authenticated
  USING (status != 'Draft');

DROP POLICY IF EXISTS "anon_write_projects" ON projects;
CREATE POLICY "anon_write_projects"
  ON projects FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ── bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                  BIGSERIAL   PRIMARY KEY,
  tenant_id           INTEGER     NOT NULL DEFAULT 1,
  full_name           TEXT        NOT NULL CHECK (char_length(full_name) <= 100),
  contact_number      TEXT        NOT NULL CHECK (contact_number ~ '^09[0-9]{9}$'),
  email               TEXT        NOT NULL CHECK (char_length(email) <= 150),
  preferred_date      DATE        NOT NULL,
  preferred_time      TEXT        NOT NULL,         -- e.g. "10:00 AM"
  interest_type       TEXT        NOT NULL DEFAULT 'listing'
                                  CHECK (interest_type IN ('listing', 'project')),
  property_interest   TEXT,                         -- free-text or listing address
  project_id          BIGINT      REFERENCES projects(id) ON DELETE SET NULL,
  message             TEXT        CHECK (char_length(message) <= 1000),
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date    ON bookings (preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant  ON bookings (tenant_id, preferred_date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_bookings" ON bookings;
CREATE POLICY "authenticated_all_bookings"
  ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_bookings" ON bookings;
CREATE POLICY "anon_all_bookings"
  ON bookings FOR ALL TO anon USING (true) WITH CHECK (true);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
