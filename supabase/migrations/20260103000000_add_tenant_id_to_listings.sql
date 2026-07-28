-- Migration: add tenant_id to listings
-- tenant 1 = mliang (default)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- Back-fill any existing rows
UPDATE listings SET tenant_id = 1 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_id ON listings(tenant_id);
