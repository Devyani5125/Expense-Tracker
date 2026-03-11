
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
  Trophy
} from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#ai" className="text-sm font-medium hover:text-primary transition-colors">AI Advisor</a>
            <a href="#security" className="text-sm font-medium hover:text-primary transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setIsAuthOpen(true)} className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button onClick={() => setIsAuthOpen(true)} className="rounded-full shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-sm font-bold text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Powered by Gemini AI</span>
                </div>
                <h1 className="text-5xl font-black leading-tight tracking-tighter md:text-7xl">
                  Finance Management <span className="text-primary">Perfected.</span>
                </h1>
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                  Track every penny, set smart budgets, and get actionable financial advice from your own AI-powered personal advisor.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Button size="lg" onClick={() => setIsAuthOpen(true)} className="h-14 rounded-full px-8 text-lg font-bold">
                    Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 rounded-full px-8 text-lg font-bold">
                    Watch Demo
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                      </div>
                    ))}
                  </div>
                  <span>Trusted by over 10,000+ disciplined savers</span>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-accent/20 blur-2xl" />
                <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
                  <Image 
                    src={heroImage?.url || ''} 
                    alt={heroImage?.alt || 'Dashboard'} 
                    width={heroImage?.width || 1200}
                    height={heroImage?.height || 800}
                    className="w-full object-cover"
                    priority
                    data-ai-hint={heroImage?.hint}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/30 py-24">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-black md:text-5xl tracking-tighter">Everything you need to <span className="text-primary">grow.</span></h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Stop guessing where your money goes. Use precision tools designed for the modern age.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Smart Tracking",
                  desc: "Instantly record transactions with beautiful categorization and easy filtering.",
                  icon: BarChart3,
                  color: "bg-blue-500/10 text-blue-600"
                },
                {
                  title: "Budget Alerts",
                  desc: "Get notified before you overspend. Our smart alerts keep your goals in sight.",
                  icon: Zap,
                  color: "bg-orange-500/10 text-orange-600"
                },
                {
                  title: "Goal Achievements",
                  desc: "Earn badges for discipline. Stay motivated with visual rewards for your hard work.",
                  icon: Trophy,
                  color: "bg-yellow-500/10 text-yellow-600"
                }
              ].map((feat, i) => (
                <Card key={i} className="border-none shadow-xl hover:-translate-y-2 transition-transform duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                      <feat.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">{feat.title}</CardTitle>
                    <CardDescription className="text-base">{feat.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Insight Section */}
        <section id="ai" className="py-24 overflow-hidden">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                  <BrainCircuit className="h-4 w-4" /> AI Advisor
                </div>
                <h2 className="text-4xl font-black md:text-6xl tracking-tighter leading-none">
                  Your Personal <span className="italic">Financial</span> Genius.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our Smart Financial Q&A uses Google's Gemini AI to analyze your spending history. Ask complex questions and get simple, actionable answers to improve your wealth.
                </p>
                <div className="space-y-4">
                  {[
                    "Where can I save 10% this month?",
                    "Analyze my dining habits",
                    "How to stay under my ₹50,000 budget?"
                  ].map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer group">
                       <Sparkles className="h-4 w-4 text-primary group-hover:scale-125 transition-transform" />
                       <span className="text-sm font-medium">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative rounded-2xl border bg-background p-4 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                   <div className="flex items-center justify-between mb-4 pb-2 border-b">
                     <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Output Preview</span>
                     <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                     </div>
                   </div>
                   <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/50 text-xs">"How can I save more?"</div>
                      <div className="p-4 rounded-lg bg-primary/10 border-l-4 border-primary text-sm italic font-medium">
                        "Based on your trends, you spent 25% more on Travel this month. Reducing dining out by just twice a week could save you ₹4,500..."
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="rounded-[3rem] bg-primary p-12 lg:p-24 text-center text-primary-foreground relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white blur-3xl translate-y-1/2 -translate-x-1/2" />
               </div>
               <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Ready to take control?</h2>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
                  Join thousands of users making better financial decisions every single day.
                </p>
                <Button size="lg" variant="secondary" onClick={() => setIsAuthOpen(true)} className="h-16 rounded-full px-12 text-xl font-black uppercase tracking-tight shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  Get Started Now
                </Button>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
           <Logo />
           <p className="text-sm text-muted-foreground">© 2024 ExpenseWise Inc. All rights reserved.</p>
           <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a>
           </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Welcome Back</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Join our community of smart spenders.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Button type="submit" className="w-full h-12 text-lg font-bold">
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Button type="submit" className="w-full h-12 text-lg font-bold">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue as</span>
                </div>
              </div>
              <Button variant="outline" className="w-full h-12 font-bold" onClick={handleAnonymousSignIn}>
                Guest User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
