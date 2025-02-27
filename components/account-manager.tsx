"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountForm } from '@/components/account-form';
import { PageForm } from '@/components/page-form';
import { AccountSelector } from '@/components/account-selector';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

export function AccountManager() {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('accounts');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/accounts');
        const data = await response.json();
        
        setAccounts(data.accounts || []);
        
        if (data.accounts && data.accounts.length > 0) {
          setCurrentAccountId(data.currentAccountId || data.accounts[0].id);
        } else {
          setCurrentAccountId('');
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [refreshKey]);

  const handleAccountAdded = () => {
    // Refresh the account list
    setRefreshKey(prev => prev + 1);
    // Switch to the Add Page tab after adding an account
    setActiveTab('add-page');
    toast.success('Account added successfully! Now you can add a page to this account.');
  };

  const handlePageAdded = () => {
    // Refresh the account list
    setRefreshKey(prev => prev + 1);
    // Switch to the View Accounts tab after adding a page
    setActiveTab('accounts');
    toast.success('Page added successfully! You can now view and manage your leads.');
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

  return (
    <div className="grid gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">View Accounts</TabsTrigger>
          <TabsTrigger value="add-account">Add Account</TabsTrigger>
          <TabsTrigger value="add-page">Add Page</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="mt-4">
          <AccountSelector key={`account-selector-${refreshKey}`} />
        </TabsContent>
        
        <TabsContent value="add-account" className="mt-4">
          <AccountForm onAccountAdded={handleAccountAdded} />
        </TabsContent>
        
        <TabsContent value="add-page" className="mt-4">
          {accounts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Accounts Available</CardTitle>
                <CardDescription>You need to add an account before you can add a page</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="default" className="mt-2 border-yellow-500 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please go to the "Add Account" tab first to create an account.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <PageForm 
              accountId={currentAccountId} 
              onPageAdded={handlePageAdded} 
              accounts={accounts}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}