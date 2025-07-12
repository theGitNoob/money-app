'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { mockTransactions } from '@/lib/data';
import { Printer } from 'lucide-react';

export default function ReportsPage() {
  const handlePrint = () => {
    window.print();
  };

  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
            <h1 className="text-2xl font-bold">Monthly Report</h1>
            <p className="text-muted-foreground">Summary of your financial activity for July 2024.</p>
          </div>
          <Button onClick={handlePrint} className="no-print">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
        <Card className="print-card">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>An overview of your income, expenses, and balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between">
                <span>Total Income:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalIncome)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Final Balance:</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">Transaction Details</h3>
              <div className="rounded-lg border">
                <div className="space-y-2 p-4">
                {mockTransactions.map((t, index) => (
                  <React.Fragment key={t.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()} - {t.category}</p>
                      </div>
                      <div className={`font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </div>
                    </div>
                    {index < mockTransactions.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
