
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Category } from '@/lib/types';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseHeader from '@/components/expense-header';
import ExpenseStats from '@/components/expense-stats';
import ExpenseChart from '@/components/expense-chart';
import { ExpenseTable } from '@/components/expense-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { FinancialQuote } from '@/components/financial-quote';
import { BudgetAlert } from '@/components/budget-alert';
import { DailyReminder } from '@/components/daily-reminder';
import { triggerCelebration } from '@/lib/celebration';
import { AchievementBadges } from '@/components/achievement-badges';
import { WhatIfSimulator } from '@/components/what-if-simulator';
import { subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading } = useExpenses(user?.uid);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
        const monthMatch = expenseDate.getFullYear() === currentMonth.getFullYear() &&
                           expenseDate.getMonth() === currentMonth.getMonth();
        return categoryMatch && monthMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, categoryFilter, currentMonth]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const lastMonthTotalSpent = useMemo(() => {
    if (!expenses) return 0;
    const lastMonth = subMonths(currentMonth, 1);
    return expenses
      .filter(expense => {
        const d = new Date(expense.date);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonth]);

  const handleAddExpense = (data: Omit<Expense, 'id'>) => {
    addExpense(data);
    
    if (userProfile?.budgetLimit && (totalSpent + data.amount) > userProfile.budgetLimit) {
      toast({
        title: "Budget Warning!",
        description: "This expense puts you over your monthly budget limit.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Expense added",
        description: "Your new expense has been recorded successfully.",
      });
      const hasExpenseToday = filteredExpenses.some(e => new Date(e.date).toDateString() === new Date().toDateString());
      if (!hasExpenseToday && (!userProfile?.budgetLimit || totalSpent + data.amount < userProfile.budgetLimit)) {
        triggerCelebration();
      }
    }
  };

  const handleUpdateExpense = (data: Expense) => {
    updateExpense(data);
    toast({
      title: "Expense updated",
      description: "The expense details have been updated.",
    });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    toast({
      title: "Expense deleted",
      description: "The expense has been removed from your list.",
      variant: "destructive",
    });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary"></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing your workspace...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background selection:bg-primary/20">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Top Stats Section */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
           <ExpenseStats 
            expenses={filteredExpenses} 
            currency={userProfile?.preferredCurrency} 
            budgetLimit={userProfile?.budgetLimit} 
           />
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Actionable Alerts & Insights */}
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
              <FinancialQuote />
              <div className="grid gap-4 sm:grid-cols-2">
                <BudgetAlert 
                  total={totalSpent} 
                  limit={userProfile?.budgetLimit || 0} 
                  currency={userProfile?.preferredCurrency} 
                />
                <DailyReminder expenses={expenses || []} />
              </div>
            </div>

            {/* Visual Analytics */}
            <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Spending Breakdown</CardTitle>
                    <CardDescription>Distribution of expenses by category.</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="h-[400px] w-full py-4">
                      <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                  </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Recent Expenses</CardTitle>
                    <CardDescription>Activity for {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.</CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="p-0">
                <ExpenseTable 
                  expenses={filteredExpenses} 
                  onUpdateExpense={handleUpdateExpense} 
                  onDeleteExpense={handleDeleteExpense} 
                  currency={userProfile?.preferredCurrency} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-8">
             <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150 space-y-6">
                <Card className="shadow-md border-none bg-primary/5 hover:bg-primary/10 transition-colors duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Monthly Pulse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Transactions</span>
                      <span className="font-bold">{filteredExpenses.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Daily Avg</span>
                      <span className="font-bold">{((totalSpent / 30) || 0).toFixed(2)} {userProfile?.preferredCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Vs. Last Month</span>
                      <span className={`font-bold flex items-center gap-1 ${totalSpent <= lastMonthTotalSpent ? 'text-green-600' : 'text-destructive'}`}>
                        {totalSpent <= lastMonthTotalSpent ? '↓' : '↑'}
                        {Math.abs(totalSpent - lastMonthTotalSpent).toFixed(2)} {userProfile?.preferredCurrency}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <AchievementBadges 
                  currentTotal={totalSpent} 
                  prevTotal={lastMonthTotalSpent} 
                  limit={userProfile?.budgetLimit || 0} 
                />

                <WhatIfSimulator 
                  expenses={filteredExpenses} 
                  currentTotal={totalSpent} 
                  budgetLimit={userProfile?.budgetLimit || 0} 
                  currency={userProfile?.preferredCurrency}
                />
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
