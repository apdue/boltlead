import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabase';
import { Account, Page, CurrentAccount } from '../lib/types';

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
      const supabaseAccount: Omit<Account, 'created_at' | 'updated_at'> = {
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
          const supabasePage: Page = {
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
      const currentAccount: CurrentAccount = {
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