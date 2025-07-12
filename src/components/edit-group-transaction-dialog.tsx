'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Sparkles, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CATEGORIES, CURRENCIES, CURRENCY_NAMES } from '@/lib/constants';
import { getCategorySuggestion } from '@/lib/actions';
import { updateGroupTransaction } from '@/lib/transactions';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, Currency, Category } from '@/lib/types';

const transactionFormSchema = z.object({
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.enum(CURRENCIES as [string, ...string[]]),
  date: z.date(),
  type: z.enum(['income', 'expense']),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  hasItemDetails: z.boolean().default(false),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.coerce.number().positive('Quantity must be positive'),
    unitPrice: z.coerce.number().positive('Unit price must be positive'),
    unit: z.string().optional(),
  })).optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface EditGroupTransactionDialogProps {
  transaction: Transaction | null;
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated?: () => void;
}

export function EditGroupTransactionDialog({ 
  transaction, 
  groupId,
  open, 
  onOpenChange, 
  onTransactionUpdated 
}: EditGroupTransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      currency: 'USD',
      date: new Date(),
      type: 'expense',
      category: 'Other',
      hasItemDetails: false,
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchHasItemDetails = form.watch('hasItemDetails');
  const watchItems = form.watch('items');
  const watchCurrency = form.watch('currency');

  // Update form values when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        hasItemDetails: transaction.hasItemDetails || false,
        items: transaction.items || [],
      });
      
      if (transaction.items) {
        replace(transaction.items);
      }
    }
  }, [transaction, form, replace]);

  // Calculate total from items when item details are enabled
  useEffect(() => {
    if (watchHasItemDetails && watchItems) {
      const total = watchItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      form.setValue('amount', total);
    }
  }, [watchHasItemDetails, watchItems, form]);

  const handleGetSuggestion = () => {
    const description = form.getValues('description');
    if (!description) {
      toast({
        variant: 'destructive',
        title: 'Description is empty',
        description: 'Please enter a description to get a category suggestion.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const suggestion = await getCategorySuggestion(description);
        if (suggestion && suggestion.suggestedCategory) {
          form.setValue('category', suggestion.suggestedCategory);
          toast({
            title: 'Category suggested',
            description: `We suggest "${suggestion.suggestedCategory}" for this transaction.`,
          });
        }
      } catch (error) {
        console.error('Error getting category suggestion:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to get category suggestion. Please try again.',
        });
      }
    });
  };

  function onSubmit(data: TransactionFormValues) {
    if (!user || !transaction) return;

    startTransition(async () => {
      try {
        await updateGroupTransaction(groupId, transaction.id, {
          ...data,
          currency: data.currency as Currency,
          category: data.category as Category,
        });
        
        toast({
          title: 'Transaction updated',
          description: 'The transaction has been successfully updated.',
        });

        onOpenChange(false);
        onTransactionUpdated?.();
      } catch (error) {
        console.error('Error updating transaction:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update transaction. Please try again.',
        });
      }
    });
  }

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'piece',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit group transaction</DialogTitle>
          <DialogDescription>
            Update the details of the group's income or expense below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries for the house" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasItemDetails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Itemized Details</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Add specific items with quantities and prices
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!watchHasItemDetails && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchHasItemDetails && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Items</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Milk" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., liter, pack, KG" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                
                {watchHasItemDetails && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(form.watch('amount'), watchCurrency as Currency)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency} - {CURRENCY_NAMES[currency]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal">Expense</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">Income</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGetSuggestion}
                      disabled={isPending}
                      aria-label="Get AI Suggestion"
                    >
                      <Sparkles className={cn('h-4 w-4', isPending && 'animate-spin')} />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                Update Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
