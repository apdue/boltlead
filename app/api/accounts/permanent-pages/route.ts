import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET() {
  try {
    const permanentPagesData = getPermanentPagesData();
    
    return NextResponse.json({
      success: true,
      pages: permanentPagesData.pages,
      lastUpdated: permanentPagesData.lastUpdated
    });
  } catch (error: any) {
    console.error('Error retrieving permanent pages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve permanent pages', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { pageId } = await request.json();
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    const permanentPagesData = getPermanentPagesData();
    
    // Filter out the page to be removed
    permanentPagesData.pages = permanentPagesData.pages.filter(
      (page: any) => page.id !== pageId
    );
    
    permanentPagesData.lastUpdated = new Date().toISOString();
    
    // Save the updated data
    fs.writeFileSync(permanentPagesFilePath, JSON.stringify(permanentPagesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Page removed from permanent storage'
    });
  } catch (error: any) {
    console.error('Error removing permanent page:', error);
    return NextResponse.json(
      { error: 'Failed to remove permanent page', message: error.message },
      { status: 500 }
    );
  }
} 