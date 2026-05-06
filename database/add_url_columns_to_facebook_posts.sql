-- Add facebook_url and messenger_url columns to facebook_posts table
-- Run this if you already created the table without these columns

ALTER TABLE facebook_posts 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS messenger_url TEXT;

-- Add comments
COMMENT ON COLUMN facebook_posts.facebook_url IS 'URL to the Facebook post or marketplace listing';
COMMENT ON COLUMN facebook_posts.messenger_url IS 'Messenger URL of the listing owner';
