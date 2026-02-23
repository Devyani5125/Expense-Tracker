"use client";

import React, { useState } from 'react';
import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExpenseForm } from './expense-form';
import { Expense, Category, categories } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, addMonths, subMonths } from 'date-fns';
import { UserNav } from './user-nav';

interface ExpenseHeaderProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  categoryFilter: Category | 'all';
  setCategoryFilter: (category: Category | 'all') => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  onAddExpense,
  categoryFilter,
  setCategoryFilter,
  currentMonth,
  setCurrentMonth,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <Logo />
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={(value: Category | 'all') => setCategoryFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-28 text-center text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
        <ThemeToggle />
        <UserNav />
      </div>
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={onAddExpense}
      />
    </header>
  );
};

export default ExpenseHeader;
