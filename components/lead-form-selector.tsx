"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/date-range-picker';
import { toast } from 'sonner';
import { Loader2, Download, FileSpreadsheet, FileText, Calendar, CalendarRange, AlertCircle, SplitSquareVertical, Mail, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadDataTable } from '@/components/lead-data-table';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { addMonths, subMonths, startOfMonth, endOfMonth, format, startOfDay, endOfDay, subDays } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface Page {
  id: string;
  name: string;
  access_token: string;
}

interface LeadForm {
  id: string;
  name: string;
  status: string;
  created_time: string;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

interface LeadFormSelectorProps {
  page: Page;
  accountId: string;
  useDirectToken?: boolean;
  initialLeadForms?: any[];
}

// Predefined date ranges
const PREDEFINED_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  LAST_3_MONTHS: 'last3months',
  LAST_6_MONTHS: 'last6months',
  LAST_YEAR: 'lastYear',
  ALL_TIME: 'allTime',
  CUSTOM: 'custom',
};

// Maximum number of leads to fetch
const MAX_LEADS = 400;

// Cache for leads data
const leadsCache = new Map<string, any[]>();

export function LeadFormSelector({ 
  page, 
  accountId, 
  useDirectToken = false,
  initialLeadForms = []
}: LeadFormSelectorProps) {
  const [leadForms, setLeadForms] = useState<LeadForm[]>(initialLeadForms);
  const [currentFormId, setCurrentFormId] = useState<string>('');
  const [loading, setLoading] = useState(!initialLeadForms.length);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [leadData, setLeadData] = useState<any[]>([]);
  const [downloadFormat, setDownloadFormat] = useState<'excel' | 'csv'>('excel');
  const [downloading, setDownloading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<string>(PREDEFINED_RANGES.YESTERDAY);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDateRangeLabel, setCurrentDateRangeLabel] = useState<string>('Yesterday');
  const [cachedLeads, setCachedLeads] = useState<any[]>([]);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [hasMoreLeads, setHasMoreLeads] = useState(false);
  const [splitCount, setSplitCount] = useState<number>(0);
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download');
  const [emailAddresses, setEmailAddresses] = useState<string[]>(['']);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchLeadForms = async () => {
      // Skip fetching if we already have initialLeadForms
      if (initialLeadForms.length > 0) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // For static export, we need to directly call the Facebook Graph API
        const url = `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${encodeURIComponent(page.access_token)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch lead forms');
        }
        
        const data = await response.json();
        setLeadForms(data.data || []);
        setCurrentFormId('');
        setLeadData([]);
      } catch (error: any) {
        console.error('Error fetching lead forms:', error);
        toast.error('Failed to load lead forms: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    // Reset state when page changes
    setCurrentFormId('');
    setLeadData([]);
    setCachedLeads([]);
    setIsCacheLoaded(false);
    
    // Fetch lead forms when the component mounts or when the page changes
    fetchLeadForms();
    
    // Set default date range (yesterday)
    handlePredefinedRangeChange(PREDEFINED_RANGES.YESTERDAY);
  }, [page.id]);

  // Apply predefined date range
  useEffect(() => {
    if (!selectedDateRange || selectedDateRange === PREDEFINED_RANGES.CUSTOM) {
      return; // Keep custom date range as is
    }
    
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined;
    let rangeLabel = '';
    
    switch (selectedDateRange) {
      case PREDEFINED_RANGES.TODAY:
        from = startOfDay(now);
        to = endOfDay(now);
        rangeLabel = 'Today';
        break;
      case PREDEFINED_RANGES.YESTERDAY:
        const yesterday = subDays(now, 1);
        from = startOfDay(yesterday);
        to = endOfDay(yesterday);
        rangeLabel = 'Yesterday';
        break;
      case PREDEFINED_RANGES.LAST_7_DAYS:
        from = startOfDay(subDays(now, 6));
        to = endOfDay(now);
        rangeLabel = 'Last 7 days';
        break;
      case PREDEFINED_RANGES.LAST_30_DAYS:
        from = startOfDay(subDays(now, 29));
        to = endOfDay(now);
        rangeLabel = 'Last 30 days';
        break;
      case PREDEFINED_RANGES.THIS_MONTH:
        from = startOfMonth(now);
        to = endOfDay(now);
        rangeLabel = 'This month';
        break;
      case PREDEFINED_RANGES.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        rangeLabel = 'Last month';
        break;
      case PREDEFINED_RANGES.LAST_3_MONTHS:
        from = startOfMonth(subMonths(now, 2));
        to = endOfDay(now);
        rangeLabel = 'Last 3 months';
        break;
      case PREDEFINED_RANGES.LAST_6_MONTHS:
        from = startOfMonth(subMonths(now, 5));
        to = endOfDay(now);
        rangeLabel = 'Last 6 months';
        break;
      case PREDEFINED_RANGES.LAST_YEAR:
        from = startOfDay(subDays(now, 364));
        to = endOfDay(now);
        rangeLabel = 'Last year';
        break;
      case PREDEFINED_RANGES.ALL_TIME:
        from = undefined;
        to = undefined;
        rangeLabel = 'All time';
        break;
    }
    
    setDateRange({ from, to });
    setCurrentDateRangeLabel(rangeLabel);
    
    // If a form is already selected and we have cached leads, filter them
    if (currentFormId && isCacheLoaded) {
      filterLeadsByDateRange(cachedLeads, { from, to });
    } else if (currentFormId) {
      // Otherwise fetch leads
      fetchLeadsForDateRange(currentFormId, { from, to });
    }
  }, [selectedDateRange, currentFormId, isCacheLoaded, cachedLeads]);

  // Function to filter leads by date range
  const filterLeadsByDateRange = (leads: any[], range: DateRange) => {
    if (!range.from && !range.to) {
      setLeadData(leads);
      return;
    }
    
    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_time);
      
      // Check if lead is within the date range
      if (range.from && leadDate < range.from) {
        return false;
      }
      
      if (range.to && leadDate > range.to) {
        return false;
      }
      
      return true;
    });
    
    setLeadData(filteredLeads);
    
    if (filteredLeads.length === 0) {
      toast.info('No leads found for this form in the selected date range');
    }
  };

  // Function to fetch leads for a specific date range
  const fetchLeadsForDateRange = async (formId: string, range: DateRange) => {
    try {
      setLoadingLeads(true);
      
      // Check if we already have cached leads for this form
      const cacheKey = `${formId}`;
      if (leadsCache.has(cacheKey)) {
        const cachedData = leadsCache.get(cacheKey) || [];
        setCachedLeads(cachedData);
        setIsCacheLoaded(true);
        filterLeadsByDateRange(cachedData, range);
        setLoadingLeads(false);
        return;
      }
      
      // If not in cache, fetch leads
      await fetchAndCacheLeads(formId);
      
      // Now filter the cached leads by date range
      const cachedData = leadsCache.get(cacheKey) || [];
      filterLeadsByDateRange(cachedData, range);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads: ' + (error.message || 'Unknown error'));
      setLeadData([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleFormChange = async (formId: string) => {
    setCurrentFormId(formId);
    setLeadData([]);
    setCachedLeads([]);
    setIsCacheLoaded(false);
    setHasMoreLeads(false);
    setLeadCount(0);
    
    if (!formId) return;
    
    // Fetch leads with the current date range
    fetchLeadsForDateRange(formId, dateRange);
  };

  // Function to fetch leads with pagination and cache them (limited to MAX_LEADS)
  const fetchAndCacheLeads = async (formId: string) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const cacheKey = `${formId}`;
      
      // If already in cache, use cached data
      if (leadsCache.has(cacheKey)) {
        const cachedData = leadsCache.get(cacheKey) || [];
        setCachedLeads(cachedData);
        setIsCacheLoaded(true);
        setIsDownloading(false);
        setDownloadProgress(100);
        setLeadCount(cachedData.length);
        setHasMoreLeads(false); // We don't know if there are more, but we'll assume not
        return cachedData;
      }
      
      let allLeadsData: any[] = [];
      let nextPageUrl: string | null = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${encodeURIComponent(page.access_token)}&limit=100`;
      
      let pageCount = 0;
      let hasMore = false;
      
      while (nextPageUrl && allLeadsData.length < MAX_LEADS) {
        const response = await fetch(nextPageUrl, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Invalid response from Facebook API' } }));
          throw new Error(errorData.error?.message || 'Failed to fetch leads');
        }
        
        const data = await response.json().catch(() => ({ data: [] }));
        
        if (data.data && data.data.length > 0) {
          // Only add leads up to the MAX_LEADS limit
          const remainingSpace = MAX_LEADS - allLeadsData.length;
          const leadsToAdd = data.data.slice(0, remainingSpace);
          allLeadsData = [...allLeadsData, ...leadsToAdd];
          
          // Check if we've reached the limit and there are more leads available
          if (data.data.length > leadsToAdd.length || (data.paging && data.paging.next && allLeadsData.length >= MAX_LEADS)) {
            hasMore = true;
            break; // Stop fetching if we've reached the limit
          }
        }
        
        // Update progress - estimate based on 4 pages (400 leads at 100 per page)
        pageCount++;
        setDownloadProgress(Math.min(Math.round((pageCount / 4) * 100), 99));
        
        // Get next page URL if available
        nextPageUrl = data.paging && data.paging.next ? data.paging.next : null;
        
        // Safety check to prevent infinite loops
        if (pageCount >= 4) { // 4 pages = 400 leads at 100 per page
          if (nextPageUrl) {
            hasMore = true;
          }
          break;
        }
      }
      
      setDownloadProgress(100);
      setLeadCount(allLeadsData.length);
      setHasMoreLeads(hasMore);
      
      // Cache the leads
      leadsCache.set(cacheKey, allLeadsData);
      setCachedLeads(allLeadsData);
      setIsCacheLoaded(true);
      
      return allLeadsData;
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads: ' + (error.message || 'Unknown error'));
      return [];
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentFormId) {
      toast.error('Please select a lead form first');
      return;
    }
    
    try {
      setDownloading(true);
      
      // Get leads from cache or fetch them
      let leads: any[];
      
      if (isCacheLoaded) {
        // Filter cached leads by date range
        if (!dateRange.from && !dateRange.to) {
          leads = cachedLeads;
        } else {
          leads = cachedLeads.filter(lead => {
            const leadDate = new Date(lead.created_time);
            
            // Check if lead is within the date range
            if (dateRange.from && leadDate < dateRange.from) {
              return false;
            }
            
            if (dateRange.to && leadDate > dateRange.to) {
              return false;
            }
            
            return true;
          });
        }
      } else {
        // Fetch leads and cache them
        leads = await fetchAndCacheLeads(currentFormId);
        
        // Filter by date range
        if (dateRange.from || dateRange.to) {
          leads = leads.filter(lead => {
            const leadDate = new Date(lead.created_time);
            
            // Check if lead is within the date range
            if (dateRange.from && leadDate < dateRange.from) {
              return false;
            }
            
            if (dateRange.to && leadDate > dateRange.to) {
              return false;
            }
            
            return true;
          });
        }
      }
      
      if (leads.length === 0) {
        toast.warning('No leads found for the selected criteria');
        setDownloading(false);
        return;
      }
      
      // Process the leads data for download
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
      const currentForm = leadForms.find(form => form.id === currentFormId);
      const formName = currentForm ? currentForm.name.replace(/\s+/g, '_') : 'leads';
      
      // Add date range to filename
      let dateRangeStr = 'all_time';
      if (selectedDateRange !== PREDEFINED_RANGES.ALL_TIME && selectedDateRange !== PREDEFINED_RANGES.CUSTOM) {
        dateRangeStr = currentDateRangeLabel.toLowerCase().replace(/\s+/g, '_');
      } else if (dateRange.from && dateRange.to) {
        dateRangeStr = `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
      } else if (dateRange.from) {
        dateRangeStr = `from_${format(dateRange.from, 'yyyy-MM-dd')}`;
      } else if (dateRange.to) {
        dateRangeStr = `until_${format(dateRange.to, 'yyyy-MM-dd')}`;
      }
      
      const baseFilename = `${formName}_${dateRangeStr}`;
      
      if (downloadFormat === 'csv') {
        // Generate CSV content
        const headers = ['Created Time', ...fieldNames];
        const csvContent = [
          headers.join(','),
          ...exportData.map((row: any) => 
            headers.map(header => 
              `"${(row[header] || '').replace(/"/g, '""')}"`
            ).join(',')
          )
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${baseFilename}.csv`);
      } else {
        // Check if we need to split the file
        if (splitCount > 1 && exportData.length > splitCount) {
          // Calculate items per file (rounded up to ensure all data is included)
          const itemsPerFile = Math.ceil(exportData.length / splitCount);
          
          // Create and download multiple files
          for (let i = 0; i < splitCount; i++) {
            const startIndex = i * itemsPerFile;
            const endIndex = Math.min(startIndex + itemsPerFile, exportData.length);
            const batchData = exportData.slice(startIndex, endIndex);
            
            if (batchData.length === 0) break; // No more data to process
            
            // Create Excel file using ExcelJS
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Leads');
            
            // Add headers
            const headers = ['Created Time', ...fieldNames];
            worksheet.addRow(headers);
            
            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
            
            // Add data rows
            batchData.forEach(row => {
              const rowData = headers.map(header => row[header] || '');
              worksheet.addRow(rowData);
            });
            
            // Auto-size columns
            worksheet.columns.forEach(column => {
              if (column && typeof column.eachCell === 'function') {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                  if (rowNumber <= batchData.length + 1) { // +1 for header row
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                      maxLength = columnLength;
                    }
                  }
                });
                column.width = Math.min(maxLength + 2, 50); // Cap width at 50 characters
              }
            });
            
            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `${baseFilename}_part${i+1}_of_${splitCount}.xlsx`);
          }
          
          toast.success(`${exportData.length} leads split into ${splitCount} Excel files (${currentDateRangeLabel})`);
        } else {
          // Create a single Excel file (original behavior)
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Leads');
          
          // Add headers
          const headers = ['Created Time', ...fieldNames];
          worksheet.addRow(headers);
          
          // Style the header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          
          // Add data rows in batches for better performance
          const batchSize = 100;
          for (let i = 0; i < exportData.length; i += batchSize) {
            const batch = exportData.slice(i, i + batchSize);
            batch.forEach(row => {
              const rowData = headers.map(header => row[header] || '');
              worksheet.addRow(rowData);
            });
          }
          
          // Auto-size columns (limit to first 1000 rows for performance)
          const sampleSize = Math.min(exportData.length, 1000);
          worksheet.columns.forEach(column => {
            if (column && typeof column.eachCell === 'function') {
              let maxLength = 0;
              column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (rowNumber <= sampleSize + 1) { // +1 for header row
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                    maxLength = columnLength;
                  }
                }
              });
              column.width = Math.min(maxLength + 2, 50); // Cap width at 50 characters
            }
          });
          
          // Generate Excel file
          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(blob, `${baseFilename}.xlsx`);
          
          toast.success(`${exportData.length} leads downloaded successfully as EXCEL (${currentDateRangeLabel})`);
        }
      }
    } catch (error: any) {
      console.error('Error downloading leads:', error);
      toast.error('Failed to download leads: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: { from: Date; to: Date } | undefined) => {
    if (newDateRange && newDateRange.from && newDateRange.to) {
      setDateRange({
        from: newDateRange.from,
        to: newDateRange.to
      });
      setSelectedDateRange('custom');
      
      // Update the current date range label
      setCurrentDateRangeLabel(`${format(newDateRange.from, 'MMM d, yyyy')} - ${format(newDateRange.to, 'MMM d, yyyy')}`);
      
      // If a form is selected, fetch leads for the new date range
      if (currentFormId) {
        fetchLeadsForDateRange(currentFormId, { from: newDateRange.from, to: newDateRange.to });
      }
    }
  };

  const handlePredefinedRangeChange = (value: string) => {
    setSelectedDateRange(value);
  };

  // Function to handle email address changes
  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emailAddresses];
    newEmails[index] = value;
    setEmailAddresses(newEmails);
  };

  // Function to add another email field
  const addEmailField = () => {
    setEmailAddresses([...emailAddresses, '']);
  };

  // Function to remove an email field
  const removeEmailField = (index: number) => {
    if (emailAddresses.length > 1) {
      const newEmails = [...emailAddresses];
      newEmails.splice(index, 1);
      setEmailAddresses(newEmails);
    }
  };

  // Function to validate email addresses
  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const filledEmails = emailAddresses.filter(email => email.trim() !== '');
    
    if (filledEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return false;
    }
    
    for (const email of filledEmails) {
      if (!emailRegex.test(email)) {
        toast.error(`Invalid email format: ${email}`);
        return false;
      }
    }
    
    return true;
  };

  // Function to send emails
  const handleSendEmail = async () => {
    if (!currentFormId) {
      toast.error('Please select a lead form first');
      return;
    }
    
    if (!validateEmails()) {
      return;
    }
    
    try {
      setSendingEmail(true);
      
      // Get leads from cache or fetch them
      let leads: any[];
      
      if (isCacheLoaded) {
        // Filter cached leads by date range
        if (!dateRange.from && !dateRange.to) {
          leads = cachedLeads;
        } else {
          leads = cachedLeads.filter(lead => {
            const leadDate = new Date(lead.created_time);
            
            // Check if lead is within the date range
            if (dateRange.from && leadDate < dateRange.from) {
              return false;
            }
            
            if (dateRange.to && leadDate > dateRange.to) {
              return false;
            }
            
            return true;
          });
        }
      } else {
        // Fetch leads and cache them
        leads = await fetchAndCacheLeads(currentFormId);
        
        // Filter by date range
        if (dateRange.from || dateRange.to) {
          leads = leads.filter(lead => {
            const leadDate = new Date(lead.created_time);
            
            // Check if lead is within the date range
            if (dateRange.from && leadDate < dateRange.from) {
              return false;
            }
            
            if (dateRange.to && leadDate > dateRange.to) {
              return false;
            }
            
            return true;
          });
        }
      }
      
      if (leads.length === 0) {
        toast.warning('No leads found for the selected criteria');
        setSendingEmail(false);
        return;
      }
      
      // Process the leads data for email
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
      const currentForm = leadForms.find(form => form.id === currentFormId);
      const formName = currentForm ? currentForm.name.replace(/\s+/g, '_') : 'leads';
      
      // Add date range to filename
      let dateRangeStr = 'all_time';
      if (selectedDateRange !== PREDEFINED_RANGES.ALL_TIME && selectedDateRange !== PREDEFINED_RANGES.CUSTOM) {
        dateRangeStr = currentDateRangeLabel.toLowerCase().replace(/\s+/g, '_');
      } else if (dateRange.from && dateRange.to) {
        dateRangeStr = `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}`;
      } else if (dateRange.from) {
        dateRangeStr = `from_${format(dateRange.from, 'yyyy-MM-dd')}`;
      } else if (dateRange.to) {
        dateRangeStr = `until_${format(dateRange.to, 'yyyy-MM-dd')}`;
      }
      
      const baseFilename = `${formName}_${dateRangeStr}`;
      
      // Check if we need to split the file
      if (splitCount > 1 && exportData.length > splitCount) {
        // Calculate items per file (rounded up to ensure all data is included)
        const itemsPerFile = Math.ceil(exportData.length / splitCount);
        
        // Create and email multiple files
        const emailPromises = [];
        
        for (let i = 0; i < splitCount; i++) {
          const startIndex = i * itemsPerFile;
          const endIndex = Math.min(startIndex + itemsPerFile, exportData.length);
          const batchData = exportData.slice(startIndex, endIndex);
          
          if (batchData.length === 0) break; // No more data to process
          
          // Create Excel file using ExcelJS
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Leads');
          
          // Add headers
          const headers = ['Created Time', ...fieldNames];
          worksheet.addRow(headers);
          
          // Style the header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          
          // Add data rows
          batchData.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            worksheet.addRow(rowData);
          });
          
          // Auto-size columns
          worksheet.columns.forEach(column => {
            if (column && typeof column.eachCell === 'function') {
              let maxLength = 0;
              column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (rowNumber <= batchData.length + 1) { // +1 for header row
                  const columnLength = cell.value ? cell.value.toString().length : 10;
                  if (columnLength > maxLength) {
                    maxLength = columnLength;
                  }
                }
              });
              column.width = Math.min(maxLength + 2, 50); // Cap width at 50 characters
            }
          });
          
          // Generate Excel file as buffer
          const buffer = await workbook.xlsx.writeBuffer();
          
          // Get the email for this file (use the corresponding email if available, otherwise use the first email)
          const emailToUse = i < emailAddresses.length && emailAddresses[i].trim() !== '' 
            ? emailAddresses[i] 
            : emailAddresses[0];
          
          // Send email with attachment
          const formData = new FormData();
          formData.append('to', emailToUse);
          formData.append('subject', `Lead Data: ${baseFilename}_part${i+1}_of_${splitCount}`);
          formData.append('message', `Please find attached the lead data for ${currentForm?.name || 'your form'} (Part ${i+1} of ${splitCount}).\n\nDate range: ${currentDateRangeLabel}\nNumber of leads: ${batchData.length}`);
          formData.append('attachment', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${baseFilename}_part${i+1}_of_${splitCount}.xlsx`);
          
          // Make API call to send email
          const emailPromise = fetch('/api/send-email', {
            method: 'POST',
            body: formData
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to send email to ${emailToUse}`);
            }
            return response.json();
          });
          
          emailPromises.push(emailPromise);
        }
        
        // Wait for all emails to be sent
        await Promise.all(emailPromises);
        
        toast.success(`${exportData.length} leads split into ${splitCount} Excel files and sent via email`);
      } else {
        // Create a single Excel file
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads');
        
        // Add headers
        const headers = ['Created Time', ...fieldNames];
        worksheet.addRow(headers);
        
        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Add data rows in batches for better performance
        const batchSize = 100;
        for (let i = 0; i < exportData.length; i += batchSize) {
          const batch = exportData.slice(i, i + batchSize);
          batch.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            worksheet.addRow(rowData);
          });
        }
        
        // Auto-size columns (limit to first 1000 rows for performance)
        const sampleSize = Math.min(exportData.length, 1000);
        worksheet.columns.forEach(column => {
          if (column && typeof column.eachCell === 'function') {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
              if (rowNumber <= sampleSize + 1) { // +1 for header row
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                  maxLength = columnLength;
                }
              }
            });
            column.width = Math.min(maxLength + 2, 50); // Cap width at 50 characters
          }
        });
        
        // Generate Excel file as buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Send email with attachment
        const formData = new FormData();
        formData.append('to', emailAddresses[0]);
        formData.append('subject', `Lead Data: ${baseFilename}`);
        formData.append('message', `Please find attached the lead data for ${currentForm?.name || 'your form'}.\n\nDate range: ${currentDateRangeLabel}\nNumber of leads: ${exportData.length}`);
        formData.append('attachment', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${baseFilename}.xlsx`);
        
        // Make API call to send email
        const response = await fetch('/api/send-email', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to send email: ${response.status} ${response.statusText}`);
        }
        
        toast.success(`${exportData.length} leads sent successfully via email (${currentDateRangeLabel})`);
      }
    } catch (error: any) {
      console.error('Error sending leads via email:', error);
      toast.error(`Failed to send leads via email: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Lead Forms</CardTitle>
          <CardDescription>Please wait while we fetch lead forms</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (leadForms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Lead Forms Found</CardTitle>
          <CardDescription>This page doesn't have any lead forms</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to create a lead form on your Facebook page first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Forms</CardTitle>
        <CardDescription>Select a lead form to view and download leads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={currentFormId} onValueChange={handleFormChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a lead form" />
          </SelectTrigger>
          <SelectContent>
            {leadForms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name} ({form.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {currentFormId && (
          <>
            {hasMoreLeads && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  For performance reasons, only the most recent {MAX_LEADS} leads are loaded. 
                  Your form has more leads available.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Predefined Date Ranges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedDateRange} 
                      onValueChange={handlePredefinedRangeChange}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.TODAY} id="today" />
                        <Label htmlFor="today">Today</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.YESTERDAY} id="yesterday" />
                        <Label htmlFor="yesterday">Yesterday</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_7_DAYS} id="last7days" />
                        <Label htmlFor="last7days">Last 7 days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_30_DAYS} id="last30days" />
                        <Label htmlFor="last30days">Last 30 days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.THIS_MONTH} id="thisMonth" />
                        <Label htmlFor="thisMonth">This month</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_MONTH} id="lastMonth" />
                        <Label htmlFor="lastMonth">Last month</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_3_MONTHS} id="last3months" />
                        <Label htmlFor="last3months">Last 3 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_6_MONTHS} id="last6months" />
                        <Label htmlFor="last6months">Last 6 months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.LAST_YEAR} id="lastYear" />
                        <Label htmlFor="lastYear">Last year</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.ALL_TIME} id="allTime" />
                        <Label htmlFor="allTime">All time</Label>
                      </div>
                      <div className="flex items-center space-x-2 col-span-2">
                        <RadioGroupItem value={PREDEFINED_RANGES.CUSTOM} id="custom" />
                        <Label htmlFor="custom">Custom range</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Custom Date Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DateRangePicker 
                      date={{
                        from: dateRange.from || undefined,
                        to: dateRange.to || undefined
                      }} 
                      onDateChange={(date) => {
                        if (date && date.from && date.to) {
                          handleDateRangeChange({
                            from: date.from,
                            to: date.to
                          });
                        }
                      }} 
                    />
                    
                    {dateRange.from && dateRange.to && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <CalendarRange className="inline-block mr-1 h-3 w-3" />
                        {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Current selection: {currentDateRangeLabel}</span>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="download" className="pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview Data</TabsTrigger>
                <TabsTrigger value="download">Download Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="pt-4">
                {loadingLeads ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <LeadDataTable data={leadData} />
                )}
              </TabsContent>
              
              <TabsContent value="download" className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={downloadFormat === 'excel' ? 'default' : 'outline'}
                      onClick={() => setDownloadFormat('excel')}
                      className="flex items-center justify-center"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (.xlsx)
                    </Button>
                    <Button
                      variant={downloadFormat === 'csv' ? 'default' : 'outline'}
                      onClick={() => setDownloadFormat('csv')}
                      className="flex items-center justify-center"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      CSV (.csv)
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={deliveryMethod === 'download' ? 'default' : 'outline'}
                      onClick={() => setDeliveryMethod('download')}
                      className="flex items-center justify-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Files
                    </Button>
                    <Button
                      variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                      onClick={() => setDeliveryMethod('email')}
                      className="flex items-center justify-center"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send via Email
                    </Button>
                  </div>
                  
                  {downloadFormat === 'excel' && (
                    <div className="space-y-2">
                      <Label htmlFor="splitCount" className="text-sm font-medium">
                        Split into multiple files (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="splitCount"
                          type="number"
                          min="0"
                          max="20"
                          placeholder="Leave empty for single file"
                          value={splitCount || ''}
                          onChange={(e) => setSplitCount(parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter how many files you want to split the data into (max 20). Leave empty or set to 0 for a single file.
                      </p>
                    </div>
                  )}
                  
                  {deliveryMethod === 'email' && (
                    <div className="space-y-3 border p-3 rounded-md">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Email Delivery</h3>
                      </div>
                      
                      {emailAddresses.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="email"
                            placeholder={index === 0 ? "Primary email address" : `Email for file ${index + 1} (optional)`}
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            className="flex-1"
                          />
                          {index > 0 && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => removeEmailField(index)}
                              className="h-8 w-8"
                            >
                              <span className="sr-only">Remove</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {splitCount > 1 && emailAddresses.length < splitCount && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addEmailField}
                          className="w-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          Add Another Email
                        </Button>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {splitCount > 1 
                          ? `You can specify different email addresses for each file, or leave additional fields empty to use the primary email.` 
                          : `Enter the email address where you want to receive the file.`}
                      </p>
                    </div>
                  )}
                  
                  {isDownloading && !isCacheLoaded && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Loading leads data...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <Progress value={downloadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {deliveryMethod === 'download' ? (
                    <Button 
                      onClick={handleDownload} 
                      disabled={downloading || !currentFormId || (isDownloading && !isCacheLoaded)}
                      className="w-full"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download {downloadFormat.toUpperCase()}
                          {downloadFormat === 'excel' && splitCount > 1 ? ` (${splitCount} files)` : ''}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={sendingEmail || !currentFormId || (isDownloading && !isCacheLoaded)}
                      className="w-full"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Email...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send via Email
                          {downloadFormat === 'excel' && splitCount > 1 ? ` (${splitCount} files)` : ''}
                        </>
                      )}
                    </Button>
                  )}
                  
                  {isCacheLoaded && (
                    <div className="text-xs text-green-600 font-medium">
                      <p>✓ {leadCount} leads loaded and cached for faster downloads</p>
                      {hasMoreLeads && (
                        <p className="text-amber-600 mt-1">
                          Note: Only the most recent {MAX_LEADS} leads are available for performance reasons.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!isCacheLoaded && (
                    <div className="text-xs text-muted-foreground">
                      <p>Note: For performance reasons, only up to {MAX_LEADS} most recent leads will be loaded.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}