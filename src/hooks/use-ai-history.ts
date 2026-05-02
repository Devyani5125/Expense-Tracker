
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { FinancialQAOutput } from '@/ai/flows/financial-qa-flow';

export interface AIInteraction extends FinancialQAOutput {
  id: string;
  userId: string;
  question: string;
  createdAt: any;
}

export function useAIHistory(userId?: string) {
  const firestore = useFirestore();

  const historyColRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'aiHistory');
  }, [firestore, userId]);

  const historyQuery = useMemoFirebase(() => {
    if (!historyColRef) return null;
    return query(historyColRef, orderBy('createdAt', 'desc'), limit(10));
  }, [historyColRef]);

  const { data: history, isLoading, error } = useCollection<AIInteraction>(historyQuery);

  const saveInteraction = (question: string, result: FinancialQAOutput) => {
    if (!historyColRef || !userId) return;
    addDocumentNonBlocking(historyColRef, {
      userId,
      question,
      ...result,
      createdAt: serverTimestamp(),
    });
  };

  return { history, saveInteraction, isLoading, error };
}
