import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const accountsFilePath = path.join(process.cwd(), 'data', 'accounts.json');
const permanentPagesFilePath = path.join(process.cwd(), 'data', 'permanent-pages.json');

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
    return { accounts: [], currentAccountId: '', lastUpdated: new Date().toISOString() };
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

// Get permanent pages data
const getPermanentPagesData = () => {
  ensureDataDir();
  
  if (!fs.existsSync(permanentPagesFilePath)) {
    return { pages: [], lastUpdated: new Date().toISOString() };
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

// Save accounts data
const saveAccountsData = (data: any) => {
  ensureDataDir();
  fs.writeFileSync(accountsFilePath, JSON.stringify(data, null, 2));
};

// Save permanent pages data
const savePermanentPagesData = (data: any) => {
  ensureDataDir();
  fs.writeFileSync(permanentPagesFilePath, JSON.stringify(data, null, 2));
};

export async function POST(request: Request) {
  try {
    const { accountId, page } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    if (!page || !page.id || !page.name || !page.access_token) {
      return NextResponse.json(
        { error: 'Page details are incomplete' },
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
    
    // Initialize pages array if it doesn't exist
    if (!accountsData.accounts[accountIndex].pages) {
      accountsData.accounts[accountIndex].pages = [];
    }
    
    // Check if page already exists
    const pageExists = accountsData.accounts[accountIndex].pages.some(
      (p: any) => p.id === page.id
    );
    
    if (pageExists) {
      // Update existing page
      accountsData.accounts[accountIndex].pages = accountsData.accounts[accountIndex].pages.map(
        (p: any) => p.id === page.id ? { ...p, ...page } : p
      );
    } else {
      // Add new page
      accountsData.accounts[accountIndex].pages.push(page);
    }
    
    accountsData.lastUpdated = new Date().toISOString();
    saveAccountsData(accountsData);
    
    // If the page is marked as permanent, save it to the permanent pages file
    if (page.isPermanent) {
      const permanentPagesData = getPermanentPagesData();
      
      // Check if the page already exists in permanent pages
      const permanentPageIndex = permanentPagesData.pages.findIndex(
        (p: any) => p.id === page.id
      );
      
      if (permanentPageIndex !== -1) {
        // Update existing permanent page
        permanentPagesData.pages[permanentPageIndex] = {
          ...permanentPagesData.pages[permanentPageIndex],
          ...page,
          accountId // Store the account ID with the page for reference
        };
      } else {
        // Add new permanent page
        permanentPagesData.pages.push({
          ...page,
          accountId // Store the account ID with the page for reference
        });
      }
      
      permanentPagesData.lastUpdated = new Date().toISOString();
      savePermanentPagesData(permanentPagesData);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: pageExists 
        ? (page.isPermanent ? 'Page updated and saved permanently' : 'Page updated successfully') 
        : (page.isPermanent ? 'Page added and saved permanently' : 'Page added successfully'),
      page 
    });
  } catch (error: any) {
    console.error('Error adding/updating page:', error);
    return NextResponse.json(
      { error: 'Failed to add/update page', message: error.message },
      { status: 500 }
    );
  }
}