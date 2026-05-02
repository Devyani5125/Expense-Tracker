import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'ExpenseWise - Intelligent Spending',
  description: 'A modern, futuristic financial command center for tracking, managing, and optimizing your wealth.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden selection:bg-primary/30">
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Immersive Background Architecture */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
              {/* Blue Aurora Layer */}
              <div className="absolute top-[-10%] left-[-5%] w-[70vw] h-[70vw] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] animate-aurora opacity-50" />
              
              {/* Purple Aurora Layer */}
              <div className="absolute bottom-[-5%] right-[-5%] w-[65vw] h-[65vw] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[130px] animate-aurora-slow opacity-40 delay-700" />
              
              {/* Pink Aurora Layer */}
              <div className="absolute top-[30%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[110px] animate-aurora-fast opacity-30 delay-1000" />
              
              {/* Green Aurora Layer */}
              <div className="absolute bottom-[20%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] animate-aurora opacity-40 delay-300" />
              
              {/* Fine Grained Overlay */}
              <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" />
              
              {/* Geometric Grid Pattern */}
              <div className="absolute inset-0 bg-dot-pattern opacity-[0.04] dark:opacity-[0.06]" />
            </div>

            <div className="relative flex flex-col min-h-screen">
              {children}
            </div>
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
