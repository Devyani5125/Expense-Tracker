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
import { Wallet, MessageSquareText, Lightbulb, Leaf, ShieldAlert, UserPlus, Sparkles, Cpu, Activity, TrendingUp } from 'lucide-react';
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

const TabBackground = ({ activeTab }: { activeTab: string }) => {
  const configs: Record<string, { aurora: string; blobs: string[]; animationType?: 'float' | 'rise' }> = {
    spending: {
      aurora: "from-cyan-600/20 via-blue-500/5 to-transparent",
      blobs: ["bg-cyan-400/10", "bg-blue-500/10", "bg-teal-300/5"],
      animationType: 'float'
    },
    advisor: {
      aurora: "from-purple-700/25 via-violet-600/10 to-transparent",
      blobs: ["bg-purple-500/15", "bg-indigo-600/15", "bg-pink-400/5"],
      animationType: 'float'
    },
    insights: {
      aurora: "from-blue-600/20 via-cyan-500/5 to-transparent",
      blobs: ["bg-blue-400/15", "bg-cyan-500/10", "bg-indigo-300/5"],
      animationType: 'float'
    },
    eco: {
      aurora: "from-emerald-800/20 via-teal-700/10 to-transparent",
      blobs: ["bg-emerald-500/15", "bg-teal-400/10", "bg-green-300/5"],
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
          transition={{ duration: 0.8 }}
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
              opacity: [0, 0.3, 0]
            } : { 
              scale: [1, 1.2, 1], 
              opacity: [0.1, 0.3, 0.1],
              x: [0, 40, -40, 0],
              y: [0, -40, 40, 0]
            }}
            transition={{ 
              duration: current.animationType === 'rise' ? 10 + i * 5 : 20 + i * 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 2
            }}
            className={cn(
              "absolute rounded-full blur-[100px]",
              blobClass,
              current.animationType === 'rise' ? "w-40 h-40" : 
              i === 0 ? "w-[400px] h-[400px] -top-20 -left-20" :
              i === 1 ? "w-[500px] h-[500px] -bottom-40 -right-20" :
              "w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          />
        ))}
      </div>
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
        if (error.code === 'auth/email-already-in-use') errorMessage = "This email is already associated with an account.";
        else if (error.code === 'auth/weak-password') errorMessage = "Security risk: Password is too weak.";
        else if (error.code === 'auth/invalid-email') errorMessage = "Format error: Invalid email address.";

        toast({
          variant: "destructive",
          title: "Access Denied",
          description: errorMessage,
        });
      });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
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
    <div className="flex min-h-screen w-full flex-col selection:bg-primary/30 overflow-x-hidden bg-background relative">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      
      <main className="flex flex-1 flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
          <div className="flex items-center justify-between flex-col md:flex-row gap-8 relative z-30">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Operations <span className="text-primary text-glow">Desk</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Status: Nominal • Sync Active</p>
            </div>
            
            <TabsList className="grid grid-cols-4 w-full md:w-[640px] h-16 glass-card p-1.5 border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/40 rounded-2xl shadow-2xl">
              <TabsTrigger value="spending" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-500">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-500">
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">AI Neural</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-500">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="eco" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-500">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline font-black uppercase tracking-widest text-[10px]">Eco Sync</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative min-h-[800px] rounded-[3rem] p-4 md:p-10 overflow-hidden border border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/30 shadow-3xl">
            <TabBackground activeTab={activeTab} />

            <div className="relative z-10 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, filter: 'blur(15px)', y: 30 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(15px)', y: -30 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TabsContent value="spending" className="m-0 space-y-12">
                    <div className="grid gap-10 lg:grid-cols-12 items-start">
                      <div className="lg:col-span-8 space-y-12">
                        <section>
                          <ExpenseStats 
                            expenses={filteredExpenses} 
                            currency={userProfile?.preferredCurrency} 
                            budgetLimit={userProfile?.budgetLimit} 
                          />
                        </section>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Visualized Ledger</h3>
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Period: {format(currentMonth, 'MMMM yyyy')}</p>
                          </div>
                          
                          <BudgetAlert 
                            total={totalSpent} 
                            limit={userProfile?.budgetLimit || 0} 
                            currency={userProfile?.preferredCurrency} 
                          />

                          <div className="grid gap-10 md:grid-cols-2">
                            <Card className="glass-card border-none shadow-2xl overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <CardHeader>
                                <CardTitle className="text-lg font-black uppercase tracking-[0.2em] text-glow">Capital Map</CardTitle>
                                <CardDescription className="text-[10px] uppercase tracking-widest opacity-40">Neural Spending Distribution</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[420px] w-full">
                                  <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                                </div>
                              </CardContent>
                            </Card>

                            <div className="space-y-10">
                              <Card className="glass-card border-none shadow-2xl p-8 space-y-6">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Capacity</p>
                                  <h4 className="text-2xl font-black tracking-tight">Efficiency Metrics</h4>
                                </div>
                                <div className="space-y-6">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                      <span>Current Drift</span>
                                      <span>{((totalSpent / (userProfile?.budgetLimit || 1)) * 100).toFixed(1)}%</span>
                                    </div>
                                    <Progress value={((totalSpent / (userProfile?.budgetLimit || 1)) * 100)} className="h-1.5 bg-black/5 dark:bg-white/5" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Volume</p>
                                        <p className="text-2xl font-black">{filteredExpenses.length}</p>
                                     </div>
                                     <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Avg Flux</p>
                                        <p className="text-2xl font-black">{((totalSpent / 30) || 0).toFixed(0)}</p>
                                     </div>
                                  </div>
                                </div>
                              </Card>
                              <FinancialQuote />
                            </div>
                          </div>
                        </div>

                        <Card className="glass-card border-none shadow-3xl">
                          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 dark:border-white/5 pb-6">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-black uppercase tracking-[0.2em]">Live Registry</CardTitle>
                                <CardDescription className="text-[10px] uppercase tracking-widest opacity-40">Authenticated Transaction Streams</CardDescription>
                            </div>
                            <div className="flex gap-2">
                               <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/20">
                                  <Activity className="h-5 w-5 text-primary" />
                               </div>
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

                      <div className="lg:col-span-4 space-y-12 lg:sticky lg:top-24">
                        <DailyReminder expenses={expenses || []} />
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
                    </div>
                  </TabsContent>

                  <TabsContent value="advisor" className="m-0 max-w-4xl mx-auto w-full space-y-12">
                    <div className="text-center space-y-4 mb-12">
                       <h3 className="text-4xl font-black tracking-tighter uppercase">AI Intelligence <span className="text-primary text-glow">Core</span></h3>
                       <p className="text-xs uppercase tracking-[0.4em] opacity-40 max-w-md mx-auto">Analyzing data patterns to optimize your financial trajectory</p>
                    </div>
                    <FinancialQuote />
                    <FinancialQA 
                      expenses={filteredExpenses} 
                      currency={userProfile?.preferredCurrency} 
                      budgetLimit={userProfile?.budgetLimit} 
                    />
                  </TabsContent>

                  <TabsContent value="insights" className="m-0 space-y-12">
                    <div className="grid gap-12 lg:grid-cols-2">
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
                    <Card className="glass-card border-none p-12 text-center">
                       <Lightbulb className="h-12 w-12 text-primary mx-auto mb-6 opacity-20" />
                       <h4 className="text-2xl font-black tracking-tight mb-2 uppercase">Pattern Discovery</h4>
                       <p className="text-xs text-muted-foreground uppercase tracking-widest max-w-sm mx-auto">Unlock deeper insights as you log more transactions. Our engine requires at least 15 entries for deep-cycle analysis.</p>
                    </Card>
                  </TabsContent>

                  <TabsContent value="eco" className="m-0 space-y-12">
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

      {/* Persistent Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-card bg-white/60 dark:bg-black/60 backdrop-blur-3xl border-black/5 dark:border-white/10 rounded-3xl h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around px-4">
         {[
           { id: 'spending', icon: Wallet, label: 'Dash' },
           { id: 'advisor', icon: Cpu, label: 'AI' },
           { id: 'insights', icon: Activity, label: 'Flow' },
           { id: 'eco', icon: Leaf, label: 'Eco' }
         ].map((tab) => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "flex flex-col items-center gap-1.5 transition-all duration-300",
               activeTab === tab.id ? "text-primary scale-110" : "text-foreground/40 hover:text-foreground/60"
             )}
           >
             <tab.icon className={cn("h-6 w-6", activeTab === tab.id && "drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]")} />
             <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Sign-up Modal */}
      <Dialog 
        open={showSignUpPrompt} 
        onOpenChange={(open) => {
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
                  className="h-14 bg-white/5 border-white/10 font-black text-lg px-6 focus-visible:ring-primary rounded-2xl text-white"
                />
                <Input
                  type="password"
                  placeholder="Security Cipher"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="h-14 bg-white/5 border-white/10 font-black text-lg px-6 focus-visible:ring-primary rounded-2xl text-white"
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