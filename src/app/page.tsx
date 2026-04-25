
"use client";

import React, { useState } from 'react';
import { AppProvider, useApp, Language } from '@/lib/app-context';
import { FirebaseClientProvider } from '@/firebase';
import { Navigation, TabType } from '@/components/Navigation';
import { AiStudio } from '@/components/AiStudio';
import { Explore } from '@/components/Explore';
import { Library } from '@/components/Library';
import { Profile } from '@/components/Profile';
import { AuthScreen } from '@/components/AuthScreen';
import { PremiumGate } from '@/components/PremiumGate';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { Sparkles, Languages, LogOut, User as UserIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

function Sticker({ icon: Icon, className, delay = '0s' }: { icon: any, className: string, delay?: string }) {
  return (
    <div className={cn("absolute pointer-events-none sticker-float", className)} style={{ animationDelay: delay }}>
      <Icon className="w-full h-full opacity-20 text-primary" />
    </div>
  );
}

function AppContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showPremium, setShowPremium] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [remixData, setRemixData] = useState<any | null>(null);
  const { language, setLanguage, t } = useApp();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleRequireAuth = () => {
    if (!user) {
      setShowAuth(true);
      return true;
    }
    return false;
  };

  const handleRemix = (data: any) => {
    setRemixData(data);
    setActiveTab('create');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create': return <AiStudio onShowPremium={() => setShowPremium(true)} onRequireAuth={handleRequireAuth} initialData={remixData} />;
      case 'explore': return <Explore onShowPremium={() => setShowPremium(true)} onRequireAuth={handleRequireAuth} onRemix={handleRemix} />;
      case 'library': return <Library onShowPremium={() => setShowPremium(true)} onRequireAuth={handleRequireAuth} onRemix={handleRemix} />;
      case 'settings': return <Profile onRemix={handleRemix} />;
      default: return <AiStudio onShowPremium={() => setShowPremium(true)} onRequireAuth={handleRequireAuth} />;
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative px-6 pt-10">
      {/* Gen-Z Stickers */}
      <Sticker icon={Sparkles} className="top-[15%] left-[5%] w-8 h-8" delay="0s" />
      <Sticker icon={Sparkles} className="top-[40%] right-[10%] w-6 h-6" delay="1s" />
      <Sticker icon={Sparkles} className="bottom-[20%] left-[15%] w-10 h-10" delay="2s" />

      {/* Header */}
      {activeTab !== 'explore' && (
        <div className="flex items-center justify-between mb-10 relative z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center glow-purple rotate-3 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter">HIBO HUB</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-secondary/50 border border-white/5 flex items-center justify-center hover:bg-secondary transition-all">
                  <Languages className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/10 p-2 min-w-[140px]">
                <DropdownMenuItem onClick={() => setLanguage('so')} className="rounded-lg mb-1 focus:bg-primary/20">
                  🇸🇴 Soomaali
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('ar')} className="rounded-lg mb-1 focus:bg-primary/20">
                  🇸🇦 العربية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-lg focus:bg-primary/20">
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-secondary/50 border border-white/5 flex items-center justify-center hover:bg-destructive/20 transition-all text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center hover:bg-primary/40 transition-all text-primary"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] -right-[30%] w-[100%] aspect-square rounded-full bg-primary/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] -left-[40%] w-[80%] aspect-square rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <main className="flex-1 pb-8">
        {renderContent()}
        <Footer />
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {showPremium && <PremiumGate onBack={() => setShowPremium(false)} />}
      {showAuth && !user && <AuthScreen onBack={() => setShowAuth(false)} />}
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <FirebaseClientProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </FirebaseClientProvider>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
