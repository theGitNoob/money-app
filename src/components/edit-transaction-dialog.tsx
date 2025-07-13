'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Sparkles, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CATEGORIES, CURRENCIES, CURRENCY_NAMES } from '@/lib/constants';
import { getCategorySuggestion } from '@/lib/actions';
import { updateTransaction } from '@/lib/transactions';
import type { Transaction, Currency, Category } from '@/lib/types';

const itemSchema = z.object({
  description: z.string().min(1, { message: 'Item description is required.' }),
  quantity: z.coerce.number().positive({ message: 'Quantity must be positive.' }),
  unitPrice: z.coerce.number().positive({ message: 'Unit price must be positive.' }),
  unit: z.string().optional(),
});

const transactionFormSchema = z.object({
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.enum(CURRENCIES as [string, ...string[]]),
  date: z.date(),
  type: z.enum(['income', 'expense']),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  hasItemDetails: z.boolean().default(false),
  items: z.array(itemSchema).optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated?: () => void;
}

export function EditTransactionDialog({ 
  transaction, 
  open, 
  onOpenChange, 
  onTransactionUpdated 
}: EditTransactionDialogProps) {
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const hasItemDetails = form.watch('hasItemDetails');
  const items = form.watch('items');

  // Calculate total amount from items when item details are enabled
  const calculateTotalFromItems = () => {
    if (!hasItemDetails || !items) return 0;
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  // Update amount when items change
  useEffect(() => {
    if (hasItemDetails) {
      const total = calculateTotalFromItems();
      form.setValue('amount', total);
    }
  }, [hasItemDetails, items, form]);

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: '',
    });
  };

  // Update form values when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency || 'USD', // Fallback for existing transactions
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        hasItemDetails: transaction.hasItemDetails || false,
        items: transaction.items || [],
      });
    }
  }, [transaction, form]);

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
      const { suggestedCategory, error } = await getCategorySuggestion(description);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'AI Suggestion Failed',
          description: error,
        });
      }
      if (suggestedCategory) {
        form.setValue('category', suggestedCategory as any, { shouldValidate: true });
        toast({
          title: 'AI Suggestion',
          description: `We've suggested the category: ${suggestedCategory}`,
        });
      }
    });
  };

  function onSubmit(data: TransactionFormValues) {
    if (!user || !transaction) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to update transaction. Please try again.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const updateData: any = {
          description: data.description,
          amount: data.amount,
          currency: data.currency as Currency,
          date: data.date,
          type: data.type,
          category: data.category as Category,
          hasItemDetails: data.hasItemDetails,
        };

        // Only include items if hasItemDetails is true and items exist
        if (data.hasItemDetails && data.items && data.items.length > 0) {
          updateData.items = data.items;
        } else {
          // When hasItemDetails is false, we should remove the items field
          updateData.items = null; // Use null to remove the field in Firestore
        }

        await updateTransaction(user.uid, transaction.id, updateData);
        
        toast({
          title: 'Transaction Updated',
          description: `${data.description} for $${data.amount} has been successfully updated.`,
        });
        
        onOpenChange(false);
        
        // Refresh the transactions list
        if (onTransactionUpdated) {
          onTransactionUpdated();
        }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
          <DialogDescription>
            Update the details of your income or expense below.
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
                    <Input placeholder="e.g., Coffee with friends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field} 
                      readOnly={hasItemDetails}
                      className={hasItemDetails ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  {hasItemDetails && (
                    <p className="text-xs text-muted-foreground">
                      Amount is calculated automatically from item details
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
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

            {/* Item Details Toggle */}
            <FormField
              control={form.control}
              name="hasItemDetails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <ShoppingCart className="mr-2 h-4 w-4 inline" />
                      Add Item Details
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Break down this transaction into individual items with quantities and prices
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

            {/* Item Details Section */}
            {hasItemDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Item Details
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Item</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Coffee pack" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Qty</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Unit</FormLabel>
                              <FormControl>
                                <Input placeholder="pack, KG, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Unit Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="3.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No items added yet. Click "Add Item" to start.
                    </div>
                  )}
                  {hasItemDetails && (
                    <div className="text-right text-sm text-muted-foreground">
                      Total: {form.watch('currency') && formatCurrency(calculateTotalFromItems(), form.watch('currency') as any)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                {isPending ? 'Updating...' : 'Update Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
