
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories, Category, Expense } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Zap, Calculator, ArrowRight } from 'lucide-react';

interface WhatIfSimulatorProps {
  expenses: Expense[];
  currentTotal: number;
  budgetLimit: number;
  currency?: string;
}

export function WhatIfSimulator({ expenses, currentTotal, budgetLimit, currency }: WhatIfSimulatorProps) {
  const [targetCategory, setTargetCategory] = useState<Category | 'all'>('Food');
  const [reductionPercent, setReductionPercent] = useState(10);
  const [incomeIncrease, setIncomeIncrease] = useState(0);

  const categorySpent = useMemo(() => {
    if (targetCategory === 'all') return currentTotal;
    return expenses
      .filter(e => e.category === targetCategory)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, targetCategory, currentTotal]);

  const potentialSavings = (categorySpent * reductionPercent) / 100;
  const simulatedTotal = currentTotal - potentialSavings;
  const simulatedBudgetRemaining = (budgetLimit + incomeIncrease) - simulatedTotal;

  return (
    <Card className="shadow-lg border-none bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          What-If Simulator
        </CardTitle>
        <CardDescription>Simulate savings and income changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Reduce Spending In</Label>
            <Select value={targetCategory} onValueChange={(val: any) => setTargetCategory(val)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Reduction: {reductionPercent}%</Label>
              <span className="text-xs font-bold text-primary">-{formatCurrency(potentialSavings, currency)}</span>
            </div>
            <Slider 
              value={[reductionPercent]} 
              onValueChange={(val) => setReductionPercent(val[0])} 
              max={100} 
              step={5} 
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Extra Monthly Budget/Income</Label>
            <div className="relative">
              <Input 
                type="number" 
                placeholder="0.00" 
                value={incomeIncrease} 
                onChange={(e) => setIncomeIncrease(Number(e.target.value))}
                className="bg-background pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-primary/10 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Simulated Total</span>
            <span className="font-bold">{formatCurrency(simulatedTotal, currency)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">New Budget Status</span>
            <span className={`font-bold ${simulatedBudgetRemaining >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {simulatedBudgetRemaining >= 0 ? '+' : ''}{formatCurrency(simulatedBudgetRemaining, currency)}
            </span>
          </div>
          <div className="bg-primary/20 p-3 rounded-lg flex items-center gap-3 animate-pulse">
            <Calculator className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[10px] font-medium leading-tight">
              Reducing {targetCategory} by {reductionPercent}% would save you {formatCurrency(potentialSavings, currency)} this month!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
