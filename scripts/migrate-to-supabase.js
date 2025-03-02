const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrpubbbxcsiufesehalk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHViYmJ4Y3NpdWZlc2VoYWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MDkxMzcsImV4cCI6MjA1NjM4NTEzN30.OkXVO3YpTJhVOwBF_zXrqXa_N1ot4uQBy44asiDsjII';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateToSupabase() {
  try {
    console.log('Starting migration to Supabase...');
    
    // Read the accounts.json file
    const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');
    const fileContent = fs.readFileSync(accountsFilePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data.accounts || !Array.isArray(data.accounts)) {
      throw new Error('Invalid accounts data format');
    }
    
    console.log(`Found ${data.accounts.length} accounts to migrate`);
    
    // Migrate accounts
    for (const account of data.accounts) {
      const supabaseAccount = {
        id: account.id,
        name: account.name,
        app_id: account.appId,
        app_secret: account.appSecret,
        short_lived_token: account.shortLivedToken,
        long_lived_token: account.longLivedToken || '',
        long_lived_token_expiry: account.longLivedTokenExpiry || new Date().toISOString(),
      };
      
      // Insert account into Supabase
      const { error: accountError } = await supabase
        .from('accounts')
        .upsert(supabaseAccount, { onConflict: 'id' });
      
      if (accountError) {
        console.error(`Error inserting account ${account.id}:`, accountError);
        continue;
      }
      
      console.log(`Migrated account: ${account.name} (${account.id})`);
      
      // Migrate pages for this account
      if (account.pages && Array.isArray(account.pages)) {
        for (const page of account.pages) {
          const supabasePage = {
            id: page.id,
            name: page.name,
            access_token: page.access_token,
            account_id: account.id,
          };
          
          // Insert page into Supabase
          const { error: pageError } = await supabase
            .from('pages')
            .upsert(supabasePage, { onConflict: 'id' });
          
          if (pageError) {
            console.error(`Error inserting page ${page.id}:`, pageError);
            continue;
          }
          
          console.log(`Migrated page: ${page.name} (${page.id})`);
        }
      }
    }
    
    // Migrate current account setting
    if (data.currentAccountId) {
      const currentAccount = {
        id: '1', // Single record for current account
        account_id: data.currentAccountId,
        last_updated: data.lastUpdated || new Date().toISOString(),
      };
      
      const { error: currentAccountError } = await supabase
        .from('current_account')
        .upsert(currentAccount, { onConflict: 'id' });
      
      if (currentAccountError) {
        console.error('Error setting current account:', currentAccountError);
      } else {
        console.log(`Set current account to: ${data.currentAccountId}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateToSupabase(); 