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
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardShell } from '@/components/dashboard-shell';

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
      description: 'Account added successfully'
    });
  };

  const handleAccountDeleted = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('fb_balance_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        throw error;
      }

      fetchAccounts();
      toast({
        title: 'Success',
        description: 'Account deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive'
      });
    }
  };

  const handleAccountUpdated = () => {
    fetchAccounts();
    setEditingAccount(null);
    toast({
      title: 'Success',
      description: 'Account updated successfully'
    });
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Balance Checker"
        text="Manage Facebook accounts and check their balances"
      />
      <div className="grid gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accounts">View Accounts</TabsTrigger>
            <TabsTrigger value="add-account">Add Account</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No accounts found. Add an account to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAccountDeleted(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BalanceDisplay account={account} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-account">
            <FBBalanceForm
              onAccountAdded={handleAccountAdded}
              editingAccount={editingAccount}
              onAccountUpdated={handleAccountUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
} 