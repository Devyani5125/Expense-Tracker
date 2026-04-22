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
      <body className="antialiased overflow-x-hidden">
        <FirebaseClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Immersive Background Architecture */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
              {/* Animated Aurora Layers */}
              <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[140px] animate-aurora opacity-60" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-secondary/10 blur-[130px] animate-aurora opacity-40 delay-700" />
              <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-aurora opacity-30 delay-1000" />
              
              {/* Fine Grained Overlay */}
              <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
              
              {/* Geometric Grid Pattern */}
              <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]" />
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