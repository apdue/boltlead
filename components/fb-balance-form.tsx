'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FBBalanceFormProps {
  onAccountAdded?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function FBBalanceForm({ onAccountAdded, initialData, isEditing }: FBBalanceFormProps) {
  const [accountName, setAccountName] = useState(initialData?.name || '');
  const [appId, setAppId] = useState(initialData?.app_id || '');
  const [adAccountId, setAdAccountId] = useState(initialData?.ad_account_id || '');
  const [accessToken, setAccessToken] = useState(initialData?.access_token || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an account name',
        variant: 'destructive'
      });
      return;
    }

    if (!appId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an App ID',
        variant: 'destructive'
      });
      return;
    }

    if (!adAccountId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an Ad Account ID',
        variant: 'destructive'
      });
      return;
    }

    if (!accessToken.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an Access Token',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const accountData = {
        name: accountName,
        app_id: appId,
        ad_account_id: adAccountId,
        access_token: accessToken
      };
      
      const { error } = isEditing
        ? await supabase
            .from('fb_balance_accounts')
            .update(accountData)
            .eq('id', initialData.id)
        : await supabase
            .from('fb_balance_accounts')
            .insert({ ...accountData, id: uuidv4() });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Account added successfully',
      });
      
      // Reset form
      setAccountName('');
      setAppId('');
      setAdAccountId('');
      setAccessToken('');
      
      // Notify parent component
      if (onAccountAdded) {
        onAccountAdded();
      }
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Facebook Account' : 'Add New Facebook Account'}</CardTitle>
        <CardDescription>Enter your Facebook account details to check ad balance</CardDescription>
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
            <Label htmlFor="adAccountId">Ad Account ID</Label>
            <Input
              id="adAccountId"
              placeholder="Enter your Facebook Ad Account ID"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              placeholder="Enter your access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
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
                {isEditing ? 'Update Account' : 'Add Account'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}