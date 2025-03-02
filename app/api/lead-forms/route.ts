import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');

// Get accounts data
const getAccountsData = () => {
  if (!fs.existsSync(accountsFilePath)) {
    return { accounts: [], currentAccountId: '', lastUpdated: new Date().toISOString() };
  }
  
  const fileContent = fs.readFileSync(accountsFilePath, 'utf8');
  return JSON.parse(fileContent);
};

// Get page access token
const getPageAccessToken = (accountId: string, pageId: string) => {
  const accountsData = getAccountsData();
  
  const account = accountsData.accounts.find((acc: any) => acc.id === accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  
  const page = account.pages.find((p: any) => p.id === pageId);
  if (!page) {
    throw new Error('Page not found');
  }
  
  return page.access_token;
};

// Fetch lead forms for a page
async function fetchLeadForms(pageId: string, accessToken: string) {
  const url = `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${accessToken}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch lead forms');
  }
  
  const data = await response.json();
  return data.data;
}

// Get the Facebook page ID from the UUID
async function getFacebookPageId(pageUuid: string) {
  try {
    // Query the pages table to get the fb_page_id
    const { data, error } = await supabase
      .from('pages')
      .select('fb_page_id')
      .eq('id', pageUuid)
      .single();
    
    if (error) {
      console.error('Error fetching page from database:', error);
      throw new Error('Failed to find page in database');
    }
    
    if (!data || !data.fb_page_id) {
      throw new Error('Page not found or fb_page_id is missing');
    }
    
    return data.fb_page_id;
  } catch (error) {
    console.error('Error in getFacebookPageId:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');
    const accessToken = searchParams.get('accessToken');

    console.log('Received request for lead forms with pageId:', pageId);
    
    // Validate required parameters
    if (!pageId || !accessToken) {
      console.log('Missing required parameters:', { pageId, accessTokenExists: !!accessToken });
      return NextResponse.json(
        { error: 'Missing required parameters: pageId and accessToken are required' },
        { status: 400 }
      );
    }

    // Check if pageId is a UUID (contains hyphens)
    let fbPageId = pageId;
    if (pageId.includes('-')) {
      console.log('Page ID appears to be a UUID, fetching Facebook page ID from database');
      try {
        fbPageId = await getFacebookPageId(pageId);
        console.log('Retrieved Facebook page ID:', fbPageId);
      } catch (error: any) {
        console.error('Failed to get Facebook page ID:', error);
        return NextResponse.json(
          { error: 'Failed to find Facebook page ID: ' + error.message },
          { status: 400 }
        );
      }
    }

    // Call Facebook Graph API to get lead forms
    const url = `https://graph.facebook.com/v19.0/${fbPageId}/leadgen_forms?access_token=${encodeURIComponent(accessToken)}`;
    console.log('Calling Facebook API with URL:', url.substring(0, 100) + '...');
    
    const response = await fetch(url);
    console.log('Facebook API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Invalid response from Facebook API' } }));
      console.log('Facebook API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch lead forms from Facebook' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Successfully fetched lead forms, count:', data.data?.length || 0);
    
    return NextResponse.json({
      forms: data.data || [],
      paging: data.paging || null
    });
  } catch (error: any) {
    console.error('Error fetching lead forms:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}