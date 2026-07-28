-- ============================================================================
-- Migration: 002 - Add featured column to listings
-- Allows admins to pin specific listings to the public homepage
-- ============================================================================

-- Add featured column (defaults to false — no existing listing is featured)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast featured-only queries on the public homepage
CREATE INDEX IF NOT EXISTS idx_mlianglistings_featured
  ON listings (featured)
  WHERE featured = TRUE;
