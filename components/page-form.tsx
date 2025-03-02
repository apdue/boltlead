"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Account {
  id: string;
  name: string;
}

interface PageFormProps {
  accountId: string;
  onPageAdded: () => void;
  accounts: Account[];
}

export function PageForm({ accountId, onPageAdded, accounts }: PageFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageToken, setPageToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    if (!pageName.trim()) {
      toast.error('Please enter a page name');
      return;
    }

    if (!pageId.trim()) {
      toast.error('Please enter a Page ID');
      return;
    }

    if (!pageToken.trim()) {
      toast.error('Please enter a Page Access Token');
      return;
    }

    try {
      setLoading(true);
      
      // Format the data to match what the API expects
      const pageData = {
        accountId: selectedAccountId,
        pageId: pageId,
        pageName: pageName,
        accessToken: pageToken,
        isPermanent: false
      };
      
      console.log('Sending page data:', JSON.stringify(pageData));
      
      const response = await fetch('/api/accounts/add-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', responseData);
        throw new Error(responseData.message || 'Failed to add page');
      }
      
      // Reset form
      setPageName('');
      setPageId('');
      setPageToken('');
      
      // Notify parent component
      onPageAdded();
      
      toast.success('Page added successfully!');
    } catch (error: any) {
      console.error('Error adding page:', error);
      toast.error(error.message || 'Failed to add page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Page</CardTitle>
        <CardDescription>Enter your Facebook Page details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountSelect">Select Account</Label>
            <Select 
              value={selectedAccountId} 
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger id="accountSelect">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
            <Label htmlFor="pageId">Page ID</Label>
            <Input
              id="pageId"
              placeholder="Enter your Facebook Page ID"
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
              Get this from the Facebook Graph API Explorer or your app's Page Access Tokens
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={loading || !selectedAccountId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Page...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}