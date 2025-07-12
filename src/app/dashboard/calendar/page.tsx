import { mockTransactions } from '@/lib/data';
import { CalendarView } from './calendar-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Calendar</CardTitle>
        <CardDescription>
          View your income and expenses on a calendar. Green dots are income, red dots are expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarView transactions={mockTransactions} />
      </CardContent>
    </Card>
  );
}
