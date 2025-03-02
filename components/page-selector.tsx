"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadFormSelector } from '@/components/lead-form-selector';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Page {
  id: string;
  name: string;
  access_token: string;
}

interface Account {
  id: string;
  name: string;
  pages: Page[];
}

interface PageSelectorProps {
  account: Account;
  accounts: Account[];
}

export function PageSelector({ account, accounts }: PageSelectorProps) {
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset page selection when account changes
    setCurrentPageId('');
  }, [account.id]);

  const handlePageChange = (pageId: string) => {
    setCurrentPageId(pageId);
  };

  if (!account.pages || account.pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pages Found</CardTitle>
          <CardDescription>This account doesn't have any connected Facebook pages</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Go to the "Add Page" tab to add a Facebook page to this account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentPage = account.pages?.find(page => page.id === currentPageId);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Facebook Page</CardTitle>
          <CardDescription>Choose a page to view its lead forms</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentPageId} onValueChange={handlePageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {account.pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentPage && (
        <LeadFormSelector 
          forms={[]}
          pageId={currentPage.id}
          pageName={currentPage.name}
          pageToken={currentPage.access_token}
        />
      )}
    </div>
  );
}