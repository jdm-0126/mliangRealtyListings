-- Create facebook_posts table to store saved Facebook post data
CREATE TABLE IF NOT EXISTS facebook_posts (
  id SERIAL PRIMARY KEY,
  property_id INTEGER,
  messenger_name TEXT NOT NULL,
  location TEXT,
  price TEXT,
  size TEXT,
  facebook_url TEXT,
  messenger_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on property_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_facebook_posts_property_id ON facebook_posts(property_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_facebook_posts_created_at ON facebook_posts(created_at DESC);

-- Add comment to table
COMMENT ON TABLE facebook_posts IS 'Stores Facebook post data with contact person messenger name, location, price, and size';
