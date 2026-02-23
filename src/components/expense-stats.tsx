"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Target } from 'lucide-react';
import { Progress } from './ui/progress';

interface ExpenseStatsProps {
  expenses: Expense[];
  currency?: string;
  budgetLimit?: number;
}

const ExpenseStats: React.FC<ExpenseStatsProps> = ({ expenses, currency, budgetLimit }) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<Category, number>);

  const budgetProgress = budgetLimit && budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses, currency)}</div>
        </CardContent>
      </Card>
      {budgetLimit && budgetLimit > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">{formatCurrency(totalExpenses, currency)}
                <span className="text-xs text-muted-foreground"> / {formatCurrency(budgetLimit, currency)}</span>
                </div>
                <Progress value={budgetProgress} className="mt-2 h-2" />
            </CardContent>
          </Card>
      )}
      {Object.entries(categoryIcons).map(([category, Icon]) => {
        const total = categoryTotals[category as Category] || 0;
        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(total, currency)}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExpenseStats;
