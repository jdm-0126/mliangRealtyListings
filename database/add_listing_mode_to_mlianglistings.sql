-- Add Listing Mode column to listings
-- Run this in the Supabase SQL editor to enable storing For Sale / For Rent

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS "Listing Mode" TEXT NOT NULL DEFAULT 'For Sale'
  CHECK ("Listing Mode" IN ('For Sale', 'For Rent'));

-- Backfill existing rows: detect [FOR RENT] tag in Notes
UPDATE listings
  SET "Listing Mode" = 'For Rent'
  WHERE "Notes" ILIKE '[FOR RENT]%';
