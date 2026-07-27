-- Migration: allow anon INSERT and DELETE on listings
-- The admin panel uses the anon key with sessionStorage-based auth,
-- so we need explicit policies for write operations.

DROP POLICY IF EXISTS "anon_insert_listings" ON listings;
CREATE POLICY "anon_insert_listings"
  ON listings FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON listings;
CREATE POLICY "anon_delete_listings"
  ON listings FOR DELETE
  TO anon
  USING (true);
