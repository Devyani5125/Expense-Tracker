
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingDown, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementBadgesProps {
  currentTotal: number;
  prevTotal: number;
  limit: number;
}

export function AchievementBadges({ currentTotal, prevTotal, limit }: AchievementBadgesProps) {
  const hasBudgetMaster = limit > 0 && currentTotal <= limit;
  const hasSavingsStar = limit > 0 && currentTotal < (limit * 0.5);
  const hasExpenseReducer = prevTotal > 0 && currentTotal < prevTotal;

  if (!hasBudgetMaster && !hasSavingsStar && !hasExpenseReducer) {
    return (
      <Card className="border-none bg-muted/30 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            Monthly Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">Keep logging your expenses to earn badges!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-primary/5 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Monthly Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <TooltipProvider>
          {hasBudgetMaster && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 py-1 gap-1">
                  <Trophy className="h-3 w-3" /> Budget Master
                </Badge>
              </TooltipTrigger>
              <TooltipContent>You stayed within your monthly budget!</TooltipContent>
            </Tooltip>
          )}
          {hasSavingsStar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 py-1 gap-1">
                  <Star className="h-3 w-3" /> Savings Star
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Incredible! You spent less than 50% of your budget.</TooltipContent>
            </Tooltip>
          )}
          {hasExpenseReducer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 py-1 gap-1">
                  <TrendingDown className="h-3 w-3" /> Expense Reducer
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Great job! You spent less than you did last month.</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
