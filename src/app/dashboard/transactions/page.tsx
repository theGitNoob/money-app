'use client';



import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from './data-table';
import { createColumns } from './columns';
import { getTransactions, deleteTransaction } from '@/lib/transactions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { EditTransactionDialog } from '@/components/edit-transaction-dialog';
import type { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) return;
    
    try {
      await deleteTransaction(user.uid, transactionId);
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been successfully deleted.',
      });
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const columns = createColumns({ 
    onDeleteTransaction: handleDeleteTransaction,
    onEditTransaction: handleEditTransaction
  });

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <AddTransactionDialog onTransactionAdded={fetchTransactions} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Here is a list of all your transactions for the current period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : <DataTable columns={columns} data={transactions} />}
        </CardContent>
      </Card>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTransactionUpdated={fetchTransactions}
      />
    </div>
  );
}
