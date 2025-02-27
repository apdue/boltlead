import { NextResponse } from 'next/server';

// Fetch leads for a form
async function fetchLeads(formId: string, pageId: string, accessToken: string, since?: string, until?: string) {
  let url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${accessToken}`;
  
  // Add date filtering if provided
  if (since) {
    url += `&since=${since}`;
  }
  
  if (until) {
    url += `&until=${until}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch leads');
  }
  
  const data = await response.json();
  return data.data;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const pageId = searchParams.get('pageId');
    const pageToken = searchParams.get('pageToken');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Convert dates to Unix timestamps if provided
    let since: string | undefined;
    let until: string | undefined;
    
    if (from) {
      since = Math.floor(new Date(from).getTime() / 1000).toString();
    }
    
    if (to) {
      // Add one day to include the end date
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      until = Math.floor(toDate.getTime() / 1000).toString();
    }
    
    // Fetch leads
    const leads = await fetchLeads(formId, pageId, pageToken, since, until);
    
    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', message: error.message },
      { status: 500 }
    );
  }
}