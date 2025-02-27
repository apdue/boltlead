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

// Save accounts data
const saveAccountsData = (data: any) => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(accountsFilePath, JSON.stringify(data, null, 2));
};

// Convert short-lived token to long-lived token
async function convertToLongLivedToken(appId: string, appSecret: string, shortLivedToken: string) {
  const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to convert token');
  }
  
  const data = await response.json();
  return data.access_token;
}

// Get page access tokens using the long-lived user token
async function getPageAccessTokens(userId: string, longLivedToken: string) {
  const url = `https://graph.facebook.com/v19.0/${userId}/accounts?access_token=${longLivedToken}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to get page tokens');
  }
  
  const data = await response.json();
  return data.data;
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
    
    const accountsData = getAccountsData();
    
    // Find the account
    const accountIndex = accountsData.accounts.findIndex(
      (account: any) => account.id === accountId
    );
    
    if (accountIndex === -1) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    const account = accountsData.accounts[accountIndex];
    
    if (!account.appId || !account.appSecret || !account.shortLivedToken) {
      return NextResponse.json(
        { error: 'Account is missing required credentials' },
        { status: 400 }
      );
    }
    
    // Convert short-lived token to long-lived token
    const longLivedToken = await convertToLongLivedToken(
      account.appId,
      account.appSecret,
      account.shortLivedToken
    );
    
    // Calculate expiry date (60 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60);
    
    // Update account with new token
    accountsData.accounts[accountIndex] = {
      ...account,
      longLivedToken,
      longLivedTokenExpiry: expiryDate.toISOString(),
    };
    
    // Get page access tokens
    try {
      // We need to get the user ID first
      const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${longLivedToken}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user ID');
      }
      
      const userData = await userResponse.json();
      const userId = userData.id;
      
      // Now get the page tokens
      const pages = await getPageAccessTokens(userId, longLivedToken);
      
      // Update pages with new tokens
      if (pages && pages.length > 0) {
        accountsData.accounts[accountIndex].pages = pages.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
        }));
      }
    } catch (pageError) {
      console.error('Error updating page tokens:', pageError);
      // Continue even if page token update fails
    }
    
    accountsData.lastUpdated = new Date().toISOString();
    saveAccountsData(accountsData);
    
    return NextResponse.json({
      success: true,
      account: accountsData.accounts[accountIndex],
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', message: error.message },
      { status: 500 }
    );
  }
}