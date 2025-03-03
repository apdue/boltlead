'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  adAccountId: z.string().min(1, 'Ad Account ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
});

interface FBBalanceFormProps {
  onAccountAdded: () => void;
  editingAccount?: {
    id: string;
    name: string;
    ad_account_id: string;
    access_token: string;
  } | null;
  onAccountUpdated?: () => void;
}

export function FBBalanceForm({ onAccountAdded, editingAccount, onAccountUpdated }: FBBalanceFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      adAccountId: '',
      accessToken: '',
    },
  });

  useEffect(() => {
    if (editingAccount) {
      form.reset({
        name: editingAccount.name,
        adAccountId: editingAccount.ad_account_id,
        accessToken: editingAccount.access_token,
      });
    }
  }, [editingAccount, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (editingAccount) {
        const { error } = await supabase
          .from('fb_balance_accounts')
          .update({
            name: values.name,
            ad_account_id: values.adAccountId,
            access_token: values.accessToken,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAccount.id);

        if (error) {
          throw error;
        }

        onAccountUpdated?.();
      } else {
        const { error } = await supabase
          .from('fb_balance_accounts')
          .insert({
            name: values.name,
            ad_account_id: values.adAccountId,
            access_token: values.accessToken,
          });

        if (error) {
          throw error;
        }

        onAccountAdded();
      }

      form.reset();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</CardTitle>
        <CardDescription>
          {editingAccount
            ? 'Update your Facebook account details'
            : 'Enter your Facebook account details to check balances'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Facebook Account" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Account ID</FormLabel>
                  <FormControl>
                    <Input placeholder="act_123456789" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Facebook Ad Account ID (starts with 'act_')
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Facebook API access token with ads_read permission
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccount ? 'Update Account' : 'Add Account'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 