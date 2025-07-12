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
    <div className="rounded-md border bg-card p-6 w-full h-full min-h-[600px]">
      <style>{`
        .calendar-large {
          width: 100% !important;
          height: 100% !important;
          display: flex;
          flex-direction: column;
        }
        .calendar-large .rdp {
          font-size: 1.1rem;
          width: 100% !important;
          height: 100% !important;
          flex: 1;
        }
        .calendar-large .rdp-table {
          width: 100% !important;
          height: 100% !important;
          table-layout: fixed;
        }
        .calendar-large .rdp-cell {
          height: 5rem;
          width: calc(100% / 7);
          min-width: 5rem;
        }
        .calendar-large .rdp-day {
          height: 5rem;
          width: 100%;
          font-size: 1.1rem;
          font-weight: 500;
        }
        .calendar-large .rdp-head_cell {
          height: 3.5rem;
          width: calc(100% / 7);
          font-size: 1rem;
          font-weight: 600;
        }
        .calendar-large .rdp-caption_label {
          font-size: 1.5rem;
          font-weight: 600;
        }
        .calendar-large .rdp-nav_button {
          height: 3rem;
          width: 3rem;
        }
        .calendar-large .rdp-row {
          width: 100% !important;
        }
        .day-income {
          position: relative;
        }
        .day-income::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: hsl(142 76% 36%);
        }
        .day-expense {
          position: relative;
        }
        .day-expense::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: hsl(0 84% 60%);
        }
      `}</style>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="w-full calendar-large"
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
