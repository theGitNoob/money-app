import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from './data-table';
import { columns } from './columns';
import { mockTransactions } from '@/lib/data';

export default function TransactionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>
          Here is a list of all your transactions for the current period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={mockTransactions} />
      </CardContent>
    </Card>
  );
}
