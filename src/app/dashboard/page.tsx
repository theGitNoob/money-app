import { StatsCards } from '@/components/dashboard/stats-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <StatsCards />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentTransactions />
      </div>
    </div>
  );
}
