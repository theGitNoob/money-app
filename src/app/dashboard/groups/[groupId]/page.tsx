'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getGroupTransactions, deleteGroupTransaction } from '@/lib/transactions';
import { formatCurrency } from '@/lib/utils';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import type { Transaction, Group, Currency } from '@/lib/types';
import { DataTable } from './transactions/data-table';
import { createColumns } from './transactions/columns';
import { AddGroupTransactionDialog } from '@/components/add-group-transaction-dialog';
import { EditGroupTransactionDialog } from '@/components/edit-group-transaction-dialog';
import { GroupDashboard } from '@/components/group-dashboard';
import { GroupCalendar } from '@/components/group-calendar';
import { GroupReports } from '@/components/group-reports';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GroupTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user && groupId) {
      fetchGroupData();
      fetchTransactions();
    }
  }, [user, groupId]);

  const fetchGroupData = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        setGroup({
          id: groupDoc.id,
          ...groupData,
          createdAt: groupData.createdAt?.toDate() || new Date(),
          members: groupData.members || [],
          memberIds: groupData.memberIds || [],
          invitations: groupData.invitations || []
        } as Group);
      } else {
        toast({
          title: "Error",
          description: "Group not found.",
          variant: "destructive",
        });
        router.push('/dashboard/groups');
      }
    } catch (error) {
      console.error("Failed to fetch group:", error);
      toast({
        title: "Error",
        description: "Failed to load group.",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getGroupTransactions(groupId);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteGroupTransaction(groupId, transactionId);
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been successfully deleted.',
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleTransactionUpdated = () => {
    fetchTransactions();
    setEditDialogOpen(false);
    setEditingTransaction(null);
  };

  // Calculate statistics
  const currencyTotals = transactions.reduce((acc, transaction) => {
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

  const columns = createColumns({
    onDeleteTransaction: handleDeleteTransaction,
    onEditTransaction: handleEditTransaction,
  });

  if (loading || !group) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if user is a member of this group
  const isGroupMember = group.memberIds.includes(user?.uid || '');
  if (!isGroupMember) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have access to this group's transactions.
            </p>
            <Button onClick={() => router.push('/dashboard/groups')}>
              Back to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/groups')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.description || 'Group transactions and expenses'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(currencyTotals).map(([currency, totals]) => (
              <div key={currency} className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Income ({currency})
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totals.income, currency as Currency)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Expenses ({currency})
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(totals.expenses, currency as Currency)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Balance ({currency})
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      totals.income - totals.expenses >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totals.income - totals.expenses, currency as Currency)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Group Members */}
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.displayName}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Group Transactions</CardTitle>
                <CardDescription>
                  Manage shared expenses and income for {group.name}
                </CardDescription>
              </div>
              <AddGroupTransactionDialog 
                groupId={groupId}
                onTransactionAdded={fetchTransactions}
              />
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={transactions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <GroupDashboard transactions={transactions} group={group} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <GroupCalendar transactions={transactions} groupId={groupId} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <GroupReports transactions={transactions} group={group} />
        </TabsContent>
      </Tabs>

      <EditGroupTransactionDialog
        transaction={editingTransaction}
        groupId={groupId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  );
}
