'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { deleteTransaction } from '@/lib/transactions';
import type { Transaction, Category } from '@/lib/types';
import { CATEGORY_ICONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface ColumnsProps {
  onDeleteTransaction?: (transactionId: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export const createColumns = ({ onDeleteTransaction, onEditTransaction }: ColumnsProps = {}): ColumnDef<Transaction>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('date') as Date;
      return <div className="font-medium">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const transaction = row.original;
      const hasItems = transaction.hasItemDetails && transaction.items && transaction.items.length > 0;
      
      return (
        <div>
          <div className="font-medium">{transaction.description}</div>
          {hasItems && (
            <div className="text-sm text-muted-foreground mt-1">
              {transaction.items!.slice(0, 2).map((item, index) => (
                <div key={index}>
                  {item.quantity} {item.unit} {item.description} @ {formatCurrency(item.unitPrice, transaction.currency || 'USD')}
                </div>
              ))}
              {transaction.items!.length > 2 && (
                <div className="text-xs">+{transaction.items!.length - 2} more items</div>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as Category;
      const Icon = CATEGORY_ICONS[category];
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-2">
          {Icon && <Icon className="h-3 w-3" />}
          {category}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const type = row.original.type;
      const currency = row.original.currency || 'USD'; // Fallback for existing transactions
      const formatted = formatCurrency(amount, currency);

      return (
        <div
          className={`text-right font-medium ${
            type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {type === 'income' ? `+${formatted}` : `-${formatted}`}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (onEditTransaction) {
                  onEditTransaction(transaction);
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                if (onDeleteTransaction) {
                  onDeleteTransaction(transaction.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Default export for backward compatibility
export const columns = createColumns();
