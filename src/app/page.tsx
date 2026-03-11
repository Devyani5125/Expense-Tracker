
"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateAnonymousSignIn,
} from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import placeholderData from '@/lib/placeholder-images.json';
import { 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  PieChart,
  Trophy,
  MousePointer2,
  Lock,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignUp(auth, email, password);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignIn(auth, email, password);
  };
  
  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'hero-dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Background Radiant Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] animate-bounce duration-[10000ms]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Features</a>
            <a href="#ai" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">AI Advisor</a>
            <a href="#security" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setIsAuthOpen(true)} className="hidden sm:inline-flex font-bold">
              Sign In
            </Button>
            <Button onClick={() => setIsAuthOpen(true)} className="rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6">
              GET STARTED
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-left-10 duration-1000">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>The Future of Finance is Here</span>
                </div>
                <h1 className="text-6xl font-black leading-[0.95] tracking-tighter md:text-8xl lg:text-9xl">
                  Track <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Money</span> with AI.
                </h1>
                <p className="max-w-[550px] text-lg text-muted-foreground md:text-xl font-medium leading-relaxed">
                  Stop guessing. Start growing. ExpenseWise uses Gemini AI to turn your raw spending into a powerful roadmap for wealth.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <Button size="lg" onClick={() => setIsAuthOpen(true)} className="h-16 rounded-full px-10 text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    START TRACKING <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleAnonymousSignIn} className="h-16 rounded-full px-10 text-xl font-black hover:bg-muted/50 backdrop-blur-sm">
                    VIEW DEMO
                  </Button>
                </div>
                
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-4 border-background bg-muted overflow-hidden ring-2 ring-primary/20">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black">12k+ Users</span>
                    <span className="text-xs text-muted-foreground font-bold">Trusted globally</span>
                  </div>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
                <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-tr from-primary/30 to-accent/30 blur-[80px] opacity-50" />
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative rounded-2xl border bg-card/50 backdrop-blur-md shadow-2xl overflow-hidden">
                    <Image 
                      src={heroImage?.url || ''} 
                      alt={heroImage?.alt || 'Dashboard'} 
                      width={heroImage?.width || 1200}
                      height={heroImage?.height || 800}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                      data-ai-hint={heroImage?.hint}
                    />
                    
                    {/* Floating Overlay Element */}
                    <div className="absolute bottom-6 left-6 p-4 bg-background/80 backdrop-blur-xl rounded-xl border shadow-2xl animate-in slide-in-from-bottom-5 duration-1000 delay-700">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                             <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Savings increased</p>
                             <p className="text-lg font-black text-green-500">+24.5%</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
            <div className="text-center space-y-4 mb-20">
              <h2 className="text-4xl font-black md:text-7xl tracking-tighter leading-tight">
                Financial <span className="italic text-primary">Superpowers</span>
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
                We've built a suite of tools that work together to give you total control over your money.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  title: "Instant Insights",
                  desc: "Record your transactions in seconds. Our smart categorization handles the boring work.",
                  icon: Zap,
                  color: "from-blue-500/20 to-blue-500/5 text-blue-500",
                  glow: "shadow-blue-500/10"
                },
                {
                  title: "AI Budgeting",
                  desc: "Set limits that actually work. Our AI predicts your spend patterns to warn you early.",
                  icon: BrainCircuit,
                  color: "from-purple-500/20 to-purple-500/5 text-purple-500",
                  glow: "shadow-purple-500/10"
                },
                {
                  title: "Secure Growth",
                  desc: "Your data is yours. We use bank-grade encryption to keep your financial life private.",
                  icon: Lock,
                  color: "from-pink-500/20 to-pink-500/5 text-pink-500",
                  glow: "shadow-pink-500/10"
                }
              ].map((feat, i) => (
                <Card key={i} className={cn(
                  "border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl hover:-translate-y-3 transition-all duration-500 group overflow-hidden",
                  feat.glow
                )}>
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", feat.color)} />
                  <CardHeader className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-background/50 border flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <feat.icon className={cn("h-8 w-8", feat.text)} />
                    </div>
                    <CardTitle className="text-2xl font-black">{feat.title}</CardTitle>
                    <CardDescription className="text-base font-medium leading-relaxed">{feat.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Radiant CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="relative rounded-[4rem] overflow-hidden bg-primary p-12 md:p-24 text-center">
               {/* Animated Background for CTA */}
               <div className="absolute inset-0 z-0">
                  <div className="absolute top-0 right-0 w-[40%] h-full bg-accent mix-blend-overlay blur-[100px] animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-[40%] h-full bg-white/20 mix-blend-overlay blur-[100px]" />
               </div>
               
               <div className="relative z-10 space-y-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                  Limited Time Access
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
                  Take Command <br /> of Your Wealth.
                </h2>
                <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-medium">
                  Join 12,000+ disciplined users who are building a better financial future today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Button size="lg" variant="secondary" onClick={() => setIsAuthOpen(true)} className="h-20 rounded-full px-16 text-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                    GET STARTED NOW
                  </Button>
                  <Button size="lg" variant="outline" className="h-20 rounded-full px-16 text-2xl font-black text-white border-white hover:bg-white hover:text-primary transition-all">
                    TALK TO SALES
                  </Button>
                </div>
                
                <div className="pt-8 flex flex-wrap justify-center gap-12 opacity-50 grayscale invert brightness-0">
                   {/* Mock Logos */}
                   <div className="flex items-center gap-2 font-black italic text-2xl"><Globe className="h-6 w-6" /> GLOBAL</div>
                   <div className="flex items-center gap-2 font-black italic text-2xl"><Zap className="h-6 w-6" /> FAST</div>
                   <div className="flex items-center gap-2 font-black italic text-2xl"><ShieldCheck className="h-6 w-6" /> TRUST</div>
                </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/30 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-6">
              <Logo />
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Empowering the next generation to build wealth through AI and disciplined tracking.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "AI Advisor", "Pricing", "Security"] },
              { title: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] }
            ].map((col, i) => (
              <div key={i} className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
             <p className="text-xs text-muted-foreground font-bold">© 2024 ExpenseWise Inc. Crafted with passion.</p>
             <div className="flex gap-8">
                <a href="#" className="text-muted-foreground hover:text-primary transition-all"><Globe className="h-5 w-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-all font-black text-xs uppercase tracking-widest">Twitter</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-all font-black text-xs uppercase tracking-widest">LinkedIn</a>
             </div>
          </div>
        </div>
      </footer>

      {/* Auth Dialog - Redesigned for Radiant Theme */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-3xl bg-background/80 backdrop-blur-2xl">
          <div className="bg-gradient-to-br from-primary to-accent p-10 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-4xl font-black tracking-tighter mb-2">Join the Elite.</DialogTitle>
              <DialogDescription className="text-primary-foreground/90 font-medium text-lg">
                Start your journey to financial freedom today.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50 p-1">
                <TabsTrigger value="signin" className="font-black uppercase tracking-widest">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-black uppercase tracking-widest">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-muted/30 border-none font-bold text-lg px-6"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-muted/30 border-none font-bold text-lg px-6"
                  />
                  <Button type="submit" className="w-full h-14 text-xl font-black uppercase tracking-widest shadow-xl">
                    SIGN IN
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="space-y-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-muted/30 border-none font-bold text-lg px-6"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-muted/30 border-none font-bold text-lg px-6"
                  />
                  <Button type="submit" className="w-full h-14 text-xl font-black uppercase tracking-widest shadow-xl bg-accent hover:bg-accent/90">
                    CREATE ACCOUNT
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-10">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs font-black uppercase tracking-widest">
                  <span className="bg-background px-4 text-muted-foreground">Quick Access</span>
                </div>
              </div>
              <Button variant="outline" className="w-full h-14 font-black uppercase tracking-[0.2em] border-primary/20 hover:bg-primary/5 transition-all" onClick={handleAnonymousSignIn}>
                Continue as Guest
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
