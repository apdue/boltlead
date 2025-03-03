"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Facebook, Edit, MoreVertical } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Account {
  id: string;
  name: string;
  app_id: string;
  app_secret: string;
  short_lived_token: string;
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
  accountId?: string;
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
          accountName: account.name,
          accountId: account.id
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allPages, setAllPages] = useState<DirectPage[]>([]);
  const [accountGroups, setAccountGroups] = useState<Record<string, DirectPage[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit account dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editAccountName, setEditAccountName] = useState<string>('');
  const [editAppId, setEditAppId] = useState<string>('');
  const [editAppSecret, setEditAppSecret] = useState<string>('');
  const [editToken, setEditToken] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Delete account dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string>('');
  const [deleteAccountName, setDeleteAccountName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load accounts from API
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
  
  useEffect(() => {
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
  
  const handleEditAccount = (accountName: string) => {
    const account = accounts.find(a => a.name === accountName);
    if (account) {
      setEditAccountId(account.id);
      setEditAccountName(account.name);
      setEditAppId(account.app_id);
      setEditAppSecret(account.app_secret);
      setEditToken(account.short_lived_token);
      setEditDialogOpen(true);
    }
  };
  
  const handleSaveAccountEdit = async () => {
    if (!editAccountId || !editAccountName) {
      toast.error('Account ID and name are required');
      return;
    }
    
    setIsEditing(true);
    try {
      const response = await fetch('/api/accounts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editAccountId,
          name: editAccountName,
          appId: editAppId,
          appSecret: editAppSecret,
          shortLivedToken: editToken,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }
      
      toast.success('Account updated successfully');
      setEditDialogOpen(false);
      
      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleDeleteAccount = (accountName: string) => {
    const account = accounts.find(a => a.name === accountName);
    if (account) {
      setDeleteAccountId(account.id);
      setDeleteAccountName(account.name);
      setDeleteDialogOpen(true);
    }
  };
  
  const confirmDeleteAccount = async () => {
    if (!deleteAccountId) {
      toast.error('Account ID is required');
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/accounts?id=${deleteAccountId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      
      toast.success('Account deleted successfully');
      setDeleteDialogOpen(false);
      
      // Reset states if the deleted account was selected
      if (selectedAccount === deleteAccountName) {
        setSelectedAccount('');
        setSelectedPageId('');
        setConnected(false);
        setLeadForms([]);
      }
      
      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="accountSelect">Select Account</Label>
                  {selectedAccount && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditAccount(selectedAccount)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Account
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAccount(selectedAccount)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
      
      {/* Add Lead Form Dialog */}
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
      
      {/* Edit Account Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Make changes to your account details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editAccountName}
                onChange={(e) => setEditAccountName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appId" className="text-right">
                App ID
              </Label>
              <Input
                id="appId"
                value={editAppId}
                onChange={(e) => setEditAppId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appSecret" className="text-right">
                App Secret
              </Label>
              <Input
                id="appSecret"
                type="password"
                value={editAppSecret}
                onChange={(e) => setEditAppSecret(e.target.value)}
                className="col-span-3"
              />
            </div>
            {/* Token field is hidden but still maintained in state for functionality */}
            <input
              type="hidden"
              id="token"
              value={editToken}
              onChange={(e) => setEditToken(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccountEdit} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account "{deleteAccountName}" and all its associated pages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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