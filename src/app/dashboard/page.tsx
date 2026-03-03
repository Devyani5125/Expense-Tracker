
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
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-pulse text-lg font-medium">Loading your financial dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-muted/50 to-background">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FinancialQuote />
            <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-4">
                  <BudgetAlert 
                    total={totalSpent} 
                    limit={userProfile?.budgetLimit || 0} 
                    currency={userProfile?.preferredCurrency} 
                  />
                  <DailyReminder expenses={expenses || []} />
                  <AchievementBadges 
                    currentTotal={totalSpent} 
                    prevTotal={lastMonthTotalSpent} 
                    limit={userProfile?.budgetLimit || 0} 
                  />
               </div>
               <div className="hidden md:block">
                 <WhatIfSimulator 
                    expenses={filteredExpenses} 
                    currentTotal={totalSpent} 
                    budgetLimit={userProfile?.budgetLimit || 0} 
                    currency={userProfile?.preferredCurrency}
                  />
               </div>
            </div>
            
            {isLoading ? (
               <div className="flex h-40 items-center justify-center text-muted-foreground animate-pulse">Loading expenses...</div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <ExpenseStats expenses={filteredExpenses} currency={userProfile?.preferredCurrency} budgetLimit={userProfile?.budgetLimit} />
              </div>
            )}
          </div>
          <div className="lg:col-span-1 space-y-6">
             <Card className="shadow-lg border-none bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm">Monthly Summary</CardTitle>
                  <CardDescription>Your financial footprint for {currentMonth.toLocaleDateString(undefined, { month: 'long' })}.</CardDescription>
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
                    <span className={`font-bold ${totalSpent <= lastMonthTotalSpent ? 'text-green-600' : 'text-destructive'}`}>
                      {totalSpent <= lastMonthTotalSpent ? '-' : '+'}{Math.abs(totalSpent - lastMonthTotalSpent).toFixed(2)} {userProfile?.preferredCurrency}
                    </span>
                  </div>
                </CardContent>
             </Card>
             <div className="md:hidden">
                <WhatIfSimulator 
                  expenses={filteredExpenses} 
                  currentTotal={totalSpent} 
                  budgetLimit={userProfile?.budgetLimit || 0} 
                  currency={userProfile?.preferredCurrency}
                />
             </div>
          </div>
        </div>

        {!isLoading && (
          <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2 shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              <CardHeader>
                  <CardTitle>Spending Breakdown</CardTitle>
                  <CardDescription>A visual representation of your category-wise spending.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="h-[350px] w-full">
                      <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                  </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
              <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Your latest transactions for {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.</CardDescription>
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
        )}
      </main>
    </div>
  );
}
