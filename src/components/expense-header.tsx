"use client";

import React, { useState } from 'react';
import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { PlusCircle, X, LogOut } from 'lucide-react';
import { ExpenseForm } from './expense-form';
import { Expense, Category, categories } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/firebase';

interface ExpenseHeaderProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  categoryFilter: Category | 'all';
  setCategoryFilter: (category: Category | 'all') => void;
  dateFilter: Date | undefined;
  setDateFilter: (date: Date | undefined) => void;
}

const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  onAddExpense,
  categoryFilter,
  setCategoryFilter,
  dateFilter,
  setDateFilter,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const auth = useAuth();

  const handleSignOut = () => {
    auth.signOut();
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                {dateFilter ? format(dateFilter, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>
           {dateFilter && <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}><X className="h-4 w-4" /></Button>}
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
        </Button>
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
