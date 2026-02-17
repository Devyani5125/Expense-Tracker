"use client";

import { useState, useEffect } from 'react';
import { Expense } from '@/lib/types';

const STORAGE_KEY = 'expensewise-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEY);
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses, (key, value) => {
            if (key === 'date') {
                return new Date(value);
            }
            return value;
        });
        setExpenses(parsedExpenses);
      }
    } catch (error) {
      console.error("Failed to load expenses from local storage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch (error) {
        console.error("Failed to save expenses to local storage:", error);
      }
    }
  }, [expenses, isLoaded]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prevExpenses =>
      prevExpenses.map(expense =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses(prevExpenses =>
      prevExpenses.filter(expense => expense.id !== id)
    );
  };

  return { expenses, addExpense, updateExpense, deleteExpense };
}
