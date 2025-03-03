export interface AdAccount {
  account_id: string;
  name: string;
  account_status: number;
  amount_spent: number;
  balance: number;
  currency: string;
  disable_reason: number | null;
}

export interface AdAccountData {
  data: AdAccount[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
} 