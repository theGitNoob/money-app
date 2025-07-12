'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { Transaction, Currency } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface OverviewChartProps {
  transactions: Transaction[];
}

export function OverviewChart({ transactions }: OverviewChartProps) {
  // Get the main currency for display
  const currencyUsage = transactions.reduce((acc, t) => {
    const currency = t.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mainCurrency: Currency = Object.keys(currencyUsage).length > 0 
    ? (Object.keys(currencyUsage).reduce((a, b) => currencyUsage[a] > currencyUsage[b] ? a : b) as Currency)
    : 'USD';

  // Filter expenses for the main currency and group by category
  const expenseData = transactions
    .filter((t: Transaction) => t.type === 'expense' && (t.currency || 'USD') === mainCurrency)
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.total += t.amount;
      } else {
        acc.push({ name: t.category, total: t.amount });
      }
      return acc;
    }, [] as { name: string; total: number }[])
    .sort((a, b) => b.total - a.total); // Sort by amount descending

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {formatCurrency(payload[0].value, mainCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>
          {expenseData.length > 0 
            ? `Your spending by category in ${mainCurrency}${Object.keys(currencyUsage).length > 1 ? ` (${Object.keys(currencyUsage).length} currencies total)` : ''}`
            : 'No expense data available yet'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {expenseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={expenseData}>
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, mainCurrency)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No expense data to display</p>
              <p className="text-xs mt-1">Add some expense transactions to see your spending overview</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
