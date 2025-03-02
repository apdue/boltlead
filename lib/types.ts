export interface Page {
  id: string;
  name: string;
  access_token: string;
  account_id: string; // Foreign key to accounts table
}

export interface Account {
  id: string;
  name: string;
  app_id: string;
  app_secret: string;
  short_lived_token: string;
  long_lived_token: string;
  long_lived_token_expiry: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentAccount {
  id: string;
  account_id: string;
  last_updated: string;
}

// Database schema types
export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Account, 'created_at' | 'updated_at'>>;
      };
      pages: {
        Row: Page;
        Insert: Page;
        Update: Partial<Page>;
      };
      current_account: {
        Row: CurrentAccount;
        Insert: CurrentAccount;
        Update: Partial<CurrentAccount>;
      };
    };
  };
}; 