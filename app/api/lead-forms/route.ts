import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const accountId = searchParams.get('accountId');
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Get page access token
    const accessToken = getPageAccessToken(accountId, pageId);
    
    // Fetch lead forms
    const leadForms = await fetchLeadForms(pageId, accessToken);
    
    return NextResponse.json({ leadForms });
  } catch (error: any) {
    console.error('Error fetching lead forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead forms', message: error.message },
      { status: 500 }
    );
  }
}