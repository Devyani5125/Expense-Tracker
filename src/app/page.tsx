
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, Sparkles, Mail, Key, UserPlus, LogIn, ArrowRight, ShieldAlert, Fingerprint } from 'lucide-react';
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
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

  // Memoized Dot Coordinates for SVG rendering
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
    if (isAuthPending) return;
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

  // Build SVG Path string for efficient rendering
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
            key="auth-view"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -30 }}
            className="z-10 w-full max-w-lg"
          >
            <div className="glass-card p-8 md:p-12 rounded-[3rem] space-y-10 relative border-white/5 shadow-2xl overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                <ShieldCheck className="h-64 w-64 text-primary" />
              </div>
              
              <div className="text-center space-y-4 relative z-10">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
                  {authMode === 'login' ? <LogIn className="h-10 w-10 text-primary" /> : <UserPlus className="h-10 w-10 text-primary" />}
                </div>
                
                <div className="flex p-1.5 bg-white/5 dark:bg-black/20 rounded-2xl mb-8 border border-white/5">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      authMode === 'login' ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                    )}
                  >
                    1. Login
                  </button>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      authMode === 'signup' ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                    )}
                  >
                    2. Signup
                  </button>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                  {authMode === 'login' ? 'Operations Access' : 'New Identity'}
                </h1>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">
                  Global Cloud Synchronization Enabled
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-2">Identity Channel / Email</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      type="email" 
                      placeholder="e.g. operative@vault.net"
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
                    <span className="flex items-center gap-4">
                      {authMode === 'login' ? 'Establish Connection' : 'Register Identity'} <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pattern-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="z-10 flex flex-col items-center text-center w-full max-w-md"
          >
            <div className="mb-10 rounded-[2.5rem] bg-white/5 p-8 backdrop-blur-3xl border border-white/10 shadow-2xl relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {patternState === 'unlock' ? (
                lockedUntil ? <ShieldAlert className="h-16 w-16 text-destructive animate-pulse" /> : <Fingerprint className="h-16 w-16 text-primary" />
              ) : (
                <Sparkles className="h-16 w-16 text-accent" />
              )}
            </div>

            <div className="space-y-4 mb-12">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                {lockedUntil ? 'System Lock' : 
                 patternState === 'set' ? 'Initial Grid' : 
                 patternState === 'confirm' ? 'Repeat Path' : 'Grid Access'}
              </h1>
              
              <p className="max-w-[340px] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-40 mx-auto leading-relaxed">
                {lockedUntil 
                  ? `Access restricted. Retry in ${timeLeft}s` 
                  : patternState === 'set' ? 'Draw a unique security path on the 3x3 grid.' 
                  : patternState === 'confirm' ? 'Verify your sequence for secure local storage.' 
                  : 'Enter your biometric pattern to unlock the ledger.'}
              </p>
            </div>

            <motion.div
              ref={gridRef}
              animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative h-[320px] w-[320px] md:h-[380px] md:w-[380px] select-none touch-none bg-black/5 dark:bg-white/5 rounded-[3rem] border border-white/5 p-6"
              onMouseLeave={handleDrawingEnd}
              onMouseUp={handleDrawingEnd}
              onTouchEnd={handleDrawingEnd}
            >
              {/* High Performance SVG Path Rendering */}
              <svg className="absolute inset-0 z-0 h-full w-full pointer-events-none overflow-visible">
                <path
                  d={pathData}
                  fill="none"
                  stroke={status === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "transition-colors duration-200",
                    status !== 'error' && "drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]"
                  )}
                  style={{ opacity: currentPath.length > 0 ? 0.6 : 0 }}
                />
              </svg>

              <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                  const isActive = currentPath.includes(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center"
                      onMouseDown={() => handleDotStart(i)}
                      onMouseEnter={() => handleDotEnter(i)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleDotStart(i);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dotIndex = element?.getAttribute('data-dot-index');
                        if (dotIndex !== null && dotIndex !== undefined) {
                          handleDotEnter(parseInt(dotIndex));
                        }
                      }}
                    >
                      <motion.div
                        data-dot-index={i}
                        whileHover={!lockedUntil ? { scale: 1.2 } : {}}
                        className={cn(
                          "relative h-10 w-10 md:h-12 md:w-12 rounded-full border-2 transition-all duration-300 will-change-transform",
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
              {patternState === 'unlock' && (
                <button 
                  onClick={() => {
                    localStorage.removeItem(`pattern_${user.uid}`);
                    setPatternState('set');
                    setCurrentPath([]);
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 hover:text-primary transition-colors"
                >
                  Reset security pattern?
                </button>
              )}
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
        Quantum Shielding • Active Sync • v2.1
      </footer>
    </div>
  );
}
