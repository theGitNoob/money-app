'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';
import type { Transaction, Currency } from '@/lib/types';
import { AddGroupTransactionDialog } from './add-group-transaction-dialog';

interface GroupCalendarProps {
  transactions: Transaction[];
  groupId: string;
}

export function GroupCalendar({ transactions, groupId }: GroupCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | 'all'>('all');

  // Get all currencies used in transactions
  const usedCurrencies = Array.from(new Set(transactions.map(t => t.currency || 'USD'))) as Currency[];

  // Filter transactions by currency if selected
  const filteredTransactions = selectedCurrency === 'all' 
    ? transactions 
    : transactions.filter(t => (t.currency || 'USD') === selectedCurrency);

  // Get transactions for selected date
  const dayTransactions = filteredTransactions.filter(transaction =>
    isSameDay(new Date(transaction.date), selectedDate)
  );

  // Get transactions for current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthTransactions = filteredTransactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date >= monthStart && date <= monthEnd;
  });

  // Group transactions by date for the calendar
  const transactionsByDate = monthTransactions.reduce((acc, transaction) => {
    const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calculate daily totals
  const dailyTotals = Object.entries(transactionsByDate).reduce((acc, [date, dayTransactions]) => {
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    acc[date] = { income, expenses, net: income - expenses, count: dayTransactions.length };
    return acc;
  }, {} as Record<string, { income: number; expenses: number; net: number; count: number }>);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleRefresh = () => {
    // This would be called when a new transaction is added
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Group Calendar</CardTitle>
              <CardDescription>
                Track daily transactions and financial patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCurrency} onValueChange={(value: Currency | 'all') => setSelectedCurrency(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {usedCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AddGroupTransactionDialog 
                groupId={groupId}
                onTransactionAdded={handleRefresh}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const dayData = dailyTotals[dateKey];
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div
                    key={dateKey}
                    className={`
                      p-2 min-h-[80px] border rounded cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="text-sm font-medium">{format(date, 'd')}</div>
                    {dayData && (
                      <div className="mt-1 space-y-1">
                        <div className="text-xs">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {dayData.count}
                          </Badge>
                        </div>
                        {dayData.income > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            +{formatCurrency(dayData.income, selectedCurrency === 'all' ? 'USD' : selectedCurrency)}
                          </div>
                        )}
                        {dayData.expenses > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            -{formatCurrency(dayData.expenses, selectedCurrency === 'all' ? 'USD' : selectedCurrency)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
            <CardDescription>
              {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dayTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No transactions on this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayTransactions.map((transaction) => {
                  const Icon = CATEGORY_ICONS[transaction.category];
                  return (
                    <div key={transaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {transaction.currency || 'USD'}
                          </Badge>
                        </div>
                        {transaction.createdByName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            By {transaction.createdByName}
                          </p>
                        )}
                        {transaction.hasItemDetails && transaction.items && transaction.items.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {transaction.items.slice(0, 2).map((item, idx) => (
                              <div key={idx}>
                                {item.quantity} {item.unit} {item.description}
                              </div>
                            ))}
                            {transaction.items.length > 2 && (
                              <div>+{transaction.items.length - 2} more items</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency || 'USD')}
                      </div>
                    </div>
                  );
                })}
                
                {/* Day Summary */}
                <div className="pt-3 border-t">
                  <div className="space-y-1 text-sm">
                    {dayTransactions.filter(t => t.type === 'income').length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Income:</span>
                        <span className="text-green-600 font-medium">
                          +{formatCurrency(
                            dayTransactions
                              .filter(t => t.type === 'income')
                              .reduce((sum, t) => sum + t.amount, 0),
                            selectedCurrency === 'all' ? 'USD' : selectedCurrency
                          )}
                        </span>
                      </div>
                    )}
                    {dayTransactions.filter(t => t.type === 'expense').length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expenses:</span>
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(
                            dayTransactions
                              .filter(t => t.type === 'expense')
                              .reduce((sum, t) => sum + t.amount, 0),
                            selectedCurrency === 'all' ? 'USD' : selectedCurrency
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">Net:</span>
                      <span className={`font-medium ${
                        dayTransactions.reduce((sum, t) => 
                          sum + (t.type === 'income' ? t.amount : -t.amount), 0
                        ) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(
                          dayTransactions.reduce((sum, t) => 
                            sum + (t.type === 'income' ? t.amount : -t.amount), 0
                          ),
                          selectedCurrency === 'all' ? 'USD' : selectedCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
