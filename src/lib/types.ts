export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
};

export type Category =
  | 'Groceries'
  | 'Dining Out'
  | 'Transportation'
  | 'Utilities'
  | 'Rent/Mortgage'
  | 'Entertainment'
  | 'Shopping'
  | 'Travel'
  | 'Healthcare'
  | 'Education'
  | 'Income'
  | 'Other';
