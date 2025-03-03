'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BalanceDisplayProps {
  accountId: string;
}

export function BalanceDisplay({ accountId }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/balance?accountId=${accountId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch balance');
        }
        
        setBalance(`${data.formattedBalance} (${data.currency || 'USD'})`);
      } catch (error: any) {
        console.error('Error fetching balance:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        setBalance('Error loading balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [accountId]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  }

  return (
    <div className="text-lg font-semibold text-primary">
      {balance}
    </div>
  );
}