-- Run this in Supabase SQL editor
-- Sets up GalleryMliang table with correct columns and anon RLS policies

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

-- Enable RLS
ALTER TABLE "GalleryMliang" ENABLE ROW LEVEL SECURITY;

-- anon can read all
DROP POLICY IF EXISTS "anon_select_gallery" ON "GalleryMliang";
CREATE POLICY "anon_select_gallery" ON "GalleryMliang" FOR SELECT TO anon USING (true);

-- anon can insert
DROP POLICY IF EXISTS "anon_insert_gallery" ON "GalleryMliang";
CREATE POLICY "anon_insert_gallery" ON "GalleryMliang" FOR INSERT TO anon WITH CHECK (true);

-- anon can update
DROP POLICY IF EXISTS "anon_update_gallery" ON "GalleryMliang";
CREATE POLICY "anon_update_gallery" ON "GalleryMliang" FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- anon can delete
DROP POLICY IF EXISTS "anon_delete_gallery" ON "GalleryMliang";
CREATE POLICY "anon_delete_gallery" ON "GalleryMliang" FOR DELETE TO anon USING (true);
