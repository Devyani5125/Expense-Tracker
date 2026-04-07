
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
import { Wallet, MessageSquareText, Lightbulb, Leaf, ShieldAlert, UserPlus } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const GUEST_EXPENSE_LIMIT = 3;

/**
 * A stunning, tab-specific background component that transitions
 * colors and floating blobs based on the active tab.
 */
const TabBackground = ({ activeTab }: { activeTab: string }) => {
  const configs: Record<string, { aurora: string; blobs: string[] }> = {
    spending: {
      aurora: "from-emerald-500/20 via-teal-500/10 to-transparent",
      blobs: ["bg-emerald-400/20", "bg-teal-500/10", "bg-green-300/10"],
    },
    advisor: {
      aurora: "from-indigo-600/20 via-purple-500/10 to-transparent",
      blobs: ["bg-indigo-400/20", "bg-violet-500/10", "bg-purple-300/10"],
    },
    insights: {
      aurora: "from-amber-500/20 via-orange-400/10 to-transparent",
      blobs: ["bg-yellow-400/20", "bg-orange-500/10", "bg-amber-300/10"],
    },
    eco: {
      aurora: "from-green-700/20 via-emerald-600/10 to-transparent",
      blobs: ["bg-green-500/20", "bg-emerald-400/10", "bg-teal-300/10"],
    },
  };

  const current = configs[activeTab] || configs.spending;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2rem]">
      {/* Aurora Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '-aurora'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={cn("absolute inset-0 bg-gradient-to-b", current.aurora)}
        />
      </AnimatePresence>

      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {current.blobs.map((blobClass, i) => (
          <motion.div
            key={activeTab + '-blob-' + i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, -30, 0],
              y: [0, -40, 60, 0]
            }}
            transition={{ 
              duration: 10 + i * 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className={cn(
              "absolute rounded-full blur-[100px]",
              blobClass,
              i === 0 ? "w-[400px] h-[400px] -top-20 -left-20" :
              i === 1 ? "w-[500px] h-[500px] -bottom-40 -right-20" :
              "w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          />
        ))}
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
    </div>
  );
};

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const { userProfile } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(user?.uid);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('spending');
  
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
            <TabsList className="grid grid-cols-4 w-full md:w-[500px] h-12 glass-card p-1 relative z-20">
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
            
            <div className="hidden md:block relative z-20">
               <DailyReminder expenses={expenses || []} />
            </div>
          </div>

          {/* This container houses the tab backgrounds and content */}
          <div className="relative min-h-[600px] rounded-[2rem] p-1 md:p-4 overflow-hidden">
            <TabBackground activeTab={activeTab} />

            <div className="relative z-10 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <TabsContent value="spending" className="m-0 space-y-8">
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

                  <TabsContent value="advisor" className="m-0 max-w-4xl mx-auto w-full space-y-8">
                    <FinancialQuote />
                    <FinancialQA 
                      expenses={filteredExpenses} 
                      currency={userProfile?.preferredCurrency} 
                      budgetLimit={userProfile?.budgetLimit} 
                    />
                  </TabsContent>

                  <TabsContent value="insights" className="m-0 space-y-8">
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

                  <TabsContent value="eco" className="m-0">
                    <CarbonFootprintView 
                      expenses={filteredExpenses} 
                      currency={userProfile?.preferredCurrency} 
                    />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
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
