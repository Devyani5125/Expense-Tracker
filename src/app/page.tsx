
"use client";

import React, { useState, useEffect } from 'react';
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

  // Auth Mode State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthPending, setIsAuthPending] = useState(false);

  // Pattern Lock State
  const [patternState, setPatternState] = useState<'unlock' | 'set' | 'confirm' | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [tempPattern, setTempPattern] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Initialize Pattern Logic based on Auth State
  useEffect(() => {
    if (user) {
      const savedPattern = localStorage.getItem(`pattern_${user.uid}`);
      if (savedPattern) {
        setPatternState('unlock');
      } else {
        setPatternState('set');
      }
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
    if (!isDrawing || currentPath.includes(index)) return;
    setCurrentPath(prev => [...prev, index]);
  };

  const handleDrawingEnd = () => {
    if (!isDrawing || !user) return;
    setIsDrawing(false);

    const patternStr = currentPath.join(',');
    
    if (currentPath.length < MIN_PATTERN_LENGTH) {
      setStatus('error');
      setCurrentPath([]);
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
        setCurrentPath([]);
        setPatternState('set');
        setTempPattern(null);
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
        setCurrentPath([]);
        if (newFailCount >= 3) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
        }
      }
    }
  };

  const renderPatternLines = () => {
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
            status === 'error' ? "bg-destructive/60" : "bg-primary/60 shadow-[0_0_15px_rgba(var(--primary),0.6)]"
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
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting to secure relay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden select-none relative">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]" />
      </div>

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -30 }}
            className="z-10 w-full max-w-md px-6"
          >
            <div className="glass-card p-10 rounded-[3rem] space-y-10 relative border-white/5 shadow-2xl overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                <ShieldCheck className="h-48 w-48 text-primary" />
              </div>
              
              <div className="text-center space-y-3 relative z-10">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                  {authMode === 'login' ? <LogIn className="h-8 w-8 text-primary" /> : <UserPlus className="h-8 w-8 text-primary" />}
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {authMode === 'login' ? 'Portal Login' : 'Create Access'}
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                  Global Cloud Synchronization Enabled
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-1">Identity / Email</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      type="email" 
                      placeholder="e.g. operative@vault.net"
                      className="pl-12 bg-white/5 border-none h-14 rounded-2xl focus-visible:ring-primary/40 text-sm font-medium transition-all hover:bg-white/10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ml-1">Secure Key / Password</Label>
                  <div className="relative group/input">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      className="pl-12 bg-white/5 border-none h-14 rounded-2xl focus-visible:ring-primary/40 text-sm font-medium transition-all hover:bg-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isAuthPending}
                  className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 active:scale-[0.97] transition-all bg-primary hover:bg-primary/90"
                >
                  {isAuthPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                    <span className="flex items-center gap-3">
                      Initialize Link <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="pt-6 text-center relative z-10 border-t border-white/5">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/70 transition-colors"
                >
                  {authMode === 'login' ? "New operative? Provision account" : "Existing keyholder? Access portal"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pattern-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="z-10 flex flex-col items-center text-center px-6 w-full max-w-sm"
          >
            <div className="mb-8 rounded-[2rem] bg-white/5 p-6 backdrop-blur-3xl border border-white/10 shadow-2xl relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {patternState === 'unlock' ? (
                lockedUntil ? <ShieldAlert className="h-12 w-12 text-destructive animate-pulse" /> : <Fingerprint className="h-12 w-12 text-primary" />
              ) : (
                <Sparkles className="h-12 w-12 text-accent" />
              )}
            </div>

            <div className="space-y-2 mb-12">
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                {lockedUntil ? 'System Lock' : 
                 patternState === 'set' ? 'New Pattern' : 
                 patternState === 'confirm' ? 'Repeat Grid' : 'Biometric Access'}
              </h1>
              
              <p className="max-w-[300px] text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mx-auto leading-relaxed">
                {lockedUntil 
                  ? `Access restricted. Retry in ${timeLeft}s` 
                  : patternState === 'set' ? 'Draw a unique 4-dot pattern to lock your data.' 
                  : patternState === 'confirm' ? 'Verify your security pattern for registration.' 
                  : 'Enter your biometric sequence to bypass the relay.'}
              </p>
            </div>

            <motion.div
              animate={status === 'error' ? { x: [-12, 12, -12, 12, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative h-[300px] w-[300px] select-none touch-none bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-white/5 p-4"
              onMouseLeave={handleDrawingEnd}
              onMouseUp={handleDrawingEnd}
              onTouchEnd={handleDrawingEnd}
            >
              <div className="absolute inset-0 z-0">
                {renderPatternLines()}
              </div>

              <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                  const isActive = currentPath.includes(i);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center"
                      onMouseDown={() => handleDotStart(i)}
                      onMouseEnter={() => handleDotEnter(i)}
                      onTouchStart={() => handleDotStart(i)}
                      onTouchMove={(e) => {
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
                        whileHover={!lockedUntil ? { scale: 1.3 } : {}}
                        className={cn(
                          "relative h-8 w-8 rounded-full border-2 transition-all duration-500",
                          isActive 
                            ? status === 'error' ? "bg-destructive border-destructive shadow-[0_0_20px_rgba(var(--destructive),0.5)]" : "bg-primary border-primary shadow-[0_0_25px_rgba(var(--primary),0.8)]"
                            : "bg-white/5 border-white/10 hover:border-primary/40",
                          lockedUntil && "opacity-10 cursor-not-allowed"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 0.8, repeat: Infinity }}
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

            <div className="mt-12 flex flex-col gap-4">
              {patternState === 'unlock' && (
                <button 
                  onClick={() => setPatternState('set')}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 hover:text-primary transition-colors"
                >
                  Reset security pattern?
                </button>
              )}
              <button 
                onClick={() => auth.signOut()}
                className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out of relay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-10 text-[8px] font-black uppercase tracking-[0.6em] text-muted-foreground opacity-20">
        Quantum Shielding • v2.0-stable
      </footer>
    </div>
  );
}
