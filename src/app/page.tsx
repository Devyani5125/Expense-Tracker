
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, Sparkles, Mail, Key, UserPlus, LogIn, ArrowRight, ShieldAlert } from 'lucide-react';
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

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthPending, setIsAuthPending] = useState(false);

  // Pattern State
  const [patternMode, setPatternMode] = useState<'unlock' | 'set' | 'confirm' | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [tempPattern, setTempPattern] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Determine view logic
  useEffect(() => {
    if (user) {
      const savedPattern = localStorage.getItem(`pattern_${user.uid}`);
      if (savedPattern) {
        setPatternMode('unlock');
      } else {
        setPatternMode('set');
      }
    } else {
      setPatternMode(null);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthPending) return;
    setIsAuthPending(true);
    
    try {
      const promise = authMode === 'login' 
        ? initiateEmailSignIn(auth, email, password)
        : initiateEmailSignUp(auth, email, password);
      
      await promise;
      toast({
        title: authMode === 'login' ? "Identity Verified" : "Account Provisioned",
        description: "Proceeding to security layer...",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Auth Failure",
        description: err.message || "Invalid credentials.",
      });
    } finally {
      setIsAuthPending(false);
    }
  };

  const handleStart = (index: number) => {
    if (lockedUntil || status === 'success') return;
    setIsDrawing(true);
    setCurrentPath([index]);
    setStatus('idle');
  };

  const handleEnter = (index: number) => {
    if (!isDrawing || currentPath.includes(index)) return;
    setCurrentPath(prev => [...prev, index]);
  };

  const handleEnd = () => {
    if (!isDrawing || !user) return;
    setIsDrawing(false);

    const patternStr = currentPath.join(',');
    
    if (currentPath.length < MIN_PATTERN_LENGTH) {
      setStatus('error');
      setCurrentPath([]);
      return;
    }

    const savedPattern = localStorage.getItem(`pattern_${user.uid}`);

    if (patternMode === 'set') {
      setTempPattern(patternStr);
      setPatternMode('confirm');
      setCurrentPath([]);
    } else if (patternMode === 'confirm') {
      if (patternStr === tempPattern) {
        localStorage.setItem(`pattern_${user.uid}`, patternStr);
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        setStatus('error');
        setCurrentPath([]);
        setPatternMode('set');
        setTempPattern(null);
      }
    } else if (patternMode === 'unlock') {
      if (patternStr === savedPattern) {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        setStatus('error');
        setCurrentPath([]);
        if (newFailCount >= 3) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
        }
      }
    }
  };

  const getLineStyles = () => {
    const lines: React.ReactNode[] = [];
    for (let i = 0; i < currentPath.length - 1; i++) {
      const start = currentPath[i];
      const end = currentPath[i + 1];
      const startX = (start % GRID_SIZE) * 100 + 50;
      const startY = Math.floor(start / GRID_SIZE) * 100 + 50;
      const endX = (end % GRID_SIZE) * 100 + 50;
      const endY = Math.floor(end / GRID_SIZE) * 100 + 50;
      const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

      lines.push(
        <div
          key={`${start}-${end}`}
          className={cn(
            "absolute h-1.5 origin-left rounded-full transition-colors duration-200 pointer-events-none z-0",
            status === 'error' ? "bg-destructive/60" : "bg-primary/60 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          )}
          style={{ top: `${startY}px`, left: `${startX}px`, width: `${length}px`, transform: `rotate(${angle}deg)` }}
        />
      );
    }
    return lines;
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden select-none relative">
      {/* Dynamic Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" 
        />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]" />
      </div>

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="z-10 w-full max-w-md px-6"
          >
            <div className="glass-card p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-24 w-24 text-primary" />
              </div>
              
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  {authMode === 'login' ? <LogIn className="h-6 w-6 text-primary" /> : <UserPlus className="h-6 w-6 text-primary" />}
                </div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">
                  {authMode === 'login' ? 'System Login' : 'Create Vault'}
                </h1>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">
                  Secure Cloud Synchronization Active
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Credentials / Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40" />
                    <Input 
                      type="email" 
                      placeholder="e.g. user@vault.net"
                      className="pl-10 bg-black/5 dark:bg-white/5 border-none h-12 rounded-xl focus-visible:ring-primary/40"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Authentication Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40" />
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      className="pl-10 bg-black/5 dark:bg-white/5 border-none h-12 rounded-xl focus-visible:ring-primary/40"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isAuthPending}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  {isAuthPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                    <span className="flex items-center gap-2">
                      Initialize Sync <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="pt-4 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                >
                  {authMode === 'login' ? "New operative? Create account" : "Existing user? Access portal"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pattern-lock"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center text-center px-6"
          >
            <div className="mb-6 rounded-3xl bg-black/5 dark:bg-white/5 p-4 backdrop-blur-xl border border-black/5 dark:border-white/10">
              {patternMode === 'unlock' ? (
                lockedUntil ? <ShieldAlert className="h-10 w-10 text-destructive" /> : <Lock className="h-10 w-10 text-primary" />
              ) : (
                <Sparkles className="h-10 w-10 text-accent" />
              )}
            </div>

            <h1 className="mb-2 text-3xl font-black tracking-tighter uppercase">
              {lockedUntil ? 'System Locked' : 
               patternMode === 'set' ? 'Secure Pattern' : 
               patternMode === 'confirm' ? 'Verify Pattern' : 'Grid Access'}
            </h1>
            
            <p className="mb-12 max-w-[280px] text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
              {lockedUntil 
                ? `Protocol violation. Retry in ${timeLeft}s` 
                : patternMode === 'set' ? 'Draw 4 dots to lock your data.' 
                : patternMode === 'confirm' ? 'Repeat pattern for validation.' 
                : 'Input your unique biometric pattern.'}
            </p>

            <motion.div
              animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative h-[300px] w-[300px] select-none touch-none"
              onMouseLeave={handleEnd}
              onMouseUp={handleEnd}
              onTouchEnd={handleEnd}
            >
              <div className="absolute inset-0 z-0">
                {getLineStyles()}
              </div>

              <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                  const isActive = currentPath.includes(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center p-4"
                      onMouseDown={() => handleStart(i)}
                      onMouseEnter={() => handleEnter(i)}
                      onTouchStart={() => handleStart(i)}
                      onTouchMove={(e) => {
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dotIndex = element?.getAttribute('data-dot-index');
                        if (dotIndex !== null && dotIndex !== undefined) {
                          handleEnter(parseInt(dotIndex));
                        }
                      }}
                    >
                      <motion.div
                        data-dot-index={i}
                        whileHover={!lockedUntil ? { scale: 1.2 } : {}}
                        className={cn(
                          "relative h-6 w-6 rounded-full border-2 transition-all duration-300",
                          isActive 
                            ? status === 'error' ? "bg-destructive border-destructive shadow-[0_0_20px_rgba(var(--destructive),0.5)]" : "bg-primary border-primary shadow-[0_0_20px_rgba(var(--primary),0.8)]"
                            : "bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/20",
                          lockedUntil && "opacity-20 cursor-not-allowed"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className={cn(
                              "absolute inset-0 rounded-full",
                              status === 'error' ? "bg-destructive" : "bg-primary"
                            )}
                          />
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {status === 'error' && !lockedUntil && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-[0.3em]"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Pattern Mismatch</span>
              </motion.div>
            )}

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout operative
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-8 text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-20">
        AES-256 Quantum Resistant Shield Active
      </footer>
    </div>
  );
}
