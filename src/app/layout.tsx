import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'ExpenseWise - Track Your Spending',
  description: 'A modern and user-friendly expense tracker application to record, manage, and analyze your daily expenses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Stunning Background Elements */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
              {/* Animated Gradient Orbs */}
              <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-float opacity-50" />
              <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-[130px] animate-float-delayed opacity-40" />
              <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[100px] animate-float-slow opacity-30" />
              
              {/* Subtle Grid Overlay */}
              <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] dark:opacity-[0.07] text-foreground" />
              
              {/* Base Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/50" />
            </div>

            <main className="relative min-h-screen">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}