import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Check if account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .single();
    
    if (accountError || !account) {
      console.error('Error checking account existence:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Set current account
    const { error: updateError } = await supabase
      .from('current_account')
      .upsert({
        id: '1', // Single record for current account
        account_id: accountId,
        last_updated: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (updateError) {
      console.error('Error updating current account:', updateError);
      return NextResponse.json(
        { error: 'Failed to set current account' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, currentAccountId: accountId });
  } catch (error) {
    console.error('Error setting current account:', error);
    return NextResponse.json(
      { error: 'Failed to set current account' },
      { status: 500 }
    );
  }
}