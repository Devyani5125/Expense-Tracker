
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface ExpenseStatsProps {
  expenses: Expense[];
  currency?: string;
  budgetLimit?: number;
}

const categoryColors: Record<Category, { bg: string, text: string, progress: string, iconBg: string }> = {
  Food: { 
    bg: "from-orange-500/10 to-amber-500/5 border-orange-500/20", 
    text: "text-orange-600 dark:text-orange-400", 
    progress: "bg-orange-500",
    iconBg: "bg-orange-500/10"
  },
  Travel: { 
    bg: "from-blue-500/10 to-cyan-500/5 border-blue-500/20", 
    text: "text-blue-600 dark:text-blue-400", 
    progress: "bg-blue-500",
    iconBg: "bg-blue-500/10"
  },
  Shopping: { 
    bg: "from-pink-500/10 to-rose-500/5 border-pink-500/20", 
    text: "text-pink-600 dark:text-pink-400", 
    progress: "bg-pink-500",
    iconBg: "bg-pink-500/10"
  },
  Bills: { 
    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20", 
    text: "text-emerald-600 dark:text-emerald-400", 
    progress: "bg-emerald-500",
    iconBg: "bg-emerald-500/10"
  },
  Education: { 
    bg: "from-indigo-500/10 to-violet-500/5 border-indigo-500/20", 
    text: "text-indigo-600 dark:text-indigo-400", 
    progress: "bg-indigo-500",
    iconBg: "bg-indigo-500/10"
  },
  Others: { 
    bg: "from-slate-500/10 to-gray-500/5 border-slate-500/20", 
    text: "text-slate-600 dark:text-slate-400", 
    progress: "bg-slate-500",
    iconBg: "bg-slate-500/10"
  },
};

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Spending Card */}
      <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-500">
           <TrendingUp className="h-24 w-24" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Total Spending</CardTitle>
          <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight mb-1">{formatCurrency(totalExpenses, currency)}</div>
          <p className="text-[10px] opacity-70 font-medium uppercase">Current Month Activity</p>
        </CardContent>
      </Card>

      {/* Monthly Budget Card */}
      <Card className={cn(
        "relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-gradient-to-br",
        isOverBudget ? "from-destructive via-destructive/90 to-destructive/80 text-destructive-foreground" : 
        isNearBudget ? "from-orange-500 via-orange-500/90 to-orange-500/80 text-white" : 
        "from-accent via-accent/90 to-accent/80 text-accent-foreground"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Monthly Budget</CardTitle>
            {isOverBudget ? (
              <AlertTriangle className="h-4 w-4 animate-pulse" />
            ) : (
              <Target className="h-4 w-4 group-hover:rotate-45 transition-transform duration-500" />
            )}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black tracking-tight">
              {formatCurrency(totalExpenses, currency)}
              <span className="text-xs opacity-70 ml-1 font-normal">/ {formatCurrency(budgetLimit || 0, currency)}</span>
            </div>
            <div className="mt-4 space-y-2">
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className={cn(
                  "h-2 bg-white/20",
                  "[&>div]:bg-white"
                )} 
              />
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span>{isOverBudget ? 'Limit Exceeded' : isNearBudget ? 'Critical Level' : 'Healthy Status'}</span>
                <span>{budgetProgress.toFixed(0)}%</span>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Category Mini Cards - Visual Distinction for categories like Travel and Shopping */}
      {Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([category, total]) => {
          const cat = category as Category;
          const Icon = categoryIcons[cat];
          const style = categoryColors[cat];
          
          return (
            <Card key={category} className={cn(
              "group hover:shadow-xl transition-all duration-300 border bg-gradient-to-br backdrop-blur-sm hover:-translate-y-1",
              style.bg
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-xs font-bold uppercase tracking-wider", style.text)}>{category}</CardTitle>
                <div className={cn("p-2 rounded-xl transition-colors", style.iconBg)}>
                  <Icon className={cn("h-4 w-4", style.text)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight text-foreground">{formatCurrency(total, currency)}</div>
                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", style.progress)} 
                      style={{ width: `${(total / totalExpenses * 100) || 0}%` }}
                    />
                </div>
                <p className="text-[10px] mt-2 font-bold opacity-60 uppercase tracking-tighter">
                  {((total / totalExpenses * 100) || 0).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};

export default ExpenseStats;
