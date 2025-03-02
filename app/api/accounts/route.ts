import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Account } from '@/lib/types';

export async function GET() {
  try {
    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*');
    
    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }
    
    // Get current account ID
    const { data: currentAccountData, error: currentAccountError } = await supabase
      .from('current_account')
      .select('*')
      .eq('id', '1')
      .single();
    
    if (currentAccountError && currentAccountError.code !== 'PGRST116') {
      console.error('Error fetching current account:', currentAccountError);
    }
    
    // Get pages for each account
    for (const account of accounts || []) {
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('account_id', account.id);
      
      if (pagesError) {
        console.error(`Error fetching pages for account ${account.id}:`, pagesError);
      } else {
        account.pages = pages || [];
      }
    }
    
    return NextResponse.json({
      accounts: accounts || [],
      currentAccountId: currentAccountData?.account_id || (accounts && accounts.length > 0 ? accounts[0].id : ''),
      lastUpdated: currentAccountData?.last_updated || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received account data:', JSON.stringify(data));
    
    if (!data.id || !data.name || !data.appId || !data.appSecret || !data.shortLivedToken) {
      console.error('Missing required fields:', {
        hasId: !!data.id,
        hasName: !!data.name,
        hasAppId: !!data.appId,
        hasAppSecret: !!data.appSecret,
        hasToken: !!data.shortLivedToken
      });
      
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert from camelCase to snake_case for Supabase
    const accountData: Omit<Account, 'created_at' | 'updated_at'> = {
      id: data.id,
      name: data.name,
      app_id: data.appId,
      app_secret: data.appSecret,
      short_lived_token: data.shortLivedToken,
      long_lived_token: data.longLivedToken || '',
      long_lived_token_expiry: data.longLivedTokenExpiry || new Date().toISOString(),
    };
    
    // Insert or update account
    const { error: accountError } = await supabase
      .from('accounts')
      .upsert(accountData, { onConflict: 'id' });
    
    if (accountError) {
      console.error('Error inserting/updating account:', accountError);
      throw new Error('Failed to save account to database');
    }
    
    // Check if this is the first account or if no current account is set
    const { data: currentAccountData, error: currentAccountError } = await supabase
      .from('current_account')
      .select('*')
      .eq('id', '1')
      .single();
    
    const { count, error: countError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting accounts:', countError);
    }
    
    // Set as current account if it's the first one or if no current account is set
    if (count === 1 || (!currentAccountData && !currentAccountError)) {
      const { error: setCurrentError } = await supabase
        .from('current_account')
        .upsert({
          id: '1',
          account_id: data.id,
          last_updated: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (setCurrentError) {
        console.error('Error setting current account:', setCurrentError);
      }
    }
    
    console.log('Account saved successfully');
    return NextResponse.json({ success: true, account: data });
  } catch (error: any) {
    console.error('Error adding/updating account:', error);
    return NextResponse.json(
      { error: 'Failed to add/update account', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Deleting account with ID: ${accountId}`);
    
    // First, delete all pages associated with this account
    const { error: pagesDeleteError } = await supabase
      .from('pages')
      .delete()
      .eq('account_id', accountId);
    
    if (pagesDeleteError) {
      console.error(`Error deleting pages for account ${accountId}:`, pagesDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete account pages' },
        { status: 500 }
      );
    }
    
    // Then delete the account itself
    const { error: accountDeleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);
    
    if (accountDeleteError) {
      console.error(`Error deleting account ${accountId}:`, accountDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }
    
    // Check if the deleted account was the current account
    const { data: currentAccountData, error: currentAccountError } = await supabase
      .from('current_account')
      .select('*')
      .eq('id', '1')
      .single();
    
    if (!currentAccountError && currentAccountData?.account_id === accountId) {
      // Get the first available account to set as current
      const { data: remainingAccounts, error: remainingAccountsError } = await supabase
        .from('accounts')
        .select('id')
        .limit(1);
      
      if (!remainingAccountsError && remainingAccounts && remainingAccounts.length > 0) {
        // Set a new current account
        const { error: updateCurrentError } = await supabase
          .from('current_account')
          .update({ 
            account_id: remainingAccounts[0].id,
            last_updated: new Date().toISOString()
          })
          .eq('id', '1');
        
        if (updateCurrentError) {
          console.error('Error updating current account after deletion:', updateCurrentError);
        }
      } else {
        // No accounts left, clear the current account
        const { error: clearCurrentError } = await supabase
          .from('current_account')
          .delete()
          .eq('id', '1');
        
        if (clearCurrentError) {
          console.error('Error clearing current account after deletion:', clearCurrentError);
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', message: error.message },
      { status: 500 }
    );
  }
}