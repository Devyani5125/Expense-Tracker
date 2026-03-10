"use client";

import React, { useState } from 'react';
import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Filter, Calendar } from 'lucide-react';
import { ExpenseForm } from './expense-form';
import { Expense, Category, categories } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, addMonths, subMonths } from 'date-fns';
import { UserNav } from './user-nav';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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
    <TooltipProvider>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm font-medium text-primary cursor-default border-b-2 border-primary pb-5 mt-5">Dashboard</span>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden lg:flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-1.5 transition-all hover:bg-muted/50">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={(value: Category | 'all') => setCategoryFilter(value)}>
                <SelectTrigger className="h-7 w-[130px] border-none bg-transparent p-0 text-xs font-bold uppercase tracking-wider focus:ring-0">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 rounded-full border bg-muted/30 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-7 w-7 rounded-full transition-transform active:scale-90">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Month</TooltipContent>
              </Tooltip>
              
              <div className="flex items-center gap-2 px-3">
                <Calendar className="h-3 w-3 text-primary" />
                <span className="w-24 text-center text-xs font-black uppercase tracking-tighter">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 rounded-full transition-transform active:scale-90">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Month</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2 md:gap-4 border-l pl-4 md:pl-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsFormOpen(true)} 
                    className="h-9 rounded-full px-4 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> 
                    <span className="hidden sm:inline">Add New</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Log transaction</TooltipContent>
              </Tooltip>

              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </div>
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={onAddExpense}
          defaultDate={currentMonth}
        />
      </header>
    </TooltipProvider>
  );
};

export default ExpenseHeader;
