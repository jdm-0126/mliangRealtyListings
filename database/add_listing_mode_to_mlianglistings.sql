-- Add Listing Mode column to mlianglistings
-- Run this in the Supabase SQL editor to enable storing For Sale / For Rent

ALTER TABLE mlianglistings
  ADD COLUMN IF NOT EXISTS "Listing Mode" TEXT NOT NULL DEFAULT 'For Sale'
  CHECK ("Listing Mode" IN ('For Sale', 'For Rent'));

-- Backfill existing rows: detect [FOR RENT] tag in Notes
UPDATE mlianglistings
  SET "Listing Mode" = 'For Rent'
  WHERE "Notes" ILIKE '[FOR RENT]%';
