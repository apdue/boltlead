"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageSelector } from '@/components/page-selector';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Account {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  shortLivedToken: string;
  longLivedToken: string;
  longLivedTokenExpiry: string;
  pages: Page[];
}

interface Page {
  id: string;
  name: string;
  access_token: string;
}

export function AccountSelector() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'expired' | 'unknown'>('unknown');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        const data = await response.json();
        
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          setCurrentAccountId(data.currentAccountId || data.accounts[0].id);
          
          // Check token expiry for current account
          const currentAccount = data.accounts.find((acc: Account) => acc.id === data.currentAccountId);
          if (currentAccount) {
            const expiryDate = new Date(currentAccount.longLivedTokenExpiry);
            const now = new Date();
            setTokenStatus(expiryDate > now ? 'valid' : 'expired');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleAccountChange = async (accountId: string) => {
    try {
      setCurrentAccountId(accountId);
      
      const response = await fetch('/api/accounts/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update current account');
      }
      
      // Check token expiry for selected account
      const selectedAccount = accounts.find(acc => acc.id === accountId);
      if (selectedAccount) {
        const expiryDate = new Date(selectedAccount.longLivedTokenExpiry);
        const now = new Date();
        setTokenStatus(expiryDate > now ? 'valid' : 'expired');
      }
      
      toast.success(`Switched to account: ${accounts.find(acc => acc.id === accountId)?.name}`);
    } catch (error) {
      console.error('Error setting current account:', error);
      toast.error('Failed to switch account');
    }
  };

  const refreshToken = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: currentAccountId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Update accounts with new token data
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => 
          acc.id === currentAccountId ? { ...acc, ...data.account } : acc
        )
      );
      
      setTokenStatus('valid');
      toast.success('Token refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      toast.error(error.message || 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Accounts</CardTitle>
          <CardDescription>Please wait while we load your Facebook accounts</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Accounts Found</CardTitle>
          <CardDescription>Please add a Facebook account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Go to the "Add Account" tab to create your first account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentAccount = accounts.find(acc => acc.id === currentAccountId);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Facebook Account</CardTitle>
          <CardDescription>Choose an account to manage lead forms</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentAccountId} onValueChange={handleAccountChange}>
            <SelectTrigger>
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
          
          {currentAccount && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Status:</span>
                <span className={`text-sm ${tokenStatus === 'valid' ? 'text-green-500' : 'text-red-500'}`}>
                  {tokenStatus === 'valid' ? 'Valid' : 'Expired'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expiry Date:</span>
                <span className="text-sm">
                  {currentAccount.longLivedTokenExpiry ? 
                    new Date(currentAccount.longLivedTokenExpiry).toLocaleDateString() : 
                    'Not set'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={refreshToken} 
            disabled={loading || !currentAccount}
            variant={tokenStatus === 'expired' ? 'destructive' : 'outline'}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing Token
              </>
            ) : (
              'Refresh Token'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {currentAccount && (currentAccount.pages?.length > 0 || tokenStatus === 'valid') && (
        <PageSelector account={currentAccount} accounts={accounts} />
      )}
    </div>
  );
}