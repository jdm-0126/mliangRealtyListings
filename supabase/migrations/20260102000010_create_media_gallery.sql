-- ============================================================================
-- Migration: 20260102000010 - Create media_gallery table
--
-- Stores metadata for images uploaded to Cloudinary.
-- Used for: property photo galleries, events/news featured images.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS media_gallery (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenant_registry(tenant_id) ON DELETE CASCADE,
  -- 'property' | 'event' | 'general'
  category    TEXT        NOT NULL DEFAULT 'general'
                          CHECK (category IN ('property', 'event', 'general')),
  title       TEXT,
  description TEXT,
  -- Cloudinary fields
  cloudinary_public_id  TEXT NOT NULL,
  cloudinary_url        TEXT NOT NULL,
  cloudinary_secure_url TEXT NOT NULL,
  width       INTEGER,
  height      INTEGER,
  format      TEXT,
  bytes       INTEGER,
  -- Optional FK to a listing (for property photos)
  listing_id  INTEGER,
  -- Whether to feature on the public homepage (events/news section)
  is_featured BOOLEAN     NOT NULL DEFAULT false,
  display_order INTEGER   NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_gallery_tenant_id
  ON media_gallery (tenant_id);

CREATE INDEX IF NOT EXISTS idx_media_gallery_category
  ON media_gallery (tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_media_gallery_featured
  ON media_gallery (tenant_id, is_featured, display_order)
  WHERE is_featured = true;

-- RLS
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;

-- Public can read featured gallery items
DROP POLICY IF EXISTS "public_read_featured_gallery" ON media_gallery;
CREATE POLICY "public_read_featured_gallery"
  ON media_gallery FOR SELECT
  TO anon
  USING (
    is_featured = true
    AND tenant_id = COALESCE(
      current_setting('app.current_tenant', true)::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
    AND tenant_id != '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Authenticated (admin/broker) has full access within their tenant
DROP POLICY IF EXISTS "tenant_isolation_gallery" ON media_gallery;
CREATE POLICY "tenant_isolation_gallery"
  ON media_gallery FOR ALL
  TO authenticated
  USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant', true)::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
    AND tenant_id != '00000000-0000-0000-0000-000000000000'::uuid
  )
  WITH CHECK (
    tenant_id = COALESCE(
      current_setting('app.current_tenant', true)::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
    AND tenant_id != '00000000-0000-0000-0000-000000000000'::uuid
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_media_gallery_updated_at ON media_gallery;
CREATE TRIGGER trg_media_gallery_updated_at
  BEFORE UPDATE ON media_gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
