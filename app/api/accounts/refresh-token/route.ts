import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function convertToLongLivedToken(appId: string, appSecret: string, shortLivedToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to exchange token');
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('Error converting to long-lived token:', error);
    throw new Error(`Failed to convert to long-lived token: ${error.message}`);
  }
}

async function getPageAccessTokens(userId: string, longLivedToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/accounts?access_token=${longLivedToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get page access tokens');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Error getting page access tokens:', error);
    throw new Error(`Failed to get page access tokens: ${error.message}`);
  }
}

export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Get account from Supabase
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Convert short-lived token to long-lived token
    const longLivedToken = await convertToLongLivedToken(
      account.app_id,
      account.app_secret,
      account.short_lived_token
    );
    
    // Calculate expiry date (60 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60);
    
    // Update account with new token
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        long_lived_token: longLivedToken,
        long_lived_token_expiry: expiryDate.toISOString()
      })
      .eq('id', accountId);
    
    if (updateError) {
      console.error('Error updating account with new token:', updateError);
      throw new Error('Failed to update account with new token');
    }
    
    // Get page access tokens
    try {
      // Get user ID from the token
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${longLivedToken}`
      );
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error?.message || 'Failed to get user ID');
      }
      
      const userData = await userResponse.json();
      const userId = userData.id;
      
      // Get page access tokens
      const pages = await getPageAccessTokens(userId, longLivedToken);
      
      // Update existing pages with new tokens
      if (pages && Array.isArray(pages)) {
        for (const page of pages) {
          // Check if page exists in database
          const { data: existingPage, error: pageError } = await supabase
            .from('pages')
            .select('*')
            .eq('id', page.id)
            .eq('account_id', accountId)
            .single();
          
          if (pageError && pageError.code !== 'PGRST116') {
            console.error(`Error checking page ${page.id}:`, pageError);
            continue;
          }
          
          if (existingPage) {
            // Update existing page
            const { error: updatePageError } = await supabase
              .from('pages')
              .update({
                access_token: page.access_token
              })
              .eq('id', page.id)
              .eq('account_id', accountId);
            
            if (updatePageError) {
              console.error(`Error updating page ${page.id}:`, updatePageError);
            }
          } else {
            // Insert new page
            const { error: insertPageError } = await supabase
              .from('pages')
              .insert({
                id: page.id,
                name: page.name,
                access_token: page.access_token,
                account_id: accountId
              });
            
            if (insertPageError) {
              console.error(`Error inserting page ${page.id}:`, insertPageError);
            }
          }
        }
      }
    } catch (pageError: any) {
      console.error('Error refreshing page tokens:', pageError);
      // Continue with the token refresh even if page token refresh fails
    }
    
    // Get updated account
    const { data: updatedAccount, error: getUpdatedError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (getUpdatedError) {
      console.error('Error fetching updated account:', getUpdatedError);
      throw new Error('Failed to fetch updated account');
    }
    
    // Get pages for the account
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('account_id', accountId);
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    } else {
      updatedAccount.pages = pages || [];
    }
    
    return NextResponse.json({
      success: true,
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        appId: updatedAccount.app_id,
        appSecret: updatedAccount.app_secret,
        shortLivedToken: updatedAccount.short_lived_token,
        longLivedToken: updatedAccount.long_lived_token,
        longLivedTokenExpiry: updatedAccount.long_lived_token_expiry,
        pages: updatedAccount.pages
      }
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', message: error.message },
      { status: 500 }
    );
  }
}