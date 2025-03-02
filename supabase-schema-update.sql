-- Run these commands in the Supabase SQL Editor to update the schema

-- 1. Add fb_page_id column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS fb_page_id TEXT;

-- 2. Copy existing page IDs to fb_page_id column
UPDATE pages SET fb_page_id = id WHERE fb_page_id IS NULL;

-- 3. Make fb_page_id NOT NULL
ALTER TABLE pages ALTER COLUMN fb_page_id SET NOT NULL;

-- 4. Create index on fb_page_id and account_id
CREATE INDEX IF NOT EXISTS idx_pages_fb_page_id_account_id ON pages (fb_page_id, account_id);

-- 5. Create a new table with UUID as primary key
CREATE TABLE pages_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fb_page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Copy data from old table to new table
INSERT INTO pages_new (id, fb_page_id, name, access_token, account_id, created_at, updated_at)
SELECT 
  uuid_generate_v4(), -- Generate new UUID for each row
  fb_page_id,
  name,
  access_token,
  account_id,
  created_at,
  updated_at
FROM pages;

-- 7. Drop old table and rename new table
DROP TABLE pages;
ALTER TABLE pages_new RENAME TO pages;

-- 8. Add trigger for updated_at
CREATE TRIGGER update_pages_modtime
BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 