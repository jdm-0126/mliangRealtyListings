-- Add Preview Photo column to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS "Preview Photo" TEXT;

-- Add a comment to the column
COMMENT ON COLUMN listings."Preview Photo" IS 'Featured preview/thumbnail photo URL or base64 encoded image for property card display';
