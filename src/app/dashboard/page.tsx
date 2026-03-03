
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

  const handleAddExpense = (data: Omit<Expense, 'id'>) => {
    addExpense(data);
    toast({
      title: "Expense added",
      description: "Your new expense has been recorded successfully.",
    });
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
            {isLoading ? (
               <div className="flex h-40 items-center justify-center text-muted-foreground animate-pulse">Loading expenses...</div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <ExpenseStats expenses={filteredExpenses} currency={userProfile?.preferredCurrency} budgetLimit={userProfile?.budgetLimit} />
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
             {/* This space can be used for extra dashboard widgets in the future */}
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
