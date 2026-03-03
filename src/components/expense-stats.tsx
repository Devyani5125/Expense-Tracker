
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

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
  const isNearBudget = budgetProgress > 80 && budgetProgress <= 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Spending</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalExpenses, currency)}</div>
        </CardContent>
      </Card>

      {budgetLimit && budgetLimit > 0 && (
          <Card className={cn(
            "lg:col-span-1 group hover:shadow-xl transition-all duration-300 border-l-4 bg-gradient-to-br from-card",
            isOverBudget ? "border-l-destructive to-destructive/5" : isNearBudget ? "border-l-orange-500 to-orange-500/5" : "border-l-accent to-accent/5"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Budget</CardTitle>
                {isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-destructive animate-bounce" />
                ) : (
                  <Target className="h-4 w-4 text-accent group-hover:rotate-12 transition-transform" />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold flex items-baseline gap-1">
                  <span>{formatCurrency(totalExpenses, currency)}</span>
                  <span className="text-xs text-muted-foreground font-normal">/ {formatCurrency(budgetLimit, currency)}</span>
                </div>
                <div className="mt-3 space-y-1">
                  <Progress 
                    value={Math.min(budgetProgress, 100)} 
                    className={cn(
                      "h-2.5",
                      isOverBudget && "[&>div]:bg-destructive",
                      isNearBudget && "[&>div]:bg-orange-500"
                    )} 
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className={cn(
                      isOverBudget ? "text-destructive" : isNearBudget ? "text-orange-600" : "text-muted-foreground"
                    )}>
                      {isOverBudget ? 'Over Budget!' : isNearBudget ? 'Near Limit' : 'On Track'}
                    </span>
                    <span className={isOverBudget ? 'text-destructive' : 'text-muted-foreground'}>
                      {budgetProgress.toFixed(0)}%
                    </span>
                  </div>
                </div>
            </CardContent>
          </Card>
      )}

      {Object.entries(categoryIcons).map(([category, Icon]) => {
        const total = categoryTotals[category as Category] || 0;
        if (total === 0) return null;
        return (
          <Card key={category} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
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
