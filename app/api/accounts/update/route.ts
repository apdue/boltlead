import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log('Updating account data:', JSON.stringify(data));
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Only update the fields that are provided
    const updateData: Record<string, any> = {};
    
    if (data.name) updateData.name = data.name;
    if (data.appId) updateData.app_id = data.appId;
    if (data.appSecret) updateData.app_secret = data.appSecret;
    if (data.shortLivedToken) updateData.short_lived_token = data.shortLivedToken;
    if (data.longLivedToken) updateData.long_lived_token = data.longLivedToken;
    if (data.longLivedTokenExpiry) updateData.long_lived_token_expiry = data.longLivedTokenExpiry;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the account
    const { error: updateError } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', data.id);
    
    if (updateError) {
      console.error('Error updating account:', updateError);
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }
    
    console.log('Account updated successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account', message: error.message },
      { status: 500 }
    );
  }
} 