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
import type { Category, Currency } from './types';

export const CURRENCIES: Currency[] = [
  'USD',
  'CUP', 
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  CUP: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  CUP: 'Cuban Peso',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
};

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
