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
      <body className="antialiased overflow-x-hidden selection:bg-primary/30 min-h-screen">
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Immersive Background Architecture */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
              {/* Blue Aurora Layer */}
              <div className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vw] rounded-full bg-blue-500/15 dark:bg-blue-500/10 blur-[160px] animate-aurora opacity-60" />
              
              {/* Purple Aurora Layer */}
              <div className="absolute bottom-[-20%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-purple-500/15 dark:bg-purple-500/10 blur-[180px] animate-aurora-slow opacity-50 delay-700" />
              
              {/* Pink Aurora Layer */}
              <div className="absolute top-[20%] right-[0%] w-[80vw] h-[80vw] rounded-full bg-pink-500/15 dark:bg-pink-500/10 blur-[140px] animate-aurora-fast opacity-40 delay-1000" />
              
              {/* Green Aurora Layer */}
              <div className="absolute bottom-[10%] left-[5%] w-[85vw] h-[85vw] rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[150px] animate-aurora opacity-50 delay-300" />
              
              {/* Fine Grained Overlay */}
              <div className="absolute inset-0 bg-noise opacity-[0.04] dark:opacity-[0.06] pointer-events-none mix-blend-overlay" />
              
              {/* Geometric Grid Pattern */}
              <div className="absolute inset-0 bg-dot-pattern opacity-[0.06] dark:opacity-[0.08]" />
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