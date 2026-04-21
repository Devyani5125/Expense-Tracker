'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Sparkles, TrendingUp, Leaf, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const knowledgeItems = [
  // Motivational Quotes
  { type: 'motivation', text: "The goal isn't more money. The goal is living life on your terms.", author: "Chris Brogan" },
  { type: 'motivation', text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { type: 'motivation', text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  
  // Financial Tips
  { type: 'tip', text: "Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings or debt.", author: "Smart Finance" },
  { type: 'tip', text: "Wait 48 hours before buying luxury items to see if you still want them. Impulse is the enemy of wealth.", author: "Wealth Mindset" },
  { type: 'tip', text: "An emergency fund should cover at least 3-6 months of essential living expenses.", author: "Stability Guide" },

  // Eco-Friendly Suggestions
  { type: 'eco', text: "Switching to digital billing saves trees and reduces your physical carbon footprint.", author: "Green Sync" },
  { type: 'eco', text: "Support companies with ethical supply chains. Your spending power is your voice for the planet.", author: "Eco Tracker" },
  { type: 'eco', text: "Buying local reduces transport emissions and supports your immediate community economy.", author: "Sustainable Living" }
];

const typeConfigs: Record<string, { icon: any, color: string, label: string }> = {
  motivation: { icon: Quote, color: 'text-primary', label: 'Inspiration' },
  tip: { icon: TrendingUp, color: 'text-secondary', label: 'Financial Tip' },
  eco: { icon: Leaf, color: 'text-emerald-400', label: 'Eco Insight' }
};

export function FinancialQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % knowledgeItems.length);
    }, 10000); // Change every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const current = knowledgeItems[index];
  const config = typeConfigs[current.type];

  return (
    <Card className="border-none bg-white/5 glass-card shadow-2xl overflow-hidden group relative min-h-[140px] flex items-center">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
         <config.icon className="h-32 w-32" />
      </div>
      
      <CardContent className="p-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-start gap-6"
          >
            <div className={cn("h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0", config.color)}>
               <config.icon className="h-6 w-6" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", config.color)}>
                  {config.label}
                </span>
                <Sparkles className={cn("h-3 w-3 opacity-30", config.color)} />
              </div>
              <p className="text-sm font-medium italic text-white/80 leading-relaxed max-w-xl">
                "{current.text}"
              </p>
              {current.author && (
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                  — {current.author}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
