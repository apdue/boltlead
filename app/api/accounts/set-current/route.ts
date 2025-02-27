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
    
    // Check if account exists
    const accountExists = accountsData.accounts.some(
      (account: any) => account.id === accountId
    );
    
    if (!accountExists) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Set current account
    accountsData.currentAccountId = accountId;
    accountsData.lastUpdated = new Date().toISOString();
    saveAccountsData(accountsData);
    
    return NextResponse.json({ success: true, currentAccountId: accountId });
  } catch (error) {
    console.error('Error setting current account:', error);
    return NextResponse.json(
      { error: 'Failed to set current account' },
      { status: 500 }
    );
  }
}