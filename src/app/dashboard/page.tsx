"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Category } from '@/lib/types';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseHeader from '@/components/expense-header';
import ExpenseStats from '@/components/expense-stats';
import ExpenseChart from '@/components/expense-chart';
import { ExpenseTable } from '@/components/expense-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase';
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
import { Wallet, Leaf, Cpu, Activity, TrendingUp, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(user?.uid);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('spending');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

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
    addExpense(data);
    triggerCelebration();

    if (userProfile?.budgetLimit && (totalSpent + data.amount) > userProfile.budgetLimit) {
      toast({
        title: "Budget Cap Reached",
        description: "Transaction logged, but you have exceeded your target allocation.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sync Successful",
        description: "Transaction entry has been committed to your cloud ledger.",
      });
    }
  };

  const handleUpdateExpense = (data: Expense) => {
    updateExpense(data);
    toast({ title: "Entry Modified", description: "Ledger has been updated with new parameters." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    toast({ title: "Entry Purged", description: "Record removed from history.", variant: "destructive" });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-t-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]"
        />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background selection:bg-primary/30 relative">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Operations <span className="text-primary text-glow">Centre</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Status: Active • {format(new Date(), 'PP')}</p>
            </div>
            
            <TabsList className="glass-card p-1.5 h-14 w-full md:w-auto grid grid-cols-4 md:flex gap-1 rounded-2xl">
              {[
                { id: 'spending', icon: LayoutDashboard, label: 'Dash' },
                { id: 'advisor', icon: Cpu, label: 'AI' },
                { id: 'insights', icon: TrendingUp, label: 'Flow' },
                { id: 'eco', icon: Leaf, label: 'Eco' }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="rounded-xl px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <tab.icon className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline font-bold uppercase tracking-widest text-[9px]">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[600px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TabsContent value="spending" className="m-0 space-y-10">
                  <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-10">
                      <ExpenseStats 
                        expenses={filteredExpenses} 
                        currency={userProfile?.preferredCurrency} 
                        budgetLimit={userProfile?.budgetLimit} 
                      />

                      <div className="grid gap-8 md:grid-cols-2">
                        <Card className="glass-card border-none">
                          <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-widest">Capital Distribution</CardTitle>
                          </CardHeader>
                          <CardContent className="h-[350px]">
                            <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                          </CardContent>
                        </Card>
                        
                        <div className="space-y-8">
                          <BudgetAlert total={totalSpent} limit={userProfile?.budgetLimit || 0} currency={userProfile?.preferredCurrency} />
                          <FinancialQuote />
                          <AchievementBadges currentTotal={totalSpent} prevTotal={lastMonthTotalSpent} limit={userProfile?.budgetLimit || 0} />
                        </div>
                      </div>

                      <Card className="glass-card border-none overflow-hidden">
                        <CardHeader className="border-b border-white/5 pb-6">
                           <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-black uppercase tracking-widest">Transaction Registry</CardTitle>
                              <Sparkles className="h-5 w-5 text-primary opacity-20" />
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

                    <div className="lg:col-span-4 space-y-10">
                      <DailyReminder expenses={expenses || []} />
                      <WhatIfSimulator 
                        expenses={filteredExpenses} 
                        currentTotal={totalSpent} 
                        budgetLimit={userProfile?.budgetLimit || 0} 
                        currency={userProfile?.preferredCurrency}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advisor" className="m-0 max-w-4xl mx-auto space-y-10">
                  <FinancialQA 
                    expenses={filteredExpenses} 
                    currency={userProfile?.preferredCurrency} 
                    budgetLimit={userProfile?.budgetLimit} 
                  />
                </TabsContent>

                <TabsContent value="insights" className="m-0 space-y-10">
                   <div className="grid gap-8 lg:grid-cols-2">
                      <AchievementBadges currentTotal={totalSpent} prevTotal={lastMonthTotalSpent} limit={userProfile?.budgetLimit || 0} />
                      <WhatIfSimulator 
                        expenses={filteredExpenses} 
                        currentTotal={totalSpent} 
                        budgetLimit={userProfile?.budgetLimit || 0} 
                        currency={userProfile?.preferredCurrency}
                      />
                   </div>
                </TabsContent>

                <TabsContent value="eco" className="m-0 space-y-10">
                  <CarbonFootprintView expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </main>

      {/* Futuristic Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-card rounded-[2rem] h-20 shadow-2xl flex items-center justify-around px-2 border border-white/10">
         {[
           { id: 'spending', icon: LayoutDashboard, label: 'Dash' },
           { id: 'advisor', icon: Cpu, label: 'AI' },
           { id: 'insights', icon: Activity, label: 'Stats' },
           { id: 'eco', icon: Leaf, label: 'Eco' }
         ].map((nav) => (
           <button 
             key={nav.id}
             onClick={() => setActiveTab(nav.id)}
             className={cn(
               "flex flex-col items-center gap-1.5 transition-all duration-300 flex-1",
               activeTab === nav.id ? "text-primary scale-110" : "text-muted-foreground opacity-60"
             )}
           >
             <nav.icon className={cn("h-6 w-6", activeTab === nav.id && "drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]")} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">{nav.label}</span>
           </button>
         ))}
      </nav>
    </div>
  );
}