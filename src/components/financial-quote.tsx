
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const quotes = [
  { text: "The goal isn't more money. The goal is living life on your terms.", author: "Chris Brogan" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", author: "Dave Ramsey" },
  { text: "It’s not how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" }
];

export function FinancialQuote() {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  if (!quote) return null;

  return (
    <Card className="border-none bg-primary/5 shadow-none overflow-hidden group">
      <CardContent className="p-6 flex items-start gap-4">
        <Quote className="h-6 w-6 text-primary shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="space-y-1">
          <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">
            — {quote.author}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
