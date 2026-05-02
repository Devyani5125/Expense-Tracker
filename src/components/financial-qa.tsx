'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Loader2, TrendingDown, Lightbulb, MessageSquareQuote, BrainCircuit, RefreshCw } from 'lucide-react';
import { analyzeFinancials, FinancialQAOutput } from '@/ai/flows/financial-qa-flow';
import { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialQAProps {
  expenses: Expense[];
  currency?: string;
  budgetLimit?: number;
}

export function FinancialQA({ expenses, currency = 'INR', budgetLimit }: FinancialQAProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FinancialQAOutput | null>(null);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const serializedExpenses = expenses.map(e => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: format(new Date(e.date), 'yyyy-MM-dd'),
        paymentMethod: e.paymentMethod,
      }));

      const response = await analyzeFinancials({
        expenses: serializedExpenses,
        question,
        currency,
        budgetLimit,
      });

      setResult(response);
    } catch (error) {
      console.error('AI Q&A Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Sparkles className="h-4 w-4 text-emerald-400" />;
      case 'cautionary': return <TrendingDown className="h-4 w-4 text-rose-400" />;
      default: return <BrainCircuit className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card className="glass-card border-none overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <CardHeader className="pb-4 relative z-10 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              Neural <span className="text-primary text-glow">Consultant</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              Personalized Financial Intelligence • Real-time Sync
            </CardDescription>
          </div>
          {result && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setResult(null); setQuestion(''); }}
              className="h-8 w-8 rounded-full hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4 opacity-40" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6 relative z-10">
        <form onSubmit={handleAskAI} className="flex gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Ask about spending, savings, or general finance..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="h-14 bg-white/5 border-white/10 rounded-2xl pl-6 pr-12 focus-visible:ring-primary/40 focus-visible:bg-white/10 transition-all text-sm font-medium"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
               {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary opacity-50" /> : <Sparkles className="h-5 w-5 text-primary opacity-20" />}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className={cn(
                "p-6 rounded-[2rem] text-sm leading-relaxed border backdrop-blur-3xl shadow-2xl",
                result.sentiment === 'positive' ? "bg-emerald-500/5 border-emerald-500/20" :
                result.sentiment === 'cautionary' ? "bg-rose-500/5 border-rose-500/20" :
                "bg-white/5 border-white/10"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  {getSentimentIcon(result.sentiment)}
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Intelligence Output</span>
                </div>
                <div className="text-foreground/90 font-medium leading-relaxed">
                  {result.answer}
                </div>
              </div>

              <div className="grid gap-3">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 px-2">Strategic Recommendations</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {result.suggestions.map((suggestion, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group flex flex-col gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-[11px] leading-snug font-medium opacity-80">{suggestion}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : !isLoading && (
            <div className="space-y-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-2">Neural Suggestions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "How can I optimize my Food spending?",
                  "Explain the 50/30/20 rule to me.",
                  "What's my spending velocity this week?",
                  "Recommend a simple investment strategy."
                ].map((suggested) => (
                  <button
                    key={suggested}
                    onClick={() => {
                      setQuestion(suggested);
                    }}
                    className="text-left text-[11px] p-4 rounded-2xl bg-white/5 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 text-muted-foreground hover:text-primary font-medium"
                  >
                    {suggested}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
