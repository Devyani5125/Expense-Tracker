
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, Sparkles, Mail, Key, UserPlus, LogIn, ArrowRight, ShieldAlert, Fingerprint, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 3;
const DOT_COUNT = GRID_SIZE * GRID_SIZE;
const LOCKOUT_DURATION = 30000;
const MIN_PATTERN_LENGTH = 4;

export default function AuthPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);

  // Auth Mode State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthPending, setIsAuthPending] = useState(false);

  // Pattern Lock State
  const [patternState, setPatternState] = useState<'unlock' | 'set' | 'confirm' | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [tempPattern, setTempPattern] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Memoized Dot Coordinates
  const dotCoords = useMemo(() => {
    return Array.from({ length: DOT_COUNT }).map((_, i) => ({
      x: (i % GRID_SIZE) * 100 + 50,
      y: Math.floor(i / GRID_SIZE) * 100 + 50,
    }));
  }, []);

  // Initialize Pattern Logic
  useEffect(() => {
    if (user) {
      const savedPattern = localStorage.getItem(`pattern_${user.uid}`);
      setPatternState(savedPattern ? 'unlock' : 'set');
    } else {
      setPatternState(null);
    }
  }, [user]);

  // Lockout Timer
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lockedUntil - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthPending || !authMode) return;
    setIsAuthPending(true);
    
    try {
      const promise = authMode === 'login' 
        ? initiateEmailSignIn(auth, email, password)
        : initiateEmailSignUp(auth, email, password);
      
      await promise;
      toast({
        title: authMode === 'login' ? "Identity Verified" : "Vault Created",
        description: "Credentials accepted. Initializing security grid.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Invalid credentials provided.",
      });
    } finally {
      setIsAuthPending(false);
    }
  };

  const handleDotStart = (index: number) => {
    if (lockedUntil || status === 'success') return;
    setIsDrawing(true);
    setCurrentPath([index]);
    setStatus('idle');
  };

  const handleDotEnter = (index: number) => {
    if (!isDrawing || currentPath.includes(index) || lockedUntil) return;
    setCurrentPath(prev => [...prev, index]);
  };

  const handleDrawingEnd = () => {
    if (!isDrawing || !user) return;
    setIsDrawing(false);

    const patternStr = currentPath.join(',');
    
    if (currentPath.length < MIN_PATTERN_LENGTH) {
      setStatus('error');
      setTimeout(() => {
        setCurrentPath([]);
        setStatus('idle');
      }, 500);
      toast({
        variant: "destructive",
        title: "Invalid Pattern",
        description: `Connect at least ${MIN_PATTERN_LENGTH} dots.`,
      });
      return;
    }

    const savedPattern = localStorage.getItem(`pattern_${user.uid}`);

    if (patternState === 'set') {
      setTempPattern(patternStr);
      setPatternState('confirm');
      setCurrentPath([]);
    } else if (patternState === 'confirm') {
      if (patternStr === tempPattern) {
        localStorage.setItem(`pattern_${user.uid}`, patternStr);
        setStatus('success');
        toast({ title: "Security Initialized", description: "Your custom access pattern has been saved." });
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        setStatus('error');
        setTimeout(() => {
          setCurrentPath([]);
          setPatternState('set');
          setTempPattern(null);
          setStatus('idle');
        }, 500);
        toast({ variant: "destructive", title: "Mismatch", description: "Pattern confirmation failed. Try again." });
      }
    } else if (patternState === 'unlock') {
      if (patternStr === savedPattern) {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        setStatus('error');
        setTimeout(() => {
          setCurrentPath([]);
          setStatus('idle');
          if (newFailCount >= 3) {
            setLockedUntil(Date.now() + LOCKOUT_DURATION);
          }
        }, 500);
      }
    }
  };

  const pathData = useMemo(() => {
    if (currentPath.length === 0) return "";
    return currentPath
      .map((dotIndex, i) => {
        const { x, y } = dotCoords[dotIndex];
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [currentPath, dotCoords]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting to secure relay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent text-foreground overflow-hidden select-none relative p-4">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="choice-portal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 w-full max-w-4xl"
          >
            {!authMode ? (
              <div className="grid md:grid-cols-2 gap-8">
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAuthMode('login')}
                  className="glass-card p-12 rounded-[3rem] text-center space-y-6 group border-white/5 hover:border-primary/40 transition-colors"
                >
                  <div className="mx-auto h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)] group-hover:scale-110 transition-transform">
                    <LogIn className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">1. Login</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Establish Neural Link</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAuthMode('signup')}
                  className="glass-card p-12 rounded-[3rem] text-center space-y-6 group border-white/5 hover:border-primary/40 transition-colors"
                >
                  <div className="mx-auto h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)] group-hover:scale-110 transition-transform">
                    <UserPlus className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">2. Signup</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Register New Identity</p>
                  </div>
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mx-auto w-full max-w-lg"
              >
                <div className="glass-card p-8 md:p-12 rounded-[3rem] space-y-10 relative border-white/5 shadow-2xl overflow-hidden">
                  <button 
                    onClick={() => setAuthMode(null)}
                    className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="text-center space-y-4 pt-4">
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                      {authMode === 'login' ? 'Operations Access' : 'New Identity'}
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                      Global Cloud Sync Active
                    </p>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2">Identity Channel / Email</Label>
                      <div className="relative group/input">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                        <Input 
                          type="email" 
                          placeholder=" operative@vault.net"
                          className="pl-14 bg-white/5 border-none h-16 rounded-2xl focus-visible:ring-primary/40 text-base font-medium transition-all hover:bg-white/10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2">Secure Key / Password</Label>
                      <div className="relative group/input">
                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          className="pl-14 bg-white/5 border-none h-16 rounded-2xl focus-visible:ring-primary/40 text-base font-medium transition-all hover:bg-white/10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isAuthPending}
                      className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isAuthPending ? <RefreshCw className="h-6 w-6 animate-spin" /> : (
                        <span className="flex items-center justify-center gap-4">
                          {authMode === 'login' ? 'Establish Connection' : 'Register Identity'} <ArrowRight className="h-5 w-5" />
                        </span>
                      )}
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="w-full text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
                    >
                      Switch to {authMode === 'login' ? 'New Registration' : 'Existing Account'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pattern-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center text-center w-full max-w-md"
          >
            <div className="mb-10 rounded-[2.5rem] bg-white/5 p-8 backdrop-blur-3xl border border-white/10 shadow-2xl">
              {patternState === 'unlock' ? (
                lockedUntil ? <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" /> : <Fingerprint className="h-16 w-16 text-primary" />
              ) : (
                <Sparkles className="h-16 w-16 text-accent" />
              )}
            </div>

            <div className="space-y-4 mb-12">
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                {lockedUntil ? 'System Lock' : 
                 patternState === 'set' ? 'Initial Grid' : 
                 patternState === 'confirm' ? 'Repeat Path' : 'Grid Access'}
              </h1>
              <p className="max-w-[340px] text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mx-auto leading-relaxed">
                {lockedUntil 
                  ? `Access restricted. Retry in ${timeLeft}s` 
                  : patternState === 'set' ? 'Draw a unique security path on the 3x3 grid.' 
                  : patternState === 'confirm' ? 'Verify your sequence for local storage.' 
                  : 'Enter biometric pattern to unlock ledger.'}
              </p>
            </div>

            <motion.div
              ref={gridRef}
              animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="relative h-[320px] w-[320px] select-none touch-none bg-black/5 dark:bg-white/5 rounded-[3rem] border border-white/5 p-0 overflow-hidden"
              onMouseLeave={handleDrawingEnd}
              onMouseUp={handleDrawingEnd}
              onTouchEnd={handleDrawingEnd}
            >
              <svg viewBox="0 0 300 300" className="absolute inset-0 z-10 h-full w-full pointer-events-none overflow-visible">
                <path
                  d={pathData}
                  fill="none"
                  stroke={status === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("transition-colors duration-200", status !== 'error' && "drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]")}
                  style={{ opacity: currentPath.length > 0 ? 0.6 : 0 }}
                />
              </svg>

              <div className="absolute inset-0 z-20 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                  const isActive = currentPath.includes(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center"
                      onMouseDown={() => handleDotStart(i)}
                      onMouseEnter={() => handleDotEnter(i)}
                      onTouchStart={(e) => { e.preventDefault(); handleDotStart(i); }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dotIndex = element?.getAttribute('data-dot-index');
                        if (dotIndex !== null && dotIndex !== undefined) handleDotEnter(parseInt(dotIndex));
                      }}
                    >
                      <motion.div
                        data-dot-index={i}
                        className={cn(
                          "relative h-10 w-10 rounded-full border-2 transition-all duration-300",
                          isActive 
                            ? status === 'error' ? "bg-destructive border-destructive shadow-[0_0_15px_rgba(var(--destructive),0.5)] scale-110" : "bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary),0.8)] scale-110"
                            : "bg-white/5 border-white/10 hover:border-primary/40",
                          lockedUntil && "opacity-10 cursor-not-allowed"
                        )}
                      >
                        {isActive && status !== 'error' && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0.8 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-primary"
                          />
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <div className="mt-12 flex flex-col gap-6">
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Terminate Session Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-12 text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground opacity-20 pointer-events-none">
        Quantum Shielding • Active Sync • v2.2
      </footer>
    </div>
  );
}
