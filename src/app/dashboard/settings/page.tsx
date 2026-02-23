"use client";

import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
        router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <div>Loading...</div>;
    }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-2xl gap-2">
            <ProfileSettingsForm />
        </div>
      </main>
    </div>
  );
}
