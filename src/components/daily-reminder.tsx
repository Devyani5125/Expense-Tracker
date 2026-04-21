"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Sparkles } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { Expense } from '@/lib/types';

interface DailyReminderProps {
  expenses: Expense[];
}

export function DailyReminder({ expenses }: DailyReminderProps) {
  const hasExpenseToday = expenses.some(e => isSameDay(new Date(e.date), new Date()));

  if (hasExpenseToday) return null;

  return (
    <Alert className="border-primary/30 bg-primary/5 text-primary glass-card backdrop-blur-3xl animate-pulse">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="font-black uppercase tracking-[0.2em] text-[10px] mb-2">System Notification</AlertTitle>
      <AlertDescription className="text-sm font-medium opacity-90 leading-relaxed">
        Input detection: 0 transactions for current cycle. Please log your data to maintain sync accuracy.
      </AlertDescription>
    </Alert>
  );
}
