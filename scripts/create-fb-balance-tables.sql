-- Create table for storing Facebook balance checker accounts
CREATE TABLE fb_balance_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  app_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updating the updated_at timestamp
CREATE TRIGGER update_fb_balance_accounts_modtime
  BEFORE UPDATE ON fb_balance_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Create index on ad_account_id for faster lookups
CREATE INDEX idx_fb_balance_accounts_ad_account ON fb_balance_accounts(ad_account_id);