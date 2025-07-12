export type Currency = 'USD' | 'CUP' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF';

export type TransactionItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string; // e.g., "pack", "KG", "liter", "piece"
};

export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: Currency;
  type: 'income' | 'expense';
  category: Category;
  // New fields for granular details
  items?: TransactionItem[];
  hasItemDetails?: boolean; // Flag to indicate if this transaction has detailed items
  // Group-related fields
  groupId?: string; // If present, this transaction belongs to a group
  createdBy: string; // User ID who created the transaction
  createdByName?: string; // Display name of the user who created it
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

export type Group = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
  memberIds: string[]; // Array of user IDs for security rules
  invitations: GroupInvitation[];
};

export type GroupMember = {
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  joinedAt: Date;
};

export type GroupInvitation = {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedByName: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  inviteToken: string;
};
