import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_ICONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Sort by date and get the 5 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatTransactionAmount = (transaction: Transaction) => {
    const currency = transaction.currency || 'USD';
    const formatted = formatCurrency(transaction.amount, currency);
    return transaction.type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const getCurrentMonthCount = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter(t => new Date(t.date) >= startOfMonth).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          You have {getCurrentMonthCount()} transactions this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <div className="space-y-6">
            {recentTransactions.map((transaction) => {
              const Icon = CATEGORY_ICONS[transaction.category];
              return (
                <div key={transaction.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`ml-auto font-medium ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatTransactionAmount(transaction)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first transaction to see it here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
