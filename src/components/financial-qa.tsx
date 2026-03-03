'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Loader2, TrendingDown, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { analyzeFinancials, FinancialQAOutput } from '@/ai/flows/financial-qa-flow';
import { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
      // Prepare data for AI
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
      case 'positive': return '✨';
      case 'cautionary': return '⚠️';
      default: return '💡';
    }
  };

  return (
    <Card className="shadow-lg border-none bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <CardHeader className="pb-3 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Smart Financial Q&A
            </CardTitle>
            <CardDescription className="text-xs">Ask anything about your spending</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form onSubmit={handleAskAI} className="flex gap-2">
          <Input
            placeholder="e.g., How can I save more this month?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="bg-background/50 border-primary/20 focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            size="icon"
            className="shrink-0 rounded-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className={cn(
              "p-4 rounded-xl text-sm leading-relaxed border-l-4 shadow-sm",
              result.sentiment === 'positive' ? "bg-green-500/5 border-green-500 text-green-900 dark:text-green-100" :
              result.sentiment === 'cautionary' ? "bg-destructive/5 border-destructive text-destructive" :
              "bg-primary/5 border-primary text-foreground"
            )}>
              <div className="flex items-center gap-2 mb-2 font-bold uppercase text-[10px] tracking-widest opacity-70">
                <MessageSquareQuote className="h-3 w-3" />
                AI Analysis {getSentimentIcon(result.sentiment)}
              </div>
              {result.answer}
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lightbulb className="h-3 w-3" /> Actionable Suggestions
              </h4>
              <div className="grid gap-2">
                {result.suggestions.map((suggestion, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-primary/10 text-xs hover:bg-card transition-colors group"
                  >
                    <TrendingDown className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && !isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {[
              "Where am I spending most?",
              "Am I doing better than last month?",
              "How to stay under budget?",
              "Analyze my food habits"
            ].map((suggested) => (
              <button
                key={suggested}
                onClick={() => {
                  setQuestion(suggested);
                }}
                className="text-left text-[10px] p-2 rounded-md bg-muted/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary border border-transparent hover:border-primary/20"
              >
                {suggested}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
