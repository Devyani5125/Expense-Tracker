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
    bg: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20", 
    text: "text-cyan-400", 
    progress: "bg-cyan-500",
    iconBg: "bg-cyan-500/10"
  },
  Travel: { 
    bg: "from-purple-500/10 to-indigo-500/5 border-purple-500/20", 
    text: "text-purple-400", 
    progress: "bg-purple-500",
    iconBg: "bg-purple-500/10"
  },
  Shopping: { 
    bg: "from-pink-500/10 to-rose-500/5 border-pink-500/20", 
    text: "text-pink-400", 
    progress: "bg-pink-500",
    iconBg: "bg-pink-500/10"
  },
  Bills: { 
    bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20", 
    text: "text-emerald-400", 
    progress: "bg-emerald-500",
    iconBg: "bg-emerald-500/10"
  },
  Education: { 
    bg: "from-indigo-500/10 to-violet-500/5 border-indigo-500/20", 
    text: "text-indigo-400", 
    progress: "bg-indigo-500",
    iconBg: "bg-indigo-500/10"
  },
  Others: { 
    bg: "from-slate-500/10 to-gray-500/5 border-slate-500/20", 
    text: "text-slate-400", 
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
      <Card className="relative overflow-hidden group hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] transition-all duration-500 border-none bg-gradient-to-br from-primary/20 via-primary/10 to-transparent glass-card">
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-500">
           <TrendingUp className="h-24 w-24 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Total Spending</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-primary opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight mb-1 text-glow">{formatCurrency(totalExpenses, currency)}</div>
          <p className="text-[10px] opacity-50 font-black uppercase tracking-widest">Active System Ledger</p>
        </CardContent>
      </Card>

      <Card className={cn(
        "relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none glass-card",
        isOverBudget ? "bg-destructive/20" : isNearBudget ? "bg-orange-500/20" : "bg-accent/20"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Monthly Quota</CardTitle>
            {isOverBudget ? (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            ) : (
              <Target className="h-4 w-4 text-accent group-hover:rotate-45 transition-transform duration-500" />
            )}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black tracking-tight">
              {formatCurrency(totalExpenses, currency)}
              <span className="text-xs opacity-50 ml-1 font-normal">/ {formatCurrency(budgetLimit || 0, currency)}</span>
            </div>
            <div className="mt-4 space-y-2">
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className="h-2 bg-white/5" 
              />
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className={cn(isOverBudget ? "text-destructive" : isNearBudget ? "text-orange-400" : "text-accent")}>
                  {isOverBudget ? 'Threshold Exceeded' : isNearBudget ? 'Alert Level' : 'System Nominal'}
                </span>
                <span className="opacity-70">{budgetProgress.toFixed(0)}%</span>
              </div>
            </div>
        </CardContent>
      </Card>

      {Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([category, total]) => {
          const cat = category as Category;
          const Icon = categoryIcons[cat];
          const style = categoryColors[cat];
          
          return (
            <Card key={category} className={cn(
              "group hover:shadow-xl transition-all duration-300 border bg-gradient-to-br backdrop-blur-xl hover:-translate-y-1 glass-card",
              style.bg
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-xs font-black uppercase tracking-[0.15em]", style.text)}>{category}</CardTitle>
                <div className={cn("p-2 rounded-xl transition-colors", style.iconBg)}>
                  <Icon className={cn("h-4 w-4", style.text)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">{formatCurrency(total, currency)}</div>
                <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", style.progress)} 
                      style={{ width: `${(total / totalExpenses * 100) || 0}%` }}
                    />
                </div>
                <p className="text-[10px] mt-2 font-black opacity-40 uppercase tracking-tighter">
                  {((total / totalExpenses * 100) || 0).toFixed(1)}% Weight
                </p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};

export default ExpenseStats;
