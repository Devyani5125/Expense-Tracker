
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
import { Wallet, MessageSquareText, Lightbulb, Leaf, ShieldAlert, UserPlus, Sparkles } from 'lucide-react';
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
  const configs: Record<string, { aurora: string; blobs: string[]; animationType?: 'float' | 'rise' }> = {
    spending: {
      aurora: "from-emerald-600/20 via-teal-500/10 to-transparent",
      blobs: ["bg-emerald-400/20", "bg-teal-500/10", "bg-green-300/10"],
      animationType: 'float'
    },
    advisor: {
      aurora: "from-indigo-700/25 via-violet-600/10 to-transparent",
      blobs: ["bg-indigo-500/20", "bg-violet-600/15", "bg-blue-400/10"],
      animationType: 'float'
    },
    insights: {
      aurora: "from-amber-600/20 via-orange-500/10 to-transparent",
      blobs: ["bg-yellow-400/20", "bg-orange-500/15", "bg-amber-300/10"],
      animationType: 'float'
    },
    eco: {
      aurora: "from-green-800/20 via-emerald-700/10 to-transparent",
      blobs: ["bg-green-500/20", "bg-emerald-400/15", "bg-teal-300/10"],
      animationType: 'rise'
    },
  };

  const current = configs[activeTab] || configs.spending;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
      {/* Aurora Base Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '-aurora'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn("absolute inset-0 bg-gradient-to-br", current.aurora)}
        />
      </AnimatePresence>

      {/* Floating or Rising Elements */}
      <div className="absolute inset-0">
        {current.blobs.map((blobClass, i) => (
          <motion.div
            key={activeTab + '-element-' + i}
            initial={current.animationType === 'rise' ? { y: '110%', opacity: 0 } : { scale: 0.8, opacity: 0 }}
            animate={current.animationType === 'rise' ? {
              y: ['110%', '-10%'],
              x: [Math.sin(i) * 50, Math.cos(i) * 50],
              opacity: [0, 0.4, 0]
            } : { 
              scale: [1, 1.3, 1], 
              opacity: [0.2, 0.4, 0.2],
              x: [0, 60, -40, 0],
              y: [0, -50, 70, 0]
            }}
            transition={{ 
              duration: current.animationType === 'rise' ? 8 + i * 4 : 15 + i * 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 2
            }}
            className={cn(
              "absolute rounded-full blur-[110px]",
              blobClass,
              current.animationType === 'rise' ? "w-32 h-32" : 
              i === 0 ? "w-[450px] h-[450px] -top-20 -left-20" :
              i === 1 ? "w-[550px] h-[550px] -bottom-40 -right-20" :
              "w-[350px] h-[350px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          />
        ))}
      </div>

      {/* Premium Texture Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay" />
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
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#0a0f1e]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative h-16 w-16"
        >
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-t-4 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </motion.div>
        <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">Syncing Workspace...</p>
      </div>
    );
  }

  const currentCount = expenses?.length || 0;
  const progressPercent = Math.min((currentCount / GUEST_EXPENSE_LIMIT) * 100, 100);
  
  return (
    <div className="flex min-h-screen w-full flex-col selection:bg-primary/20 overflow-x-hidden bg-background">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex items-center justify-between flex-col md:flex-row gap-6 relative z-30">
            <TabsList className="grid grid-cols-4 w-full md:w-[550px] h-14 glass-card p-1.5 border-white/10">
              <TabsTrigger value="spending" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Spending</span>
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all">
                <MessageSquareText className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Advisor</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Planning</span>
              </TabsTrigger>
              <TabsTrigger value="eco" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Eco</span>
              </TabsTrigger>
            </TabsList>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block"
            >
               <DailyReminder expenses={expenses || []} />
            </motion.div>
          </div>

          <div className="relative min-h-[700px] rounded-[2.5rem] p-1 md:p-6 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]">
            <TabBackground activeTab={activeTab} />

            <div className="relative z-10 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
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
                          <Card className="glass-card h-fit border-white/5 shadow-2xl">
                            <CardHeader>
                              <CardTitle className="text-xl font-black tracking-tight">Spending Breakdown</CardTitle>
                              <CardDescription>Visual category distribution for {format(currentMonth, 'MMMM yyyy')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[380px] w-full py-4">
                                <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="glass-card h-fit border-white/5 shadow-2xl">
                            <CardHeader>
                              <CardTitle className="text-xl font-black tracking-tight">Monthly Pulse</CardTitle>
                              <CardDescription>Key performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <motion.div whileHover={{ y: -5 }} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Transactions</p>
                                  <p className="text-3xl font-black">{filteredExpenses.length}</p>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Daily Avg</p>
                                  <p className="text-3xl font-black">{((totalSpent / 30) || 0).toFixed(0)} <span className="text-xs">{userProfile?.preferredCurrency}</span></p>
                                </motion.div>
                              </div>
                              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Vs. Last Month</p>
                                <div className="flex items-end gap-3">
                                  <p className={`text-3xl font-black ${totalSpent <= lastMonthTotalSpent ? 'text-emerald-500' : 'text-destructive'}`}>
                                    {totalSpent <= lastMonthTotalSpent ? '↓' : '↑'}
                                    {formatCurrency(Math.abs(totalSpent - lastMonthTotalSpent), userProfile?.preferredCurrency)}
                                  </p>
                                  <span className="text-[10px] font-bold opacity-60 pb-1.5 uppercase tracking-tighter">Variance</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="glass-card border-white/5 shadow-2xl">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Recent Activity</CardTitle>
                                <CardDescription>Detailed expense ledger</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
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
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-xl">
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
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
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
