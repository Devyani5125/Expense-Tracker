
'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetAlertProps {
  total: number;
  limit: number;
  currency?: string;
}

export function BudgetAlert({ total, limit, currency }: BudgetAlertProps) {
  if (!limit || limit <= 0) return null;

  const percentage = (total / limit) * 100;

  if (percentage >= 100) {
    return (
      <Alert 
        variant="destructive" 
        className="animate-in fade-in slide-in-from-top-4 duration-500 border-2 rounded-none shadow-2xl bg-destructive/5"
      >
        <AlertTriangle className="h-5 w-5" />
        <div className="ml-2">
          <AlertTitle className="font-black uppercase tracking-tighter text-lg">Budget Exceeded!</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            You have spent {formatCurrency(total, currency)}, which is {formatCurrency(total - limit, currency)} over your monthly limit.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (percentage >= 80) {
    return (
      <Alert 
        className="animate-in fade-in slide-in-from-top-4 duration-500 border-2 border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-none shadow-xl"
      >
        <AlertTriangle className="h-5 w-5" />
        <div className="ml-2">
          <AlertTitle className="font-black uppercase tracking-tighter text-lg">Budget Warning</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            You've used {percentage.toFixed(0)}% of your monthly budget. You have {formatCurrency(limit - total, currency)} remaining.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
}
