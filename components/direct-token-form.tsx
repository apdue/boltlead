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

// Load accounts data from accounts.json
const accountsData = {
  "accounts": [
    {
      "id": "dry-first",
      "name": "Dry First",
      "appId": "2495054934033943",
      "appSecret": "e97ea0a2c6da408f90311e2fe4c877d1",
      "shortLivedToken": "EAAjdPT8JxhcBOZB1PgnkBUawXaTLE7PykYL1YRPAHJl2OrAhhvZBHZBhsfU2VhxyPMVoKskWYWGQ1VTiB9GBwpVmZARul5Q1h8mXZB7Ow3XIHsc6Ddp02Irkl0l2GbXBZBt9CQSeU61Iwqs7NL03xNhsdpWNckfqGnJSdItct7LG5sww6HdpX9yzC6CjPlayT1pyGDjaHXOqo0nS6qqUgKa8FJAhHno0TUwsgZD",
      "longLivedToken": "EAAjdPT8JxhcBOZBkICG0VF7hJeQVDxPQDefXZA9gHFLviQEzoM8JyWmB37gsnd5zZC2kH8VlOg7aZBMiX5cB6e4hJ1ltKutna7SqSdgZCZCru7n2KZC5BMA5RLhO8nmwAKFIo2GLAcpNmAmZBuh10YjcY1qsrZAH2ZBSTFEbEu1AydWYZAHVVU5vWWkA9itmKJVtDaS",
      "longLivedTokenExpiry": "2025-04-27T13:55:11.629Z",
      "pages": [
        {
          "id": "100868156163733",
          "name": "शिक्षा - Girdhari Sir",
          "access_token": "EAAjdPT8JxhcBO1UYjTLCeOTdwNh8PiRZA0VBDCyGRseoaOC9mqUmJCVPix3nkyf2hF5H5YcZAmt3RhDK5mPampEu7XBJ8QZCKVKiQwqKDhOU3qjjP4tiVHZC7sPZCvAMGBoNZASuBEtA2ZAermZCQO7rJK7PjmnargHhDVEYnTZAQFkh3YE3E8Q1axL60bKkZAQuFFauQN7wYZD"
        },
        {
          "id": "101245016125462",
          "name": "आयुर्वेदिक नुस्खे Anamika",
          "access_token": "EAAjdPT8JxhcBOxlK8jajR7BinECAZCguhqfupr4uPa9fC8eeZBlhq0XGkgyZCK9YkMJAeFYYH7O2SO0ES6ZBgzEiXzVIiSFKZAw7Qxw7SZAuk6gMGRxLwJadjPCsc6y2vPVowOrlps4OE0ooRfw0K1lY6MIxtrlU7UlRYOnryV7fjIommeInMzSb4AS9TaRbDKnn09YuwZD"
        }
      ]
    },
    {
      "id": "dry-2",
      "name": "Dry 2",
      "appId": "2495054934033943",
      "appSecret": "e97ea0a2c6da408f90311e2fe4c877d1",
      "shortLivedToken": "EAAjdPT8JxhcBOwe0AKzUoNOsZBCkjoflZC8fh2QQOgR5M0CWCDC97GULw8hWmV3D0JArVxZB88W3ZBZA629AaAeR36e2UmSCfPIg1gF3CoTZBA58LzoCCbyv8sXqK6DVsyVJsLl0sEuG3fVuP56P7BxLPXzhNchWkwUbk5j9KgNZCpS1bcWLPztwxeNPZBojxaQi4CBCZAZB23GKrVTmeeiO61io0JNZBKLLmmYF6YZD",
      "longLivedToken": "EAAjdPT8JxhcBO7LPDliBklfjHRMuY6K0iYqhWY5ni95eupUJYuMj24MZAGflK5eFdKzOcUUPspzn1phqNJZBCXEHZANA145aewVZB8xzmSN03YsFixcuSfSePn7rqZCO0Ylt57UfiN0A5xuyDx11iETIOGyTpEVelYO6qGnUNxZBLR5ggEVAdmmiY6a7TErrp2",
      "longLivedTokenExpiry": "2025-04-27T14:28:45.581Z",
      "pages": [
        {
          "id": "100868156163733",
          "name": "शिक्षा - Girdhari Sir",
          "access_token": "EAAjdPT8JxhcBO1yE7qsf0Ba7mp0g4KqwAXDG64mEKW6eZB05rfzWYIfYPFJPF5Nbf09ZCSlLQH0kjIVD5nWmAstbiepx3tS92FlHbZAZAGwdY0zZCK6COXQ4BdkjnTtRgRprjywaqjPwGg5IZAF0Vzd40vZBqBWn7YZBTPRchFVOhefapBIKng7B8hLHZCIvq3XnEjkUyDYoZD"
        },
        {
          "id": "101245016125462",
          "name": "आयुर्वेदिक नुस्खे Anamika",
          "access_token": "EAAjdPT8JxhcBO31zLgFVJZCPHlPddkoULpRZCuoPBCo6LWnuxZA1xw2NrTsor2nZChq62a5AENdoRx3pnS4XOuH7KKerb26IFkLLZCNIwAgPDzb1TAiGUefZCBUZCaTZBi6j7HEvvehMGZAhCTok3OzGIZAfLZAs3rQyZCP0ZBNxSFF192O8f85pZBH084lO1J0bKCb95vP1EX0KUZD"
        }
      ]
    },
    {
      "id": "aachar",
      "name": "Aachar",
      "appId": "1049094106958878",
      "appSecret": "da3443b0a4afd13b1a6fdd685ed0e1a6",
      "shortLivedToken": "EAAO6JUGUzB4BOwkGYgL7ynj7RWwD5WfQAVFmsZBUWbpbhZCPo5kT5IoIcar9TsOL76ZAeHWjp3oG8qYaX8ZCRNnwcfMkeJNvkNAxLU8ElweadZA6Osa20eIAmRxsXCGx9SNOES8ZAnC17qlJEqr1tOpg7jaqvZAz3DZAksgZAQi2LyKxGj0gZBMw7FDsJITSeCFDmLQ7KUsRV42wH4jD8T8kxkn4C6iesfXYqcZAXSLjPLY4tcPGHyrnZBsZD",
      "longLivedToken": "EAAO6JUGUzB4BO1a17OFiCUOzpZBP6KsSffS3OZAWozBERi8U1c8ZAleOL7dkJQflZAMWDEU11URYY1gSlvjuapjDbszPWTSNMqhTTzq9jE8hZB0N0CqFW1VIwzk51AvUqZClm3hZCWVX87nLJHjmLpf14z4qElWSLUKzusYwh5JzEEyDOXrZAxKsXkCsfkO39IJgMTVLp4GsHurQ2TZBEyolxkueoDFY1yjmDInUu0Xh9vTZA4DYsZCUlgZD",
      "longLivedTokenExpiry": "2025-02-26T22:00:00.000Z",
      "pages": [
        {
          "id": "448065431730618",
          "name": "राजस्थान का Oraras Ghee",
          "access_token": "EAAO6JUGUzB4BOy7WMBOl6twyUukpZAWF5inTYjP1nFEEnzciQWGHO97PklbZBk917CzRM5M3gV60WDVcuHJ1NfqsguWMBHBSreh2mtlZArxxsTLYN5yeDGeMnYiDs0Hp4MwDO4NXXWLEX89MOvxTXVg3CxwXBrADdlYAx2HIoN4UpFUHTB8pA6xXxIHSuvsJOMqG7MMUsT7tKhJZCEZCNgY1jhSeXK8lAXlDBnHds937f5YYr"
        },
        {
          "id": "425413393995495",
          "name": "राजस्थान का रेगिस्तानी अचार",
          "access_token": "EAAO6JUGUzB4BO1JP3k9cOHJEnLTforViMZC0HxdqVzED6qHKFwQfDM5EpUM8ws9mJuEBcDBOctswNCWsHnDZCiQjWBhBEJbBLyCWZAOpFkksRLPB0bunNsRK7pZAguQGZCHda1wMBr82gM9hdri08AoBIIVZBsfRU6ad94ZBRVq7QnRZAiwmQxYNJi5OreY8YUGvLZBAnoj19pQcFOQ6xNnqwxDapcvEqqekcmRqFSyt9vKDWCd0v"
        },
        {
          "id": "100517029593466",
          "name": "Child Education Group",
          "access_token": "EAAO6JUGUzB4BO2BeXZBzdYZCDgDWOdYtzlZBZCe2BrEodFkGclXgsEySuuTBMFb8OLNFUtvWIj5r7xVOdcDw8hH94cZCucZBU1YZCojzAZBxcvGMuuhcm8eTJJTzHj4HZCMVfAJZCWK8NB76u56xmVBaYzZCoxIZBUnDdhlPPyPR4ze95clkPvBp4RQixm6qOBXgMpollIPLPtrfyzNY7e4obyZAGySC93mtpMR14DZBFUJ68SPMAM0mAZD"
        },
        {
          "id": "104845322452731",
          "name": "Motivation Nature",
          "access_token": "EAAO6JUGUzB4BO5RYgWNELTekuXuE1vrbVALD0ZA8Lt0ZAc2nX7VZAZACCKzAEAIcHWt38ZAa22UWD5CwL5VKZCYpaOCpzaNL4EzQqoUp0dP9MM5Y9fneVyJvN3o8Nd2fTPRL63mjaudjg1mHnmp2HX6ezG872ya6CZBwFu9tGtkxapZC8QGRgJQpJojeNwNZBDaWb36rrrgG9pR04Tv46hZBWWuZCB1040Vz2Qu45v6oTpFFQ4AkJEZD"
        }
      ]
    }
  ],
  "currentAccountId": "aachar",
  "lastUpdated": "2025-02-27T06:34:34.687Z"
};

// Process accounts data to create a list of pages with account info
const allPages: DirectPage[] = [];
accountsData.accounts.forEach(account => {
  account.pages.forEach(page => {
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
});

// Group pages by account
const accountGroups = allPages.reduce((groups, page) => {
  const accountName = page.accountName || 'Other';
  if (!groups[accountName]) {
    groups[accountName] = [];
  }
  groups[accountName].push(page);
  return groups;
}, {} as Record<string, DirectPage[]>);

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
  const [selectedAccount, setSelectedAccount] = useState<string>('Aachar'); // Default to Aachar account

  // Load saved pages from localStorage on component mount
  useEffect(() => {
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
    if (savedPages.length > 0) {
      localStorage.setItem('directPages', JSON.stringify(savedPages));
    }
  }, [savedPages]);

  const handleConnect = async () => {
    let currentPageId = '';
    let currentPageToken = '';
    let currentPageName = '';

    if (selectedPageId) {
      // Use selected page from dropdown
      let selectedPage;
      
      if (activeTab === 'accounts') {
        selectedPage = allPages.find(page => page.id === selectedPageId);
      } else {
        selectedPage = savedPages.find(page => page.id === selectedPageId);
      }
      
      if (!selectedPage) {
        toast.error('Selected page not found');
        return;
      }
      
      // If the ID contains a hyphen (for duplicate IDs), extract the original ID
      const originalId = selectedPageId.includes('-') 
        ? selectedPageId.split('-')[0] 
        : selectedPageId;
      
      currentPageId = originalId;
      currentPageToken = selectedPage.access_token;
      currentPageName = selectedPage.name;
    } else {
      // Use manually entered details
      if (!pageId.trim()) {
        toast.error('Please enter a Page ID');
        return;
      }

      if (!pageToken.trim()) {
        toast.error('Please enter a Page Access Token');
        return;
      }

      if (!pageName.trim()) {
        toast.error('Please enter a Page Name');
        return;
      }

      currentPageId = pageId;
      currentPageToken = pageToken;
      currentPageName = pageName;
    }

    try {
      setLoading(true);
      
      // For static export, we need to directly call the Facebook Graph API
      const url = `https://graph.facebook.com/v19.0/${currentPageId}/leadgen_forms?access_token=${encodeURIComponent(currentPageToken)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Invalid response from Facebook API' } }));
        throw new Error(
          errorData.error?.message || 
          'Failed to connect with provided token'
        );
      }
      
      const data = await response.json().catch(() => ({ data: [] }));
      
      if (!data.data || data.data.length === 0) {
        toast.warning('Connected successfully, but no lead forms found for this page');
      } else {
        toast.success(`Connected successfully! Found ${data.data.length} lead forms`);
        setLeadForms(data.data);
      }
      
      // If using manually entered details and connection was successful, save the page
      if (!selectedPageId) {
        // Check if page already exists
        const existingPageIndex = savedPages.findIndex(page => page.id === currentPageId);
        
        if (existingPageIndex !== -1) {
          // Update existing page
          const updatedPages = [...savedPages];
          updatedPages[existingPageIndex] = {
            id: currentPageId,
            name: currentPageName,
            access_token: currentPageToken
          };
          setSavedPages(updatedPages);
          toast.success('Page details updated');
        } else {
          // Add new page
          setSavedPages([...savedPages, {
            id: currentPageId,
            name: currentPageName,
            access_token: currentPageToken
          }]);
          toast.success('Page saved for future use');
        }
        
        // Clear form
        setPageId('');
        setPageName('');
        setPageToken('');
      }
      
      setConnected(true);
      setSelectedPageId(selectedPageId || currentPageId);
    } catch (error: any) {
      console.error('Error connecting with token:', error.message || error);
      toast.error(error.message || 'Failed to connect with provided token. Please check your Page ID and Access Token.');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewPage = () => {
    setSelectedPageId('');
    setDialogOpen(true);
  };

  const handleSavePage = () => {
    if (!pageId.trim()) {
      toast.error('Please enter a Page ID');
      return;
    }

    if (!pageToken.trim()) {
      toast.error('Please enter a Page Access Token');
      return;
    }

    if (!pageName.trim()) {
      toast.error('Please enter a Page Name');
      return;
    }

    // Check if page already exists
    const existingPageIndex = savedPages.findIndex(page => page.id === pageId);
    
    if (existingPageIndex !== -1) {
      // Update existing page
      const updatedPages = [...savedPages];
      updatedPages[existingPageIndex] = {
        id: pageId,
        name: pageName,
        access_token: pageToken
      };
      setSavedPages(updatedPages);
      toast.success('Page details updated');
    } else {
      // Add new page
      setSavedPages([...savedPages, {
        id: pageId,
        name: pageName,
        access_token: pageToken
      }]);
      toast.success('Page added successfully');
    }
    
    // Clear form and close dialog
    setPageId('');
    setPageName('');
    setPageToken('');
    setDialogOpen(false);
  };

  const handleDeletePage = (id: string) => {
    const updatedPages = savedPages.filter(page => page.id !== id);
    setSavedPages(updatedPages);
    
    // If the deleted page was selected, reset selection
    if (selectedPageId === id) {
      setSelectedPageId('');
      setConnected(false);
    }
    
    // Update localStorage
    localStorage.setItem('directPages', JSON.stringify(updatedPages));
    toast.success('Page removed');
  };

  const handlePageSelect = (id: string) => {
    setSelectedPageId(id);
    setConnected(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedPageId('');
    setConnected(false);
  };

  const handleAccountChange = (accountName: string) => {
    setSelectedAccount(accountName);
    setSelectedPageId('');
    setConnected(false);
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
                
                <div className="space-y-2">
                  <Label htmlFor="accountPage">Select a Page from {selectedAccount}</Label>
                  <Select 
                    value={selectedPageId} 
                    onValueChange={handlePageSelect}
                  >
                    <SelectTrigger id="accountPage">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountGroups[selectedAccount]?.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
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
            </TabsContent>
            
            <TabsContent value="saved" className="mt-4">
              {savedPages.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="savedPage">Saved Pages</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedPageId} 
                      onValueChange={handlePageSelect}
                    >
                      <SelectTrigger id="savedPage" className="flex-1">
                        <SelectValue placeholder="Select a saved page" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={handleAddNewPage} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                  
                  {selectedPageId && (
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeletePage(selectedPageId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Page
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No saved pages found</p>
                  <Button onClick={handleAddNewPage} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Page
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageName">Page Name</Label>
                  <Input
                    id="pageName"
                    placeholder="Enter a name for this page"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageId">Facebook Page ID</Label>
                  <Input
                    id="pageId"
                    placeholder="Enter your Page ID"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageToken">Page Access Token</Label>
                  <Input
                    id="pageToken"
                    placeholder="Enter your Page Access Token"
                    value={pageToken}
                    onChange={(e) => setPageToken(e.target.value)}
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your token is stored locally and never sent to our servers
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Facebook Page</DialogTitle>
                <DialogDescription>
                  Enter your Facebook Page details to save for future use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dialogPageName">Page Name</Label>
                  <Input
                    id="dialogPageName"
                    placeholder="Enter a name for this page"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dialogPageId">Facebook Page ID</Label>
                  <Input
                    id="dialogPageId"
                    placeholder="Enter your Page ID"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dialogPageToken">Page Access Token</Label>
                  <Input
                    id="dialogPageToken"
                    placeholder="Enter your Page Access Token"
                    value={pageToken}
                    onChange={(e) => setPageToken(e.target.value)}
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your token is stored locally and never sent to our servers
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePage}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Page
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleConnect} 
            disabled={loading || (activeTab !== 'manual' && !selectedPageId)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {connected && selectedPageId && (
        <DirectLeadFormSelector 
          pageId={selectedPageId.includes('-') ? selectedPageId.split('-')[0] : selectedPageId} 
          pageToken={
            activeTab === 'accounts' 
              ? allPages.find(page => page.id === selectedPageId)?.access_token || ''
              : savedPages.find(page => page.id === selectedPageId)?.access_token || ''
          }
          pageName={
            activeTab === 'accounts'
              ? allPages.find(page => page.id === selectedPageId)?.name || ''
              : savedPages.find(page => page.id === selectedPageId)?.name || ''
          }
          leadForms={leadForms}
        />
      )}
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
  const page = {
    id: pageId,
    name: pageName,
    access_token: pageToken
  };
  
  return (
    <LeadFormSelector 
      page={page} 
      accountId="direct" 
      useDirectToken={true}
      initialLeadForms={leadForms}
    />
  );
}