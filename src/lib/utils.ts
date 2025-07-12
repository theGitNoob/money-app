import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from './types'
import { CURRENCY_SYMBOLS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  // Format based on currency
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  };
  
  const formatted = new Intl.NumberFormat('en-US', options).format(Math.abs(amount));
  
  return `${symbol}${formatted}`;
}
