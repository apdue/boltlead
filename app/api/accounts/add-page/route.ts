import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// For permanent pages, we'll keep using the JSON file for now
// This could be migrated to Supabase in a future update
const permanentPagesFilePath = path.join(process.cwd(), 'data', 'permanent-pages.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get permanent pages data
const getPermanentPagesData = () => {
  ensureDataDir();
  
  if (!fs.existsSync(permanentPagesFilePath)) {
    // Create default permanent pages file if it doesn't exist
    const defaultData = {
      pages: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(permanentPagesFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  
  try {
    const fileContent = fs.readFileSync(permanentPagesFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading permanent pages file:', error);
    // If file is corrupted, create a new one
    const defaultData = {
      pages: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(permanentPagesFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

// Save permanent pages data
const savePermanentPagesData = (data: any) => {
  ensureDataDir();
  fs.writeFileSync(permanentPagesFilePath, JSON.stringify(data, null, 2));
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.pageId || !data.pageName || !data.accessToken || !data.accountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if the account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', data.accountId)
      .single();
    
    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Check if the page already exists for this account
    const { data: existingPage, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', data.pageId)
      .eq('account_id', data.accountId)
      .single();
    
    if (existingPage) {
      // Update the existing page
      const { error: updateError } = await supabase
        .from('pages')
        .update({
          name: data.pageName,
          access_token: data.accessToken
        })
        .eq('id', data.pageId)
        .eq('account_id', data.accountId);
      
      if (updateError) {
        console.error('Error updating page:', updateError);
        return NextResponse.json(
          { error: 'Failed to update page' },
          { status: 500 }
        );
      }
    } else {
      // Insert a new page
      const { error: insertError } = await supabase
        .from('pages')
        .insert({
          id: data.pageId,
          name: data.pageName,
          access_token: data.accessToken,
          account_id: data.accountId
        });
      
      if (insertError) {
        console.error('Error inserting page:', insertError);
        return NextResponse.json(
          { error: 'Failed to add page' },
          { status: 500 }
        );
      }
    }
    
    // Handle permanent page if specified
    if (data.isPermanent) {
      const permanentPagesData = getPermanentPagesData();
      
      // Check if the page is already in the permanent pages list
      const existingPermanentPageIndex = permanentPagesData.pages.findIndex(
        (page: any) => page.id === data.pageId
      );
      
      if (existingPermanentPageIndex !== -1) {
        // Update existing permanent page
        permanentPagesData.pages[existingPermanentPageIndex] = {
          id: data.pageId,
          name: data.pageName,
          accountId: data.accountId
        };
      } else {
        // Add new permanent page
        permanentPagesData.pages.push({
          id: data.pageId,
          name: data.pageName,
          accountId: data.accountId
        });
      }
      
      permanentPagesData.lastUpdated = new Date().toISOString();
      savePermanentPagesData(permanentPagesData);
    }
    
    // Get the updated account with pages
    const { data: updatedAccount, error: updatedAccountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', data.accountId)
      .single();
    
    if (updatedAccountError) {
      console.error('Error fetching updated account:', updatedAccountError);
      return NextResponse.json(
        { error: 'Failed to fetch updated account' },
        { status: 500 }
      );
    }
    
    // Get pages for the account
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('account_id', data.accountId);
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      );
    }
    
    // Format the response to match the expected structure
    const formattedAccount = {
      id: updatedAccount.id,
      name: updatedAccount.name,
      appId: updatedAccount.app_id,
      appSecret: updatedAccount.app_secret,
      shortLivedToken: updatedAccount.short_lived_token,
      longLivedToken: updatedAccount.long_lived_token,
      longLivedTokenExpiry: updatedAccount.long_lived_token_expiry,
      pages: pages || []
    };
    
    return NextResponse.json({
      success: true,
      account: formattedAccount,
      page: {
        id: data.pageId,
        name: data.pageName,
        access_token: data.accessToken
      }
    });
  } catch (error: any) {
    console.error('Error adding/updating page:', error);
    return NextResponse.json(
      { error: 'Failed to add/update page', message: error.message },
      { status: 500 }
    );
  }
}