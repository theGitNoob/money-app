'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import { getTransactions } from '@/lib/transactions';
import { formatCurrency } from '@/lib/utils';
import { CATEGORIES, CURRENCY_SYMBOLS } from '@/lib/constants';
import type { Transaction, Currency } from '@/lib/types';
import { Printer, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type DateRange = {
  from: Date;
  to: Date;
};

type ReportPeriod = 'current-month' | 'last-month' | 'current-year' | 'last-year' | 'custom';

export default function ReportsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('current-month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    updateDateRange();
  }, [selectedPeriod]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDateRange = () => {
    const now = new Date();
    let from: Date, to: Date;

    switch (selectedPeriod) {
      case 'current-month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last-month':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'current-year':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'last-year':
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      default:
        return; // Keep existing range for custom
    }

    setDateRange({ from, to });
  };

  // Filter transactions based on date range and currency
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const withinDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    const matchesCurrency = selectedCurrency === 'all' || transaction.currency === selectedCurrency;
    return withinDateRange && matchesCurrency;
  });

  // Get all currencies used in filtered transactions
  const usedCurrencies = Array.from(new Set(filteredTransactions.map(t => t.currency || 'USD')));

  // Calculate totals by currency
  const currencyTotals = filteredTransactions.reduce((acc, transaction) => {
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

  // Calculate category breakdown
  const categoryBreakdown = filteredTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    const currency = transaction.currency || 'USD';
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][currency]) {
      acc[category][currency] = { income: 0, expenses: 0, count: 0 };
    }
    
    if (transaction.type === 'income') {
      acc[category][currency].income += transaction.amount;
    } else {
      acc[category][currency].expenses += transaction.amount;
    }
    acc[category][currency].count++;
    
    return acc;
  }, {} as Record<string, Record<string, { income: number; expenses: number; count: number }>>);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        `"${t.description}"`,
        t.category,
        t.type,
        t.amount,
        t.currency || 'USD'
      ].join(','))
    ].join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current-month':
        return `${format(dateRange.from, 'MMMM yyyy')}`;
      case 'last-month':
        return `${format(dateRange.from, 'MMMM yyyy')}`;
      case 'current-year':
        return `${format(dateRange.from, 'yyyy')}`;
      case 'last-year':
        return `${format(dateRange.from, 'yyyy')}`;
      case 'custom':
        return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div className="print-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Report</h1>
            <p className="text-muted-foreground">
              Summary for {getPeriodLabel()} • {filteredTransactions.length} transactions
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Period</label>
                <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="current-year">Current Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriod === 'custom' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to });
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Currency</label>
                <Select value={selectedCurrency} onValueChange={(value: Currency | 'all') => setSelectedCurrency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {usedCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency} ({CURRENCY_SYMBOLS[currency as Currency]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="print-card mb-6">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Overview of income, expenses, and balance by currency</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(currencyTotals).map(([currency, totals]) => (
              <div key={currency} className="mb-4 space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{currency}</h4>
                  <Badge variant="outline">{CURRENCY_SYMBOLS[currency as Currency]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Income:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(totals.income, currency as Currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(totals.expenses, currency as Currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Net Balance:</span>
                  <span className={totals.income - totals.expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(totals.income - totals.expenses, currency as Currency)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="print-card mb-6">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Spending and income by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([category, currencies]) => (
                <div key={category} className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">{category}</h4>
                  {Object.entries(currencies).map(([currency, data]) => (
                    <div key={currency} className="mb-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{currency}</span>
                        <Badge variant="secondary">{data.count} transactions</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-1">
                        {data.income > 0 && (
                          <div className="text-green-600">
                            Income: {formatCurrency(data.income, currency as Currency)}
                          </div>
                        )}
                        {data.expenses > 0 && (
                          <div className="text-red-600">
                            Expenses: {formatCurrency(data.expenses, currency as Currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="print-card">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Complete list of transactions for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="space-y-2 p-4">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions found for the selected period and filters.
                  </p>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <React.Fragment key={transaction.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transaction.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.currency || 'USD'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.category}
                          </p>
                          {transaction.hasItemDetails && transaction.items && transaction.items.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {transaction.items.slice(0, 2).map((item, idx) => (
                                <div key={idx}>
                                  {item.quantity} {item.unit} {item.description} @ {formatCurrency(item.unitPrice, transaction.currency || 'USD')}
                                </div>
                              ))}
                              {transaction.items.length > 2 && (
                                <div>+{transaction.items.length - 2} more items</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, transaction.currency || 'USD')}
                        </div>
                      </div>
                      {index < filteredTransactions.length - 1 && <Separator />}
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
