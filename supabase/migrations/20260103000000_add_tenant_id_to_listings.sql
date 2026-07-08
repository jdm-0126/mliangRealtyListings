-- Migration: add tenant_id to mlianglistings
-- tenant 1 = mliang (default)

ALTER TABLE mlianglistings
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- Back-fill any existing rows
UPDATE mlianglistings SET tenant_id = 1 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_id ON mlianglistings(tenant_id);
