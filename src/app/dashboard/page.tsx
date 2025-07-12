'use client';

import { useState, useEffect } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { getTransactions } from '@/lib/transactions';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (user) {
        try {
          setLoading(true);
          const data = await getTransactions(user.uid);
          setTransactions(data);
        } catch (error) {
          console.error("Failed to fetch transactions:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <StatsCards transactions={transactions} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewChart transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}
