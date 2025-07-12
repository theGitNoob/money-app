'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Transaction } from '@/lib/types';

type CalendarViewProps = {
  transactions: Transaction[];
};

export function CalendarView({ transactions }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const incomeDays = transactions
    .filter((t) => t.type === 'income')
    .map((t) => t.date);

  const expenseDays = transactions
    .filter((t) => t.type === 'expense')
    .map((t) => t.date);

  return (
    <div className="rounded-md border bg-card p-4">
      <style>{`
        .day-income {
          position: relative;
        }
        .day-income::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: hsl(var(--accent));
        }
        .day-expense {
          position: relative;
        }
        .day-expense::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: hsl(var(--destructive));
        }
      `}</style>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="w-full"
        modifiers={{
          income: incomeDays,
          expense: expenseDays,
        }}
        modifiersClassNames={{
          income: 'day-income',
          expense: 'day-expense',
        }}
      />
    </div>
  );
}
