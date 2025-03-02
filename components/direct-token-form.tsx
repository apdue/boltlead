"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Facebook } from 'lucide-react';
import { LeadFormSelector } from '@/components/lead-form-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Account {
  id: string;
  name: string;
  pages: Page[];
}

interface Page {
  id: string;
  name: string;
  access_token: string;
}

interface DirectPage {
  id: string;
  name: string;
  access_token: string;
  accountName?: string;
}

interface DirectTokenFormProps {}

// Process accounts data to create a list of pages with account info
const processAccountsData = (accounts: any[]) => {
  const allPages: DirectPage[] = [];
  accounts.forEach(account => {
    if (account.pages && Array.isArray(account.pages)) {
      account.pages.forEach((page: any) => {
        // For pages with duplicate IDs across accounts, make the ID unique
        const isDuplicate = allPages.some(p => p.id === page.id && p.accountName !== account.name);
        const pageId = isDuplicate ? `${page.id}-${account.id}` : page.id;
        
        allPages.push({
          id: pageId,
          name: page.name,
          access_token: page.access_token,
          accountName: account.name
        });
      });
    }
  });
  return allPages;
};

// Group pages by account
const groupPagesByAccount = (pages: DirectPage[]) => {
  return pages.reduce((groups, page) => {
    const accountName = page.accountName || 'Other';
    if (!groups[accountName]) {
      groups[accountName] = [];
    }
    groups[accountName].push(page);
    return groups;
  }, {} as Record<string, DirectPage[]>);
};

export function DirectTokenForm({}: DirectTokenFormProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [leadForms, setLeadForms] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [allPages, setAllPages] = useState<DirectPage[]>([]);
  const [accountGroups, setAccountGroups] = useState<Record<string, DirectPage[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const data = await response.json();
        setAccounts(data.accounts || []);
        
        // Process accounts data
        const pages = processAccountsData(data.accounts || []);
        setAllPages(pages);
        
        // Group pages by account
        const groups = groupPagesByAccount(pages);
        setAccountGroups(groups);
        
        // Set default selected account if available
        if (Object.keys(groups).length > 0) {
          setSelectedAccount(Object.keys(groups)[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    setSelectedPageId('');
  };

  const handlePageSelect = (value: string) => {
    setSelectedPageId(value);
  };

  const handleConnect = async () => {
    if (!selectedPageId) {
      toast.error('Please select a page');
      return;
    }

    setLoading(true);
    try {
      // Use the selected page token
      const selectedPage = allPages.find(p => p.id === selectedPageId);
      
      if (!selectedPage) {
        throw new Error('Selected page not found');
      }

      const token = selectedPage.access_token;
      const id = selectedPageId;
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('Connecting with page ID:', id);
      
      // Fetch lead forms for the page
      const apiUrl = `/api/lead-forms?pageId=${id}&accessToken=${encodeURIComponent(token)}`;
      console.log('API URL:', apiUrl.substring(0, 50) + '...');
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch lead forms');
      }
      
      const data = await response.json();
      console.log('Lead forms fetched:', data.forms?.length || 0);
      setLeadForms(data.forms || []);
      setConnected(true);
      toast.success('Connected successfully');
    } catch (error) {
      console.error('Error connecting to page:', error);
      toast.error('Failed to connect to page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Direct Page Access</CardTitle>
          <CardDescription>Select a page to access its lead forms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(accountGroups).length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountSelect">Select Account</Label>
                <Select 
                  value={selectedAccount} 
                  onValueChange={handleAccountChange}
                >
                  <SelectTrigger id="accountSelect">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(accountGroups).map((accountName) => (
                      <SelectItem key={accountName} value={accountName}>
                        {accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedAccount && accountGroups[selectedAccount] && (
                <div className="space-y-2">
                  <Label htmlFor="pageSelect">Select Page</Label>
                  <Select 
                    value={selectedPageId} 
                    onValueChange={handlePageSelect}
                  >
                    <SelectTrigger id="pageSelect">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountGroups[selectedAccount].map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedPageId && (
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">
                      {allPages.find(p => p.id === selectedPageId)?.name}
                    </h3>
                    <Badge variant="outline" className="ml-auto">
                      {allPages.find(p => p.id === selectedPageId)?.accountName}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Page ID: {selectedPageId.includes('-') ? selectedPageId.split('-')[0] : selectedPageId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Token is ready to use
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No accounts found</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(true)}
            disabled={!selectedPageId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead Form
          </Button>
          
          <Button 
            onClick={handleConnect}
            disabled={(!selectedPageId) || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect</>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {connected && leadForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lead Forms</CardTitle>
            <CardDescription>
              Select a lead form to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadFormSelector 
              forms={leadForms} 
              pageId={selectedPageId} 
              pageName={
                selectedPageId 
                  ? (allPages.find(p => p.id === selectedPageId)?.name || '') 
                  : ''
              }
              pageToken={
                selectedPageId 
                  ? (allPages.find(p => p.id === selectedPageId)?.access_token || '') 
                  : ''
              }
            />
          </CardContent>
        </Card>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead Form</DialogTitle>
            <DialogDescription>
              To add a lead form, you need to connect to the page first.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Please follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>Select a page from your accounts</li>
              <li>Click the "Connect" button to fetch available lead forms</li>
              <li>Select a lead form from the list that appears</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DirectLeadFormSelectorProps {
  pageId: string;
  pageToken: string;
  pageName: string;
  leadForms: any[];
}

function DirectLeadFormSelector({ pageId, pageToken, pageName, leadForms }: DirectLeadFormSelectorProps) {
  return (
    <LeadFormSelector 
      forms={leadForms}
      pageId={pageId}
      pageName={pageName}
      pageToken={pageToken}
    />
  );
}