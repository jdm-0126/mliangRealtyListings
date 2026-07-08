-- Migration: allow anon INSERT and DELETE on mlianglistings
-- The admin panel uses the anon key with sessionStorage-based auth,
-- so we need explicit policies for write operations.

DROP POLICY IF EXISTS "anon_insert_listings" ON mlianglistings;
CREATE POLICY "anon_insert_listings"
  ON mlianglistings FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON mlianglistings;
CREATE POLICY "anon_delete_listings"
  ON mlianglistings FOR DELETE
  TO anon
  USING (true);
