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
    <div className="flex min-h-screen w-full flex-col bg-transparent relative">
      <ExpenseHeader
        onAddExpense={handleAddExpense}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 md:space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Operations <span className="text-primary text-glow">Centre</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Status: Active • {format(new Date(), 'PP')}</p>
            </div>
            
            <TabsList className="glass-card p-1.5 h-12 md:h-14 w-full md:w-auto grid grid-cols-4 md:flex gap-1 rounded-2xl border-none">
              {[
                { id: 'spending', icon: LayoutDashboard, label: 'Dash' },
                { id: 'advisor', icon: Cpu, label: 'AI' },
                { id: 'insights', icon: TrendingUp, label: 'Flow' },
                { id: 'eco', icon: Leaf, label: 'Eco' }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="rounded-xl px-2 md:px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <tab.icon className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline font-bold uppercase tracking-widest text-[9px]">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <TabsContent value="spending" className="m-0 space-y-8 md:space-y-10">
                  <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-8 md:space-y-10">
                      <ExpenseStats 
                        expenses={filteredExpenses} 
                        currency={userProfile?.preferredCurrency} 
                        budgetLimit={userProfile?.budgetLimit} 
                      />

                      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                        <Card className="glass-card border-none overflow-hidden">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-sm md:text-lg font-black uppercase tracking-widest">Capital Distribution</CardTitle>
                          </CardHeader>
                          <CardContent className="h-[300px] md:h-[350px]">
                            <ExpenseChart expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                          </CardContent>
                        </Card>
                        
                        <div className="space-y-6 md:space-y-8">
                          <BudgetAlert total={totalSpent} limit={userProfile?.budgetLimit || 0} currency={userProfile?.preferredCurrency} />
                          <AchievementBadges currentTotal={totalSpent} prevTotal={lastMonthTotalSpent} limit={userProfile?.budgetLimit || 0} />
                          <FinancialQuote />
                        </div>
                      </div>

                      <Card className="glass-card border-none overflow-hidden">
                        <CardHeader className="border-b border-white/5 pb-4 md:pb-6">
                           <div className="flex items-center justify-between">
                              <CardTitle className="text-sm md:text-lg font-black uppercase tracking-widest">Transaction Registry</CardTitle>
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

                    <div className="lg:col-span-4 space-y-6 md:space-y-8">
                      <DailyReminder expenses={expenses || []} />
                      <div className="hidden lg:block space-y-8">
                        <FinancialQuote />
                        <Card className="glass-card border-none">
                          <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">System Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold uppercase opacity-40">Monthly Velocity</span>
                              <span className="text-xl font-black">
                                {formatCurrency(totalSpent / (new Date().getDate()), userProfile?.preferredCurrency)}/day
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold uppercase opacity-40">Active Records</span>
                              <span className="text-xl font-black">{filteredExpenses.length}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
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

                <TabsContent value="insights" className="m-0 space-y-8">
                   <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
                      <div className="space-y-8">
                        <AchievementBadges currentTotal={totalSpent} prevTotal={lastMonthTotalSpent} limit={userProfile?.budgetLimit || 0} />
                        <Card className="glass-card border-none">
                          <CardHeader>
                            <CardTitle className="text-sm md:text-lg font-black uppercase tracking-widest">Strategic Overview</CardTitle>
                            <CardDescription className="text-xs">Performance delta relative to previous cycle.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-end gap-3">
                              <p className={cn(
                                "text-3xl md:text-4xl font-black",
                                totalSpent <= lastMonthTotalSpent ? 'text-emerald-500' : 'text-destructive'
                              )}>
                                {totalSpent <= lastMonthTotalSpent ? '↓' : '↑'}
                                {formatCurrency(Math.abs(totalSpent - lastMonthTotalSpent), userProfile?.preferredCurrency)}
                              </p>
                              <span className="text-[10px] font-black opacity-60 pb-1.5 uppercase tracking-tighter">Variance Delta</span>
                            </div>
                          </CardContent>
                        </Card>
                        <FinancialQuote />
                      </div>
                      <div className="space-y-8">
                         <Card className="glass-card border-none">
                            <CardHeader>
                               <CardTitle className="text-sm md:text-lg font-black uppercase tracking-widest">Budget Optimization</CardTitle>
                               <CardDescription className="text-xs">Insight based on current allocation trajectory.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <p className="text-xs font-medium opacity-70 leading-relaxed">
                                 {totalSpent > (userProfile?.budgetLimit || 0) 
                                   ? "Threshold exceeded. Recommend immediate reduction in discretionary spending to normalize fiscal stability."
                                   : "Current burn rate is within optimal parameters. Stability index remains high."}
                               </p>
                            </CardContent>
                         </Card>
                         <AchievementBadges currentTotal={totalSpent} prevTotal={lastMonthTotalSpent} limit={userProfile?.budgetLimit || 0} />
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="eco" className="m-0 space-y-8 md:space-y-10">
                  <CarbonFootprintView expenses={filteredExpenses} currency={userProfile?.preferredCurrency} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </main>

      {/* Futuristic Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-card rounded-[2.5rem] h-20 shadow-2xl flex items-center justify-around px-2 border-none">
         {[
           { id: 'spending', icon: LayoutDashboard, label: 'Dash' },
           { id: 'advisor', icon: Cpu, label: 'AI' },
           { id: 'insights', icon: Activity, label: 'Flow' },
           { id: 'eco', icon: Leaf, label: 'Eco' }
         ].map((nav) => (
           <button 
             key={nav.id}
             onClick={() => setActiveTab(nav.id)}
             className={cn(
               "flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 h-full justify-center",
               activeTab === nav.id ? "text-primary scale-110" : "text-muted-foreground opacity-50"
             )}
           >
             <nav.icon className={cn("h-6 w-6", activeTab === nav.id && "drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]")} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">{nav.label}</span>
           </button>
         ))}
      </nav>
    </div>
  );
}
