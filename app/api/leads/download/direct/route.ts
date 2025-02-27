import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

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
    const format = searchParams.get('format') || 'excel';
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
    
    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found for the selected criteria' },
        { status: 404 }
      );
    }
    
    // Get all unique field names from the data
    const allFields = new Set<string>();
    leads.forEach((lead: any) => {
      if (lead.field_data) {
        lead.field_data.forEach((field: any) => {
          allFields.add(field.name);
        });
      }
    });
    
    const fieldNames = Array.from(allFields);
    
    // Helper function to get field value
    const getFieldValue = (lead: any, fieldName: string) => {
      if (!lead.field_data) return '';
      
      const field = lead.field_data.find((f: any) => f.name === fieldName);
      if (!field || !field.values) return '';
      
      return field.values.join(', ');
    };
    
    // Prepare data for export
    const exportData = leads.map((lead: any) => {
      const row: any = {
        'Created Time': new Date(lead.created_time).toLocaleString(),
      };
      
      fieldNames.forEach(fieldName => {
        row[fieldName] = getFieldValue(lead, fieldName);
      });
      
      return row;
    });
    
    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_${formId}_${date}`;
    
    if (format === 'csv') {
      // Convert to CSV
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Convert to Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error downloading leads:', error);
    return NextResponse.json(
      { error: 'Failed to download leads', message: error.message },
      { status: 500 }
    );
  }
}