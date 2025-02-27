"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AccountFormProps {
  onAccountAdded: () => void;
}

export function AccountForm({ onAccountAdded }: AccountFormProps) {
  const [accountName, setAccountName] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [shortLivedToken, setShortLivedToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountName.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    if (!appId.trim()) {
      toast.error('Please enter an App ID');
      return;
    }

    if (!appSecret.trim()) {
      toast.error('Please enter an App Secret');
      return;
    }

    if (!shortLivedToken.trim()) {
      toast.error('Please enter a Short-lived Token');
      return;
    }

    try {
      setLoading(true);
      
      const accountId = uuidv4();
      console.log('Creating account with ID:', accountId);
      
      const accountData = {
        id: accountId,
        name: accountName,
        appId,
        appSecret,
        shortLivedToken,
        pages: [],
        longLivedToken: '',
        longLivedTokenExpiry: ''
      };
      
      console.log('Sending account data:', JSON.stringify(accountData));
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', responseData);
        throw new Error(responseData.error || 'Failed to add account');
      }
      
      console.log('Account added successfully:', responseData);
      toast.success('Account added successfully');
      
      // Reset form
      setAccountName('');
      setAppId('');
      setAppSecret('');
      setShortLivedToken('');
      
      // Notify parent component
      onAccountAdded();
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast.error(error.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Account</CardTitle>
        <CardDescription>Enter your Facebook App details to add a new account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              placeholder="Enter a name for this account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              placeholder="Enter your Facebook App ID"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="appSecret">App Secret</Label>
            <Input
              id="appSecret"
              placeholder="Enter your Facebook App Secret"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              type="password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shortLivedToken">Short-lived Token</Label>
            <Input
              id="shortLivedToken"
              placeholder="Enter your short-lived access token"
              value={shortLivedToken}
              onChange={(e) => setShortLivedToken(e.target.value)}
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Get this from the Facebook Graph API Explorer
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Account...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}