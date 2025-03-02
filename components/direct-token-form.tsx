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
  const [savedPages, setSavedPages] = useState<DirectPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [pageName, setPageName] = useState<string>('');
  const [pageToken, setPageToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [leadForms, setLeadForms] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [mounted, setMounted] = useState(false);
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

  // Load saved pages from localStorage on component mount
  useEffect(() => {
    setMounted(true);
    const storedPages = localStorage.getItem('directPages');
    if (storedPages) {
      try {
        const parsedPages = JSON.parse(storedPages);
        setSavedPages(parsedPages);
      } catch (error) {
        console.error('Error parsing stored pages:', error);
        // If there's an error parsing, initialize with empty array
        setSavedPages([]);
      }
    }
  }, []);

  // Save pages to localStorage whenever they change
  useEffect(() => {
    if (mounted && savedPages.length > 0) {
      localStorage.setItem('directPages', JSON.stringify(savedPages));
    }
  }, [savedPages, mounted]);

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    setSelectedPageId('');
    setPageId('');
    setPageName('');
    setPageToken('');
  };

  const handlePageSelect = (value: string) => {
    setSelectedPageId(value);
    const selectedPage = allPages.find(p => p.id === value);
    if (selectedPage) {
      setPageId(value.includes('-') ? value.split('-')[0] : value);
      setPageName(selectedPage.name);
      setPageToken(selectedPage.access_token);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset form when switching tabs
    if (value === 'manual') {
      setPageId('');
      setPageName('');
      setPageToken('');
    }
  };

  const handleSavePage = () => {
    if (!pageId || !pageName || !pageToken) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if page already exists in saved pages
    const existingPageIndex = savedPages.findIndex(p => p.id === pageId);
    
    if (existingPageIndex !== -1) {
      // Update existing page
      const updatedPages = [...savedPages];
      updatedPages[existingPageIndex] = {
        id: pageId,
        name: pageName,
        access_token: pageToken,
        accountName: selectedAccount || 'Manual Entry'
      };
      setSavedPages(updatedPages);
      toast.success('Page updated successfully');
    } else {
      // Add new page
      setSavedPages([
        ...savedPages,
        {
          id: pageId,
          name: pageName,
          access_token: pageToken,
          accountName: selectedAccount || 'Manual Entry'
        }
      ]);
      toast.success('Page saved successfully');
    }

    // Reset form
    setPageId('');
    setPageName('');
    setPageToken('');
  };

  const handleDeletePage = (id: string) => {
    setSavedPages(savedPages.filter(p => p.id !== id));
    toast.success('Page removed from saved list');
  };

  const handleConnect = async () => {
    if (!selectedPageId && !pageId) {
      toast.error('Please select or enter a page');
      return;
    }

    setLoading(true);
    try {
      // Use the selected page token or manually entered token
      const token = selectedPageId ? 
        allPages.find(p => p.id === selectedPageId)?.access_token : 
        pageToken;
      
      const id = selectedPageId || pageId;
      
      if (!token) {
        throw new Error('No access token found');
      }

      // Fetch lead forms for the page
      const response = await fetch(`/api/lead-forms?pageId=${id}&accessToken=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lead forms');
      }
      
      const data = await response.json();
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts">Account Pages</TabsTrigger>
              <TabsTrigger value="saved">Saved Pages</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accounts" className="mt-4">
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
            </TabsContent>
            
            <TabsContent value="saved" className="mt-4">
              {savedPages.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="savedPageSelect">Select Saved Page</Label>
                    <Select 
                      value={selectedPageId} 
                      onValueChange={handlePageSelect}
                    >
                      <SelectTrigger id="savedPageSelect">
                        <SelectValue placeholder="Select a saved page" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name} {page.accountName ? `(${page.accountName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPageId && (
                    <div className="p-4 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">
                          {savedPages.find(p => p.id === selectedPageId)?.name}
                        </h3>
                        {savedPages.find(p => p.id === selectedPageId)?.accountName && (
                          <Badge variant="outline" className="ml-auto">
                            {savedPages.find(p => p.id === selectedPageId)?.accountName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Page ID: {selectedPageId}
                      </p>
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeletePage(selectedPageId)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No saved pages yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('accounts')}
                  >
                    Select from accounts
                  </Button>
                  <span className="mx-2 text-muted-foreground">or</span>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('manual')}
                  >
                    Add manually
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageId">Page ID</Label>
                  <Input 
                    id="pageId" 
                    placeholder="Enter Facebook Page ID" 
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageName">Page Name</Label>
                  <Input 
                    id="pageName" 
                    placeholder="Enter Page Name" 
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageToken">Page Access Token</Label>
                  <Input 
                    id="pageToken" 
                    placeholder="Enter Page Access Token" 
                    value={pageToken}
                    onChange={(e) => setPageToken(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleSavePage}
                  disabled={!pageId || !pageName || !pageToken}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Page
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(true)}
            disabled={!selectedPageId && !pageId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead Form
          </Button>
          
          <Button 
            onClick={handleConnect}
            disabled={(!selectedPageId && !pageId) || loading}
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
              pageId={selectedPageId || pageId} 
              pageName={
                selectedPageId 
                  ? (allPages.find(p => p.id === selectedPageId)?.name || savedPages.find(p => p.id === selectedPageId)?.name || '') 
                  : pageName
              }
              pageToken={
                selectedPageId 
                  ? (allPages.find(p => p.id === selectedPageId)?.access_token || savedPages.find(p => p.id === selectedPageId)?.access_token || '') 
                  : pageToken
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
              <li>Select a page from your accounts or enter page details manually</li>
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