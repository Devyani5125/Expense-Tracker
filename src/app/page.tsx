"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 3;
const DOT_COUNT = GRID_SIZE * GRID_SIZE;
const LOCKOUT_DURATION = 30000; // 30 seconds
const MIN_PATTERN_LENGTH = 4;

export default function PatternLockPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [mode, setMode] = useState<'unlock' | 'set' | 'confirm'>('unlock');
  const [storedPattern, setStoredPattern] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [tempPattern, setTempPattern] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load pattern and lockout status from storage
  useEffect(() => {
    const saved = localStorage.getItem('app_pattern');
    const lockout = localStorage.getItem('app_lockout');
    
    if (saved) {
      setStoredPattern(saved);
      setMode('unlock');
    } else {
      setMode('set');
    }

    if (lockout) {
      const expiry = parseInt(lockout);
      if (expiry > Date.now()) {
        setLockedUntil(expiry);
      }
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lockedUntil - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        localStorage.removeItem('app_lockout');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

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
    if (!isDrawing) return;
    setIsDrawing(false);

    const patternStr = currentPath.join(',');
    
    if (currentPath.length < MIN_PATTERN_LENGTH) {
      setStatus('error');
      setCurrentPath([]);
      return;
    }

    if (mode === 'set') {
      setTempPattern(patternStr);
      setMode('confirm');
      setCurrentPath([]);
    } else if (mode === 'confirm') {
      if (patternStr === tempPattern) {
        localStorage.setItem('app_pattern', patternStr);
        setStoredPattern(patternStr);
        setStatus('success');
        setTimeout(() => {
          initiateAnonymousSignIn(auth);
        }, 1000);
      } else {
        setStatus('error');
        setCurrentPath([]);
        setMode('set');
        setTempPattern(null);
      }
    } else {
      // Unlock mode
      if (patternStr === storedPattern) {
        setStatus('success');
        setTimeout(() => {
          initiateAnonymousSignIn(auth);
        }, 1000);
      } else {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);
        setStatus('error');
        setCurrentPath([]);

        if (newFailCount >= 3) {
          const expiry = Date.now() + LOCKOUT_DURATION;
          setLockedUntil(expiry);
          localStorage.setItem('app_lockout', expiry.toString());
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
          style={{
            top: `${startY}px`,
            left: `${startX}px`,
            width: `${length}px`,
            transform: `rotate(${angle}deg)`,
          }}
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
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode + (lockedUntil ? '-locked' : '')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          <div className="mb-6 rounded-3xl bg-black/5 dark:bg-white/5 p-4 backdrop-blur-xl border border-black/5 dark:border-white/10">
            {mode === 'unlock' ? (
              lockedUntil ? <ShieldCheck className="h-10 w-10 text-destructive" /> : <Lock className="h-10 w-10 text-primary" />
            ) : (
              <Sparkles className="h-10 w-10 text-accent" />
            )}
          </div>

          <h1 className="mb-2 text-3xl font-black tracking-tighter">
            {lockedUntil ? 'System Locked' : mode === 'set' ? 'Set Pattern' : mode === 'confirm' ? 'Confirm Pattern' : 'Draw to Unlock'}
          </h1>
          
          <p className="mb-12 max-w-[280px] text-sm font-medium text-muted-foreground">
            {lockedUntil 
              ? `Too many failed attempts. Try again in ${timeLeft}s` 
              : mode === 'set' ? 'Connect at least 4 dots to secure your vault.' 
              : mode === 'confirm' ? 'Redraw the pattern to verify it.' 
              : 'Secure access to your personal expense workspace.'}
          </p>

          <motion.div
            animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative h-[300px] w-[300px] select-none touch-none"
            onMouseLeave={handleEnd}
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
          >
            {/* Connection Lines */}
            <div className="absolute inset-0 z-0">
              {getLineStyles()}
            </div>

            {/* Grid Dots */}
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
              className="mt-8 flex items-center gap-2 text-destructive font-black text-xs uppercase tracking-widest"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Pattern Incorrect</span>
            </motion.div>
          )}

          {failedAttempts > 0 && !lockedUntil && mode === 'unlock' && (
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {3 - failedAttempts} Attempts Remaining
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="fixed bottom-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
        Bank-Grade Encryption Enabled
      </footer>
    </div>
  );
}