'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BalanceDisplayProps {
  account: {
    id: string;
    name: string;
    ad_account_id: string;
  };
}

export function BalanceDisplay({ account }: BalanceDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<{
    amount: number;
    currency: string;
    formattedBalance: string;
  } | null>(null);

  const checkBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/balance?accountId=${account.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      setBalance(data);
    } catch (error: any) {
      console.error('Error checking balance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check balance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Ad Account ID: {account.ad_account_id}
      </div>
      
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={checkBalance}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Check Balance
        </Button>

        {balance && (
          <div className="text-right">
            <div className="font-medium">{balance.formattedBalance}</div>
            <div className="text-sm text-muted-foreground">
              {balance.currency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 