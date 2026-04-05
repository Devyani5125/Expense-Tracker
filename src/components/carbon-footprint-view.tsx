'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Expense, Category, categoryIcons } from '@/lib/types';
import { getCarbonImpact, getRelatableImpact, getGreenScore, getImpactLevel, ECO_SUGGESTIONS } from '@/lib/carbon-utils';
import { Leaf, Trees, Zap, TrendingDown, Info, AlertCircle, Award, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { isSameDay, subDays } from 'date-fns';

interface CarbonFootprintViewProps {
  expenses: Expense[];
  currency?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#64748b'];

export function CarbonFootprintView({ expenses, currency }: CarbonFootprintViewProps) {
  const carbonStats = useMemo(() => {
    const categoryBreakdown: Record<string, number> = {};
    let totalCO2 = 0;

    expenses.forEach(e => {
      const impact = getCarbonImpact(e.amount, e.category);
      totalCO2 += impact;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + impact;
    });

    return {
      totalCO2,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
      trees: getRelatableImpact(totalCO2),
      score: getGreenScore(totalCO2),
    };
  }, [expenses]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), checkDate));
      const dayImpact = dayExpenses.reduce((sum, e) => sum + getCarbonImpact(e.amount, e.category), 0);
      
      // A "low carbon day" is under 5kg
      if (dayImpact < 5 && dayExpenses.length > 0) {
        count++;
      } else if (dayExpenses.length > 0) {
        break;
      }
    }
    return count;
  }, [expenses]);

  const highImpactCategories = useMemo(() => {
    return [...carbonStats.categoryBreakdown]
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
  }, [carbonStats]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Carbon Card */}
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Leaf className="h-20 w-20" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Monthly Footprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{carbonStats.totalCO2.toFixed(1)} <span className="text-sm font-medium">kg CO₂</span></div>
            <p className="text-[10px] mt-2 opacity-70 font-bold uppercase">Estimated Environmental Impact</p>
          </CardContent>
        </Card>

        {/* Tree Offset Card */}
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-brown-500 to-green-700 bg-emerald-50 text-emerald-900 border border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nature Offset</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
               <Trees className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black">{carbonStats.trees}</div>
              <p className="text-[10px] font-bold opacity-60 uppercase">Trees to Offset/Year</p>
            </div>
          </CardContent>
        </Card>

        {/* Green Score Card */}
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Eco Grade</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className={cn("text-5xl font-black", carbonStats.score.color)}>
              {carbonStats.score.grade}
            </div>
            <div className="text-right">
              <p className="text-sm font-black uppercase tracking-tight">{carbonStats.score.label}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Monthly Rating</p>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="border-none bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Eco Streak</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                <Award className="h-5 w-5 text-primary" />
             </div>
             <div>
                <div className="text-2xl font-black text-primary">{streak} Days</div>
                <p className="text-[10px] font-bold opacity-60 uppercase">Low-Carbon Streak</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Footprint Chart */}
        <Card className="shadow-lg border-none bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">CO₂ Breakdown</CardTitle>
            <CardDescription>Impact distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carbonStats.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {carbonStats.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-xl text-xs">
                            <p className="font-bold">{payload[0].name}</p>
                            <p className="text-muted-foreground">{payload[0].value.toFixed(1)} kg CO₂</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
               {carbonStats.categoryBreakdown.map((cat, idx) => (
                 <div key={cat.name} className="flex items-center gap-2 text-xs font-medium">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{cat.name}</span>
                    <span className="ml-auto opacity-60">{cat.value.toFixed(1)} kg</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Suggestions & Impact Table */}
        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Sustainable Choices
              </CardTitle>
              <CardDescription>Suggestions based on your top impact areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highImpactCategories.length > 0 ? (
                highImpactCategories.map(cat => (
                  <div key={cat.name} className="p-4 rounded-xl bg-muted/30 border border-emerald-100/20">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-600">{cat.name} Impact</span>
                       <div className="ml-auto h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                       </div>
                    </div>
                    <ul className="space-y-3">
                      {(ECO_SUGGESTIONS[cat.name] || ECO_SUGGESTIONS['Others'] || []).map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs leading-relaxed">
                          <TrendingDown className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground font-medium">No high-carbon activity detected yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-orange-500/5">
             <CardContent className="p-4 flex gap-4">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-orange-600 uppercase tracking-tighter">Carbon Warning</p>
                  <p className="text-xs text-orange-700/80 leading-relaxed">
                    Transportation and Shopping are currently your largest CO₂ drivers. Small shifts in these areas have the biggest net-positive effect on your grade.
                  </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
