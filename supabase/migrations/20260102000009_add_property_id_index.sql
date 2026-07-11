-- ============================================================================
-- Migration: 20260102000009 - Add index on "property_id" for sort performance
--
-- Every admin page and public listing page orders by "property_id" DESC.
-- Without an index, each query does a full sequential scan which causes
-- statement timeouts on larger tables.
-- ============================================================================

BEGIN;

-- B-tree index on "property_id" — covers ORDER BY "property_id" DESC queries
CREATE INDEX IF NOT EXISTS idx_mlianglistings_property_id
  ON mlianglistings ("property_id" DESC);

-- Composite index used by the tenant-scoped query that also filters by tenant_id
CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_property_id
  ON mlianglistings (tenant_id, "property_id" DESC);

-- Composite index used by all active-status filters on the public site
CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_status_property_id
  ON mlianglistings (tenant_id, "Status", "property_id" DESC);

COMMIT;
