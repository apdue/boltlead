# Migrating from JSON to Supabase

This document provides instructions for migrating account data from the local JSON file to Supabase.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Set up the required tables in Supabase

## Setting up Supabase Tables

Execute the following SQL in the Supabase SQL Editor to create the necessary tables:

```sql
-- Create accounts table
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  short_lived_token TEXT NOT NULL,
  long_lived_token TEXT,
  long_lived_token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create current_account table (single row table)
CREATE TABLE current_account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_accounts_modtime
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pages_modtime
BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
```

## Environment Configuration

1. Get your Supabase URL and anon key from your Supabase project settings
2. Update the `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Migration

1. Install the required dependencies:
   ```
   npm install
   ```

2. Run the migration script:
   ```
   npm run migrate-to-supabase
   ```

3. Verify the data in Supabase:
   - Go to your Supabase project
   - Navigate to the Table Editor
   - Check that the `accounts`, `pages`, and `current_account` tables contain the migrated data

## Troubleshooting

If you encounter any issues during migration:

1. Check the console output for error messages
2. Verify your Supabase credentials in `.env.local`
3. Ensure your Supabase tables are set up correctly
4. Check that your JSON data in `data/accounts.json` is valid

## Reverting to JSON Storage

If you need to revert to using JSON storage:

1. Restore the original API files from version control
2. Remove the Supabase environment variables from `.env.local` 