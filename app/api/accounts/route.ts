import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get accounts data
const getAccountsData = () => {
  ensureDataDir();
  
  if (!fs.existsSync(accountsFilePath)) {
    // Create default accounts file if it doesn't exist
    const defaultData = {
      accounts: [],
      currentAccountId: '',
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(accountsFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  
  try {
    const fileContent = fs.readFileSync(accountsFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading accounts file:', error);
    // If file is corrupted, create a new one
    const defaultData = {
      accounts: [],
      currentAccountId: '',
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(accountsFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

// Save accounts data
const saveAccountsData = (data: any) => {
  ensureDataDir();
  try {
    fs.writeFileSync(accountsFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving accounts data:', error);
    return false;
  }
};

export async function GET() {
  try {
    const accountsData = getAccountsData();
    return NextResponse.json(accountsData);
  } catch (error) {
    console.error('Error fetching accounts:', error);
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
    
    const accountsData = getAccountsData();
    console.log('Current accounts data:', JSON.stringify(accountsData));
    
    // Check if account already exists
    const existingAccountIndex = accountsData.accounts.findIndex(
      (account: any) => account.id === data.id
    );
    
    if (existingAccountIndex !== -1) {
      // Update existing account
      accountsData.accounts[existingAccountIndex] = {
        ...accountsData.accounts[existingAccountIndex],
        ...data,
      };
    } else {
      // Add new account
      accountsData.accounts.push({
        ...data,
        pages: data.pages || [],
        longLivedToken: data.longLivedToken || '',
        longLivedTokenExpiry: data.longLivedTokenExpiry || '',
      });
      
      // Set as current account if it's the first one or if no current account is set
      if (accountsData.accounts.length === 1 || !accountsData.currentAccountId) {
        accountsData.currentAccountId = data.id;
      }
    }
    
    accountsData.lastUpdated = new Date().toISOString();
    const saveResult = saveAccountsData(accountsData);
    
    if (!saveResult) {
      throw new Error('Failed to save account data to file');
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