"use client";
import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { Expense } from '@/lib/types';
import { WithId } from '@/firebase/firestore/use-collection';

export function useExpenses(userId?: string) {
  const firestore = useFirestore();

  const expensesColRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'expenses');
  }, [firestore, userId]);
  
  const { data: expenses, isLoading, error } = useCollection<Expense>(expensesColRef);

  const addExpense = (expense: Omit<WithId<Expense>, 'id' | 'userId'>) => {
    if (!expensesColRef) return;
    addDocumentNonBlocking(expensesColRef, { ...expense, userId });
  };

  const updateExpense = (updatedExpense: WithId<Expense>) => {
    if (!firestore || !userId) return;
    const expenseRef = doc(firestore, 'users', userId, 'expenses', updatedExpense.id);
    const { id, ...expenseData } = updatedExpense;
    updateDocumentNonBlocking(expenseRef, expenseData);
  };

  const deleteExpense = (id: string) => {
    if (!firestore || !userId) return;
    const expenseRef = doc(firestore, 'users', userId, 'expenses', id);
    deleteDocumentNonBlocking(expenseRef);
  };

  const memoizedExpenses = useMemo(() => {
    if (!expenses) return null;
    return expenses.map(e => ({
        ...e,
        date: new Date(e.date)
    }));
  }, [expenses]);


  return { expenses: memoizedExpenses, addExpense, updateExpense, deleteExpense, isLoading, error };
}
