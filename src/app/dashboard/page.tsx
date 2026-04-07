"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Category } from '@/lib/types';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseHeader from '@/components/expense-header';
import ExpenseStats from '@/components/expense-stats';
import ExpenseChart from '@/components/expense-chart';
import { ExpenseTable } from '@/components/expense-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { FinancialQuote } from '@/components/financial-quote';
import { BudgetAlert } from '@/components/budget-alert';
import { DailyReminder } from '@/components/daily-reminder';
import { triggerCelebration } from '@/lib/celebration';
import { AchievementBadges } from '@/components/achievement-badges';
import { WhatIfSimulator } from '@/components/what-if-simulator';
import { FinancialQA } from '@/components/financial-qa';
import { CarbonFootprintView } from '@/components/carbon-footprint-view';
import { format, subMonths } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, MessageSquareText, Lightbulb, Wallet, Sparkles, UserPlus, Leaf, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { cn } from '@/lib/utils';

const GUEST_EXPENSE_LIMIT = 3;

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const { userProfile } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading } = useExpenses(user?.uid);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // State for SignUp Modal
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Enforce Guest Limit
  useEffect(() => {
    if (user?.isAnonymous && expenses && expenses.length >= GUEST_EXPENSE_LIMIT) {
      setShowSignUpPrompt(true);
    }
  }, [user, expenses]);

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
    if (user?.isAnonymous && expenses && expenses.length >= GUEST_EXPENSE_LIMIT) {
      setShowSignUpPrompt(true);
      return;
    }

    addExpense(data);
    triggerCelebration();

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

  const handleFinalSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignUp(auth, signUpEmail, signUpPassword);
    setShowSignUpPrompt(false);
    toast({
      title: "Account Created!",
      description: "Your data is now safely synced to your account.",
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

  const currentCount = expenses?.length || 0;
  const progressPercent = Math.min((currentCount / GUEST_EXPENSE_LIMIT) * 100, 100);
  
  return (
    <div className="flex min-h-screen w-full flex-col selection:bg-primary/20">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="spending" className="w-full space-y-8">
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
            <TabsList className="grid grid-cols-4 w-full md:w-[500px] h-12 glass-card p-1">
              <TabsTrigger value="spending" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Spending</span>
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquareText className="h-4 w-4" />
                <span className="hidden sm:inline">Advisor</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Planning</span>
              </TabsTrigger>
              <TabsTrigger value="eco" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">Eco</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden md:block">
               <DailyReminder expenses={expenses || []} />
            </div>
          </div>

          <TabsContent value="spending" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <ExpenseStats 
                expenses={filteredExpenses} 
                currency={userProfile?.preferredCurrency} 
                budgetLimit={userProfile?.budgetLimit} 
              />
            </section>

            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-12 space-y-8">
                <BudgetAlert 
                  total={totalSpent} 
                  limit={userProfile?.budgetLimit || 0} 
                  currency={userProfile?.preferredCurrency} 
                />

                <div className="grid gap-8 md:grid-cols-2">
                  <Card className="glass-card h-fit">
                    <CardHeader>
                      <CardTitle className="text-xl">Spending Breakdown</CardTitle>
                      <CardDescription>Visual category distribution for {format(currentMonth, 'MMMM yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] w-full py-4">
                        <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card h-fit">
                    <CardHeader>
                      <CardTitle className="text-xl">Monthly Pulse</CardTitle>
                      <CardDescription>Key metrics for the current period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-xs font-bold text-muted-foreground uppercase">Transactions</p>
                          <p className="text-2xl font-black">{filteredExpenses.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-xs font-bold text-muted-foreground uppercase">Daily Avg</p>
                          <p className="text-2xl font-black">{((totalSpent / 30) || 0).toFixed(0)} <span className="text-xs">{userProfile?.preferredCurrency}</span></p>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Vs. Last Month</p>
                        <div className="flex items-end gap-2">
                           <p className={`text-2xl font-black ${totalSpent <= lastMonthTotalSpent ? 'text-green-600' : 'text-destructive'}`}>
                            {totalSpent <= lastMonthTotalSpent ? '↓' : '↑'}
                            {Math.abs(totalSpent - lastMonthTotalSpent).toFixed(2)}
                           </p>
                           <span className="text-xs font-bold opacity-60 pb-1">{userProfile?.preferredCurrency} Difference</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-xl">Recent Expenses</CardTitle>
                    <CardDescription>Activity for the selected month</CardDescription>
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
            </div>
          </TabsContent>

          <TabsContent value="advisor" className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
            <div className="space-y-8">
              <FinancialQuote />
              <FinancialQA 
                expenses={filteredExpenses} 
                currency={userProfile?.preferredCurrency} 
                budgetLimit={userProfile?.budgetLimit} 
              />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8 lg:grid-cols-2">
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
          </TabsContent>

          <TabsContent value="eco" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <CarbonFootprintView 
               expenses={filteredExpenses} 
               currency={userProfile?.preferredCurrency} 
             />
          </TabsContent>
        </Tabs>
      </main>

      {/* Sign-up Modal */}
      <Dialog 
        open={showSignUpPrompt} 
        onOpenChange={(open) => {
          if (user?.isAnonymous && currentCount >= GUEST_EXPENSE_LIMIT) return;
          setShowSignUpPrompt(open);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none glass-card animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <DialogHeader className="relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter">Guest Limit Reached!</DialogTitle>
              <DialogDescription className="text-primary-foreground/90 font-medium text-lg leading-tight mt-2">
                You've reached the guest limit! Sign up to track unlimited expenses & unlock all features.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-muted-foreground">
                <span>Free Tier Progress</span>
                <span className="text-primary">{currentCount}/{GUEST_EXPENSE_LIMIT} Used</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-muted rounded-full overflow-hidden" />
            </div>

            <form onSubmit={handleFinalSignUp} className="space-y-4">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="h-14 bg-muted/30 border-none font-bold text-lg px-4 focus-visible:ring-primary"
                />
                <Input
                  type="password"
                  placeholder="Create Password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="h-14 bg-muted/30 border-none font-bold text-lg px-4 focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all">
                <UserPlus className="mr-3 h-6 w-6" /> CREATE ACCOUNT
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}