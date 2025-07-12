import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Lightbulb,
  Home,
  Film,
  Shirt,
  Plane,
  HeartPulse,
  BookOpen,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import type { Category } from './types';

export const CATEGORIES: Category[] = [
  'Groceries',
  'Dining Out',
  'Transportation',
  'Utilities',
  'Rent/Mortgage',
  'Entertainment',
  'Shopping',
  'Travel',
  'Healthcare',
  'Education',
  'Income',
  'Other',
];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Groceries: ShoppingCart,
  'Dining Out': UtensilsCrossed,
  Transportation: Car,
  Utilities: Lightbulb,
  'Rent/Mortgage': Home,
  Entertainment: Film,
  Shopping: Shirt,
  Travel: Plane,
  Healthcare: HeartPulse,
  Education: BookOpen,
  Income: DollarSign,
  Other: HelpCircle,
};
