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
import { Wallet, MessageSquareText, Lightbulb, Leaf, ShieldAlert, UserPlus, Sparkles, Cpu } from 'lucide-react';
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
import { cn, formatCurrency } from '@/lib/utils';

const GUEST_EXPENSE_LIMIT = 5;

const TabBackground = ({ activeTab }: { activeTab: string }) => {
  const configs: Record<string, { aurora: string; blobs: string[]; animationType?: 'float' | 'rise' }> = {
    spending: {
      aurora: "from-cyan-600/30 via-blue-500/10 to-transparent",
      blobs: ["bg-cyan-400/20", "bg-blue-500/15", "bg-teal-300/10"],
      animationType: 'float'
    },
    advisor: {
      aurora: "from-purple-700/35 via-violet-600/15 to-transparent",
      blobs: ["bg-purple-500/20", "bg-indigo-600/20", "bg-pink-400/10"],
      animationType: 'float'
    },
    insights: {
      aurora: "from-blue-600/30 via-cyan-500/10 to-transparent",
      blobs: ["bg-blue-400/20", "bg-cyan-500/15", "bg-indigo-300/10"],
      animationType: 'float'
    },
    eco: {
      aurora: "from-emerald-800/30 via-teal-700/15 to-transparent",
      blobs: ["bg-emerald-500/20", "bg-teal-400/15", "bg-green-300/10"],
      animationType: 'rise'
    },
  };

  const current = configs[activeTab] || configs.spending;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
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
      <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
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
        title: "System Threshold Reached",
        description: "Transaction processed, but budget allocation has been exceeded.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ledger Synchronized",
        description: "Transaction data successfully committed to the database.",
      });
    }
  };

  const handleUpdateExpense = (data: Expense) => {
    updateExpense(data);
    toast({
      title: "Entry Modified",
      description: "Ledger entry updated with new parameters.",
    });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    toast({
      title: "Entry Purged",
      description: "Transaction record permanently removed from sync.",
      variant: "destructive",
    });
  };

  const handleFinalSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle the non-blocking sign up but catch specific credential errors
    initiateEmailSignUp(auth, signUpEmail, signUpPassword)
      .then(() => {
        setShowSignUpPrompt(false);
        toast({
          title: "Protocol Established",
          description: "User profile activated. All guest data has been migrated.",
        });
      })
      .catch((error: any) => {
        let errorMessage = "Credential validation failed. Please check your inputs.";
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "This email is already associated with an account. Please use a unique identifier.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "Security risk: Password is too weak. Please use at least 6 characters.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Format error: Please enter a valid email address.";
        }

        toast({
          variant: "destructive",
          title: "Access Denied",
          description: errorMessage,
        });
      });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#020617]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="relative h-20 w-20"
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
        </motion.div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  const currentCount = expenses?.length || 0;
  const progressPercent = Math.min((currentCount / GUEST_EXPENSE_LIMIT) * 100, 100);
  
  return (
    <div className="flex min-h-screen w-full flex-col selection:bg-primary/30 overflow-x-hidden bg-[#020617]">
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
            <TabsList className="grid grid-cols-4 w-full md:w-[600px] h-14 glass-card p-1 border-white/5 bg-black/40">
              <TabsTrigger value="spending" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Spending</span>
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">AI Neural</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="eco" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Eco Sync</span>
              </TabsTrigger>
            </TabsList>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block w-[350px]"
            >
               <DailyReminder expenses={expenses || []} />
            </motion.div>
          </div>

          <div className="relative min-h-[750px] rounded-[3rem] p-1 md:p-8 overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
            <TabBackground activeTab={activeTab} />

            <div className="relative z-10 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TabsContent value="spending" className="m-0 space-y-10">
                    <section>
                      <ExpenseStats 
                        expenses={filteredExpenses} 
                        currency={userProfile?.preferredCurrency} 
                        budgetLimit={userProfile?.budgetLimit} 
                      />
                    </section>

                    <div className="grid gap-10 lg:grid-cols-12">
                      <div className="lg:col-span-12 space-y-10">
                        <BudgetAlert 
                          total={totalSpent} 
                          limit={userProfile?.budgetLimit || 0} 
                          currency={userProfile?.preferredCurrency} 
                        />

                        <div className="grid gap-10 md:grid-cols-2">
                          <Card className="glass-card border-none shadow-2xl hover:border-primary/20 transition-all group">
                            <CardHeader>
                              <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-glow">Data Distribution</CardTitle>
                              <CardDescription className="text-xs uppercase tracking-widest opacity-50">Spending Neural Map - {format(currentMonth, 'MMMM yyyy')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[400px] w-full py-4">
                                <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="glass-card border-none shadow-2xl">
                            <CardHeader>
                              <CardTitle className="text-xl font-black uppercase tracking-[0.2em]">Core Metrics</CardTitle>
                              <CardDescription className="text-xs uppercase tracking-widest opacity-50">Real-time Performance Analysis</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-4">
                              <div className="grid grid-cols-2 gap-6">
                                <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Sync Count</p>
                                  <p className="text-4xl font-black tracking-tighter">{filteredExpenses.length}</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2">Daily Flux</p>
                                  <p className="text-4xl font-black tracking-tighter">{((totalSpent / 30) || 0).toFixed(0)}</p>
                                </motion.div>
                              </div>
                              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Sync Delta (vs Previous Cycle)</p>
                                <div className="flex items-end gap-3">
                                  <p className={`text-4xl font-black tracking-tighter ${totalSpent <= lastMonthTotalSpent ? 'text-cyan-400' : 'text-rose-500'}`}>
                                    {totalSpent <= lastMonthTotalSpent ? '-' : '+'}
                                    {formatCurrency(Math.abs(totalSpent - lastMonthTotalSpent), userProfile?.preferredCurrency)}
                                  </p>
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 pb-2">Variance</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="glass-card border-none shadow-2xl">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-[0.2em]">Transaction Registry</CardTitle>
                                <CardDescription className="text-xs uppercase tracking-widest opacity-50">Authenticated Sync History</CardDescription>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/20">
                                <Cpu className="h-6 w-6 text-primary" />
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

                  <TabsContent value="advisor" className="m-0 max-w-4xl mx-auto w-full space-y-10">
                    <FinancialQuote />
                    <FinancialQA 
                      expenses={filteredExpenses} 
                      currency={userProfile?.preferredCurrency} 
                      budgetLimit={userProfile?.budgetLimit} 
                    />
                  </TabsContent>

                  <TabsContent value="insights" className="m-0 space-y-10">
                    <div className="grid gap-10 lg:grid-cols-2">
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
          // If we've reached the limit, don't allow closing without signing up
          if (user?.isAnonymous && currentCount >= GUEST_EXPENSE_LIMIT) return;
          setShowSignUpPrompt(open);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none glass-card shadow-[0_0_100px_rgba(0,0,0,1)]">
          <div className="bg-gradient-to-br from-primary/30 via-secondary/20 to-black p-10 text-white relative overflow-hidden border-b border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <DialogHeader className="relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/30 shadow-2xl">
                <ShieldAlert className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter uppercase">Quota Limit Reached</DialogTitle>
              <DialogDescription className="text-white/70 font-medium text-lg leading-tight mt-4 tracking-tight">
                Guest session full. Sign up to track unlimited expenses & unlock all premium AI features.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-10 space-y-8 bg-black/40">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                <span>Memory Allocation</span>
                <span>{currentCount}/{GUEST_EXPENSE_LIMIT} Segments</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-white/5 rounded-full" />
            </div>

            <form onSubmit={handleFinalSignUp} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Registry Email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 font-black text-lg px-6 focus-visible:ring-primary rounded-2xl"
                />
                <Input
                  type="password"
                  placeholder="Security Cipher"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 font-black text-lg px-6 focus-visible:ring-primary rounded-2xl"
                />
              </div>
              <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(var(--primary),0.3)] bg-primary text-primary-foreground hover:scale-[1.02] transition-all rounded-2xl">
                <UserPlus className="mr-3 h-5 w-5" /> INITIALIZE SYNC
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
