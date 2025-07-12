import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTransactions } from '@/lib/data';
import { CATEGORY_ICONS } from '@/lib/constants';

export function RecentTransactions() {
  const recentTransactions = mockTransactions.slice(0, 5);

  const formatCurrency = (amount: number, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>You have {mockTransactions.length} transactions this month.</CardDescription>
      </CardHeader>
      <CardContent>
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
                  <p className="text-sm text-muted-foreground">{transaction.category}</p>
                </div>
                <div
                  className={`ml-auto font-medium ${
                    transaction.type === 'income' ? 'text-green-500' : ''
                  }`}
                >
                  {formatCurrency(transaction.amount, transaction.type)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
