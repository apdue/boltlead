'use client';

import { FBBalanceForm } from '@/components/fb-balance-form';
import { BalanceDisplay } from '@/components/balance-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

export default function BalanceChecker() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fb_balance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountAdded = () => {
    fetchAccounts();
    setActiveTab('accounts');
    toast({
      title: 'Success',
      description: 'Account added successfully! You can now check the balance.'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Facebook Balance Checker</CardTitle>
          <CardDescription>
            Add and manage your Facebook accounts to check ad balances
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">View Accounts</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="add-account">Add Account</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Facebook Accounts</CardTitle>
              <CardDescription>Manage your Facebook accounts for balance checking</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No accounts added yet. Add an account to start checking balances.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accounts.map((account) => (
                    <Card key={account.id} className="relative">
                      <CardContent className="p-4">
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Ad Account ID: {account.ad_account_id}
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/balance?accountId=${account.id}`);
                                const data = await response.json();
                                
                                if (!response.ok) {
                                  throw new Error(data.error || 'Failed to fetch balance');
                                }
                                
                                toast({
                                  title: 'Balance Information',
                                  description: `${data.formattedBalance} (${data.currency || 'USD'})`,
                                });
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error.message,
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <Loader2 className="mr-2 h-4 w-4" />
                            Check Balance
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('fb_balance_accounts')
                                    .delete()
                                    .eq('id', account.id);
                                  
                                  if (error) throw error;
                                  
                                  fetchAccounts();
                                  toast({
                                    title: 'Success',
                                    description: 'Account deleted successfully'
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: 'Error',
                                    description: error.message || 'Failed to delete account',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAccount(account);
                                setActiveTab('edit-account');
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>View your Facebook ad account balances</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No accounts added yet. Add an account to start checking balances.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accounts.map((account) => (
                    <Card key={account.id} className="relative">
                      <CardContent className="p-4">
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Ad Account ID: {account.ad_account_id}
                        </div>
                        <div className="mt-4 flex items-center justify-center">
                          <BalanceDisplay accountId={account.id} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-account" className="mt-4">
          <FBBalanceForm onAccountAdded={handleAccountAdded} />
        </TabsContent>

        <TabsContent value="edit-account" className="mt-4">
          {editingAccount && (
            <FBBalanceForm 
              onAccountAdded={handleAccountAdded}
              initialData={editingAccount}
              isEditing={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}