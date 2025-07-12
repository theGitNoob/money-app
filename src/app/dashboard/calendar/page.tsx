import { mockTransactions } from '@/lib/data';
import { CalendarView } from './calendar-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-200px)] space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spending Calendar</h1>
        <p className="text-muted-foreground">
          View your income and expenses on a calendar. Green dots are income, red dots are expenses.
        </p>
      </div>
      <Card className="flex-1 w-full">
        <CardContent className="p-8 h-full">
          <CalendarView transactions={mockTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
