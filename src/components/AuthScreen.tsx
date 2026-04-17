"use client";

import React, { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useApp, UserRole } from '@/lib/app-context';
import { Sparkles, Mail, Lock, User, Music, Headphones } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AuthScreen() {
  const auth = useAuth();
  const db = useFirestore();
  const { t } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('Regular');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: username });
        
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          externalAuthId: user.uid,
          username,
          email,
          role,
          freeGenerationsUsed: 0,
          isPremiumSubscriber: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      toast({ title: "Auth Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Dynamic BG */}
      <div className="absolute top-[-20%] -right-[30%] w-[100%] aspect-square rounded-full bg-primary/10 blur-[140px] animate-pulse" />
      <div className="absolute bottom-[10%] -left-[40%] w-[80%] aspect-square rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm space-y-8 text-center">
        <div className="inline-block p-4 rounded-3xl premium-gradient glow-purple rotate-3 mb-4">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <header className="space-y-2">
          <h1 className="font-headline text-4xl font-black tracking-tighter text-glow-purple">HIBO HUB</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">The Future of Somali Music</p>
        </header>

        <Card className="glass-card p-8 border-white/5 space-y-6">
          <div className="flex bg-secondary/50 rounded-xl p-1 mb-4">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", isLogin ? "bg-primary text-white shadow-lg" : "text-muted-foreground")}
            >
              {t('login')}
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", !isLogin ? "bg-primary text-white shadow-lg" : "text-muted-foreground")}
            >
              {t('signup')}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Username" 
                    className="pl-12 bg-background/50 border-white/5 rounded-xl h-12"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-left px-1">
                    {t('choose_role')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <RoleButton 
                      active={role === 'Artist'} 
                      onClick={() => setRole('Artist')} 
                      icon={Music} 
                      label={t('artist')} 
                    />
                    <RoleButton 
                      active={role === 'MusicDesigner'} 
                      onClick={() => setRole('MusicDesigner')} 
                      icon={Headphones} 
                      label="Designer" 
                    />
                    <RoleButton 
                      active={role === 'Regular'} 
                      onClick={() => setRole('Regular')} 
                      icon={User} 
                      label={t('regular_user').split(' ')[0]} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="email" 
                placeholder="Email" 
                className="pl-12 bg-background/50 border-white/5 rounded-xl h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="password" 
                placeholder="Password" 
                className="pl-12 bg-background/50 border-white/5 rounded-xl h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-2xl premium-gradient glow-purple font-bold text-lg shadow-xl"
            >
              {isLoading ? "..." : (isLogin ? t('login') : t('signup'))}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>

          <button 
            onClick={handleGuest}
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            Continue as Guest
          </button>
        </Card>
      </div>
    </div>
  );
}

function RoleButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
        active ? "border-primary bg-primary/10 text-primary glow-purple" : "border-white/5 text-muted-foreground hover:border-white/10"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase truncate w-full">{label}</span>
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}