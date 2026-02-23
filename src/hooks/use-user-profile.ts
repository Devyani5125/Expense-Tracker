'use client';
import { useEffect, useMemo } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useDoc, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export function useUserProfile() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userProfileRef);

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    if (!userProfileRef) return;
    updateDocumentNonBlocking(userProfileRef, {
        ...profileData,
        updatedAt: serverTimestamp()
    });
  };
  
  return { userProfile, updateUserProfile, isLoading, error };
}
