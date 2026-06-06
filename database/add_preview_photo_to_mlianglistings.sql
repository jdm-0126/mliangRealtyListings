-- Add Preview Photo column to mlianglistings table
ALTER TABLE mlianglistings
ADD COLUMN IF NOT EXISTS "Preview Photo" TEXT;

-- Add a comment to the column
COMMENT ON COLUMN mlianglistings."Preview Photo" IS 'Featured preview/thumbnail photo URL or base64 encoded image for property card display';
