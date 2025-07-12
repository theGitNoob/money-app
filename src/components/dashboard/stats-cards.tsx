import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, Currency } from '@/lib/types';

interface StatsCardsProps {
  transactions: Transaction[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
  // Group transactions by currency and calculate totals
  const currencyTotals = transactions.reduce((acc, transaction) => {
    const currency = transaction.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = { income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[currency].income += transaction.amount;
    } else {
      acc[currency].expenses += transaction.amount;
    }
    
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  // Get the main currency (the one with the most transactions)
  const mainCurrency: Currency = Object.keys(currencyTotals).length > 0 
    ? (Object.keys(currencyTotals).reduce((a, b) => 
        (transactions.filter(t => (t.currency || 'USD') === a).length > 
         transactions.filter(t => (t.currency || 'USD') === b).length) ? a : b
      ) as Currency)
    : 'USD';

  const totalIncome = currencyTotals[mainCurrency]?.income || 0;
  const totalExpenses = currencyTotals[mainCurrency]?.expenses || 0;
  const balance = totalIncome - totalExpenses;

  // Calculate month-over-month growth (simplified - comparing with previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const currentMonthTransactions = transactions.filter(t => t.date >= thirtyDaysAgo);
  const previousMonthTransactions = transactions.filter(t => t.date >= sixtyDaysAgo && t.date < thirtyDaysAgo);

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income' && (t.currency || 'USD') === mainCurrency)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousMonthIncome = previousMonthTransactions
    .filter(t => t.type === 'income' && (t.currency || 'USD') === mainCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense' && (t.currency || 'USD') === mainCurrency)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense' && (t.currency || 'USD') === mainCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeGrowth = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome * 100)
    : 0;

  const expenseGrowth = previousMonthExpenses > 0 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome, mainCurrency)}</div>
          <p className="text-xs text-muted-foreground">
            {incomeGrowth >= 0 ? '+' : ''}{incomeGrowth.toFixed(1)}% from last period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses, mainCurrency)}</div>
          <p className="text-xs text-muted-foreground">
            {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}% from last period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance, mainCurrency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Object.keys(currencyTotals).length > 1 && (
              `Showing ${mainCurrency} • ${Object.keys(currencyTotals).length} currencies`
            )}
            {Object.keys(currencyTotals).length <= 1 && 'Your current balance'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
