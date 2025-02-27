import { NextResponse } from 'next/server';

// Fetch lead forms for a page using direct token
async function fetchLeadForms(pageId: string, accessToken: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${accessToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch lead forms');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Error fetching lead forms:', error);
    throw error;
  }
}

// Remove the dynamic directive since we're using output: export
// export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const pageToken = searchParams.get('pageToken');
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    if (!pageToken) {
      return NextResponse.json(
        { error: 'Page Access Token is required' },
        { status: 400 }
      );
    }
    
    // Fetch lead forms
    const leadForms = await fetchLeadForms(pageId, pageToken);
    
    return NextResponse.json({ leadForms });
  } catch (error: any) {
    console.error('Error fetching lead forms:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch lead forms', 
        message: error.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}