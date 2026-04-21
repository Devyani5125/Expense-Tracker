"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle, ArrowUpRight, Activity, Wallet } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ExpenseStatsProps {
  expenses: Expense[];
  currency?: string;
  budgetLimit?: number;
}

const categoryColors: Record<Category, { bg: string, text: string, progress: string, iconBg: string }> = {
  Food: { 
    bg: "from-cyan-500/15 to-blue-500/5 border-cyan-500/20", 
    text: "text-cyan-400", 
    progress: "bg-cyan-500",
    iconBg: "bg-cyan-500/10"
  },
  Travel: { 
    bg: "from-purple-500/15 to-indigo-500/5 border-purple-500/20", 
    text: "text-purple-400", 
    progress: "bg-purple-500",
    iconBg: "bg-purple-500/10"
  },
  Shopping: { 
    bg: "from-pink-500/15 to-rose-500/5 border-pink-500/20", 
    text: "text-pink-400", 
    progress: "bg-pink-500",
    iconBg: "bg-pink-500/10"
  },
  Bills: { 
    bg: "from-emerald-500/15 to-teal-500/5 border-emerald-500/20", 
    text: "text-emerald-400", 
    progress: "bg-emerald-500",
    iconBg: "bg-emerald-500/10"
  },
  Education: { 
    bg: "from-indigo-500/15 to-violet-500/5 border-indigo-500/20", 
    text: "text-indigo-400", 
    progress: "bg-indigo-500",
    iconBg: "bg-indigo-500/10"
  },
  Others: { 
    bg: "from-slate-500/15 to-gray-500/5 border-slate-500/20", 
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
  const remaining = Math.max((budgetLimit || 0) - totalExpenses, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden group hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.4)] transition-all duration-700 border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent glass-card">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
           <Wallet className="h-28 w-28 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Total Outflow</CardTitle>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-black tracking-tighter mb-1 text-glow">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),1)]" />
             <p className="text-[9px] opacity-40 font-black uppercase tracking-[0.2em]">Neural Ledger Sync Active</p>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(
        "relative overflow-hidden group hover:shadow-2xl transition-all duration-700 border-none glass-card",
        isOverBudget ? "bg-destructive/10" : isNearBudget ? "bg-orange-500/10" : "bg-accent/10"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Allocated Balance</CardTitle>
            <div className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-500",
              isOverBudget ? "bg-destructive/10 border-destructive/30" : "bg-accent/10 border-accent/30"
            )}>
              {isOverBudget ? <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" /> : <Target className="h-4 w-4 text-accent" />}
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-black tracking-tighter">
              {formatCurrency(remaining, currency)}
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className={cn(isOverBudget ? "text-destructive" : isNearBudget ? "text-orange-400" : "text-accent")}>
                  Utilization Index
                </span>
                <span className="opacity-70">{budgetProgress.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className={cn("h-1.5 bg-white/5", isOverBudget ? "bg-destructive/20" : "")} 
              />
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
          const percentage = ((total / totalExpenses * 100) || 0);
          
          return (
            <Card key={category} className={cn(
              "group hover:shadow-2xl transition-all duration-500 border bg-gradient-to-br backdrop-blur-3xl hover:-translate-y-2 glass-card",
              style.bg
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                   <CardTitle className={cn("text-[10px] font-black uppercase tracking-[0.3em]", style.text)}>{category}</CardTitle>
                   <p className="text-[9px] opacity-30 font-black uppercase tracking-tighter">{percentage.toFixed(1)}% Weight</p>
                </div>
                <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:scale-110", style.iconBg)}>
                  <Icon className={cn("h-5 w-5", style.text)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter">{formatCurrency(total, currency)}</div>
                <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={cn("h-full", style.progress)} 
                    />
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};

export default ExpenseStats;
