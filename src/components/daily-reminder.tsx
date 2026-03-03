
'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, PlusCircle } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { Expense } from '@/lib/types';

interface DailyReminderProps {
  expenses: Expense[];
}

export function DailyReminder({ expenses }: DailyReminderProps) {
  const hasExpenseToday = expenses.some(e => isSameDay(new Date(e.date), new Date()));

  if (hasExpenseToday) return null;

  return (
    <Alert className="border-primary bg-primary/5 text-primary">
      <Info className="h-4 w-4" />
      <AlertTitle>Daily Reminder</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Don't forget to log your expenses for today to keep your tracker accurate!</span>
      </AlertDescription>
    </Alert>
  );
}
