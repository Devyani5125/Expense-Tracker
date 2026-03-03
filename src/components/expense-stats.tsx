
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Target, TrendingUp } from 'lucide-react';
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
  const isOverBudget = budgetProgress > 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Monthly</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalExpenses, currency)}</div>
        </CardContent>
      </Card>

      {budgetLimit && budgetLimit > 0 && (
          <Card className="lg:col-span-1 group hover:shadow-xl transition-all duration-300 border-l-4 border-l-accent bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget Tracker</CardTitle>
                <Target className="h-4 w-4 text-accent group-hover:rotate-12 transition-transform" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold flex items-baseline gap-1">
                  <span>{formatCurrency(totalExpenses, currency)}</span>
                  <span className="text-xs text-muted-foreground font-normal">of {formatCurrency(budgetLimit, currency)}</span>
                </div>
                <div className="mt-3 space-y-1">
                  <Progress value={Math.min(budgetProgress, 100)} className={`h-2 ${isOverBudget ? 'bg-destructive/20' : ''}`} />
                  <p className={`text-[10px] font-bold text-right ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {budgetProgress.toFixed(0)}% Utilized
                  </p>
                </div>
            </CardContent>
          </Card>
      )}

      {Object.entries(categoryIcons).map(([category, Icon]) => {
        const total = categoryTotals[category as Category] || 0;
        if (total === 0) return null;
        return (
          <Card key={category} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</CardTitle>
              <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{formatCurrency(total, currency)}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExpenseStats;
