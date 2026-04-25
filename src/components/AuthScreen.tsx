
"use client";

import React, { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useApp, UserRole } from '@/lib/app-context';
import { Sparkles, Mail, Lock, User, Music, Headphones, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthScreenProps {
  onBack?: () => void;
}

export function AuthScreen({ onBack }: AuthScreenProps) {
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
      if (onBack) onBack();
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
      if (onBack) onBack();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          externalAuthId: user.uid,
          username: user.displayName || 'Google User',
          email: user.email,
          role: 'Regular',
          freeGenerationsUsed: 0,
          isPremiumSubscriber: false,
          createdAt: new Date().toISOString()
        });
      }
      
      toast({ title: "Welcome! 👋", description: `Signed in as ${user.displayName}` });
      if (onBack) onBack();
    } catch (error: any) {
      toast({ title: "Google Login Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Dynamic BG */}
      <div className="absolute top-[-20%] -right-[30%] w-[100%] aspect-square rounded-full bg-primary/10 blur-[140px] animate-pulse" />
      <div className="absolute bottom-[10%] -left-[40%] w-[80%] aspect-square rounded-full bg-accent/10 blur-[120px]" />

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-10 right-10 p-2 text-muted-foreground hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      )}

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
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-card px-2 text-muted-foreground">Or Connect With</span></div>
          </div>

          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.79 1.94l3.48-3.48C18.11 1.49 15.24.5 12 .5 7.42.5 3.51 3.12 1.51 6.94l4.08 3.17c.96-2.88 3.66-5.07 6.41-5.07z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.86 3c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#FBBC05" d="M5.59 14.71c-.24-.72-.37-1.5-.37-2.31s.13-1.59.37-2.31L1.51 6.94C.54 8.88 0 11.06 0 13.31c0 2.25.54 4.43 1.51 6.37l4.08-3.17c-.24-.72-.37-1.5-.37-2.31z" />
              <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.86-3c-1.08.72-2.47 1.15-4.1 1.15-3.15 0-5.81-2.13-6.77-5.01l-4.08 3.17C3.51 20.88 7.42 23.5 12 23.5z" />
            </svg>
            Sign in with Google
          </Button>

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
