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


export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading } = useExpenses(user?.uid);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(expense => {
      const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
      const dateMatch = !dateFilter || new Date(expense.date).toDateString() === dateFilter.toDateString();
      return categoryMatch && dateMatch;
    });
  }, [expenses, categoryFilter, dateFilter]);

  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <ExpenseHeader
        onAddExpense={addExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isLoading ? (
             <div>Loading expenses...</div>
        ) : (
          <>
            <ExpenseStats expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Spending Patterns</CardTitle>
                    <CardDescription>A visual summary of your expenses over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ExpenseChart expenses={filteredExpenses} />
                    </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>A list of your latest transactions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ExpenseTable expenses={filteredExpenses} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} currency={userProfile?.preferredCurrency} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
