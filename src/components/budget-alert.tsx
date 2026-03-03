
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
      <Alert variant="destructive" className="animate-bounce border-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Budget Exceeded!</AlertTitle>
        <AlertDescription>
          You have spent {formatCurrency(total, currency)}, which is {formatCurrency(total - limit, currency)} over your monthly limit.
        </AlertDescription>
      </Alert>
    );
  }

  if (percentage >= 80) {
    return (
      <Alert className="border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Budget Warning</AlertTitle>
        <AlertDescription>
          You've used {percentage.toFixed(0)}% of your monthly budget. You have {formatCurrency(limit - total, currency)} remaining.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
