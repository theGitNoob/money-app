'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_ICONS, CURRENCY_SYMBOLS } from '@/lib/constants';
import type { Transaction, Group, Currency, Category } from '@/lib/types';
import { startOfMonth, endOfMonth, format, startOfWeek, endOfWeek } from 'date-fns';

interface GroupDashboardProps {
  transactions: Transaction[];
  group: Group;
}

export function GroupDashboard({ transactions, group }: GroupDashboardProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  // Filter transactions for current month and week
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const weekTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= weekStart && date <= weekEnd;
  });

  // Calculate currency totals
  const currencyTotals = transactions.reduce((acc, transaction) => {
    const currency = transaction.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = { 
        income: 0, 
        expenses: 0,
        monthIncome: 0,
        monthExpenses: 0,
        weekIncome: 0,
        weekExpenses: 0
      };
    }
    
    if (transaction.type === 'income') {
      acc[currency].income += transaction.amount;
    } else {
      acc[currency].expenses += transaction.amount;
    }
    
    return acc;
  }, {} as Record<string, { 
    income: number; 
    expenses: number; 
    monthIncome: number; 
    monthExpenses: number;
    weekIncome: number;
    weekExpenses: number;
  }>);

  // Calculate month totals
  monthTransactions.forEach(transaction => {
    const currency = transaction.currency || 'USD';
    if (transaction.type === 'income') {
      currencyTotals[currency].monthIncome += transaction.amount;
    } else {
      currencyTotals[currency].monthExpenses += transaction.amount;
    }
  });

  // Calculate week totals
  weekTransactions.forEach(transaction => {
    const currency = transaction.currency || 'USD';
    if (transaction.type === 'income') {
      currencyTotals[currency].weekIncome += transaction.amount;
    } else {
      currencyTotals[currency].weekExpenses += transaction.amount;
    }
  });

  // Calculate category breakdown for current month
  const categoryBreakdown = monthTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    const currency = transaction.currency || 'USD';
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][currency]) {
      acc[category][currency] = { amount: 0, count: 0 };
    }
    
    acc[category][currency].amount += transaction.amount;
    acc[category][currency].count++;
    
    return acc;
  }, {} as Record<string, Record<string, { amount: number; count: number }>>);

  // Get top spending categories
  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, currencies]) => {
      const totalAmount = Object.values(currencies).reduce((sum, curr) => sum + curr.amount, 0);
      const totalCount = Object.values(currencies).reduce((sum, curr) => sum + curr.count, 0);
      return { category: category as Category, totalAmount, totalCount, currencies };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  // Calculate member contribution stats
  const memberStats = group.members.map(member => {
    const memberTransactions = transactions.filter(t => t.createdBy === member.userId);
    const totalAmount = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = memberTransactions.length;
    
    return {
      ...member,
      totalAmount,
      transactionCount,
      avgTransaction: transactionCount > 0 ? totalAmount / transactionCount : 0
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.members.length}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Transactions recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currencies</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(currencyTotals).length}</div>
            <p className="text-xs text-muted-foreground">
              Different currencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary by Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Group finances by currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(currencyTotals).map(([currency, totals]) => (
              <div key={currency} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    {currency}
                    <Badge variant="outline">{CURRENCY_SYMBOLS[currency as Currency]}</Badge>
                  </h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Income</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(totals.income, currency as Currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Expenses</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(totals.expenses, currency as Currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Balance</p>
                    <p className={`font-medium ${
                      totals.income - totals.expenses >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totals.income - totals.expenses, currency as Currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">This Month</p>
                    <p className="font-medium">
                      {formatCurrency(totals.monthIncome - totals.monthExpenses, currency as Currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">This Week</p>
                    <p className="font-medium">
                      {formatCurrency(totals.weekIncome - totals.weekExpenses, currency as Currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Categories This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories This Month</CardTitle>
          <CardDescription>Most used expense categories in {format(now, 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCategories.map(({ category, totalAmount, totalCount, currencies }, index) => {
              const Icon = CATEGORY_ICONS[category];
              const maxAmount = topCategories[0]?.totalAmount || 1;
              const percentage = (totalAmount / maxAmount) * 100;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalCount} transactions
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(currencies).map(([curr, data]) => (
                        <span key={curr} className="ml-2">
                          {formatCurrency(data.amount, curr as Currency)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Member Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Member Contributions</CardTitle>
          <CardDescription>Transaction activity by group members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberStats.map((member, index) => (
              <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {member.role === 'admin' && (
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{member.transactionCount} transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {formatCurrency(member.avgTransaction, 'USD')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
