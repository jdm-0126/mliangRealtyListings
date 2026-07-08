-- ============================================================================
-- Migration: 20260102000009 - Add index on "Property ID" for sort performance
--
-- Every admin page and public listing page orders by "Property ID" DESC.
-- Without an index, each query does a full sequential scan which causes
-- statement timeouts on larger tables.
-- ============================================================================

BEGIN;

-- B-tree index on "Property ID" — covers ORDER BY "Property ID" DESC queries
CREATE INDEX IF NOT EXISTS idx_mlianglistings_property_id
  ON mlianglistings ("Property ID" DESC);

-- Composite index used by the tenant-scoped query that also filters by tenant_id
CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_property_id
  ON mlianglistings (tenant_id, "Property ID" DESC);

-- Composite index used by all active-status filters on the public site
CREATE INDEX IF NOT EXISTS idx_mlianglistings_tenant_status_property_id
  ON mlianglistings (tenant_id, "Status", "Property ID" DESC);

COMMIT;
