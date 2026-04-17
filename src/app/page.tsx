"use client";

import React, { useState } from 'react';
import { AppProvider, useApp, Language } from '@/lib/app-context';
import { FirebaseClientProvider } from '@/firebase';
import { Navigation, TabType } from '@/components/Navigation';
import { MusicStudio } from '@/components/MusicStudio';
import { VideoStudio } from '@/components/VideoStudio';
import { VoiceStudio } from '@/components/VoiceStudio';
import { UploadStudio } from '@/components/UploadStudio';
import { Library } from '@/components/Library';
import { PremiumGate } from '@/components/PremiumGate';
import { AuthScreen } from '@/components/AuthScreen';
import { Toaster } from '@/components/ui/toaster';
import { Sparkles, Languages, LogOut } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<TabType>('music');
  const [showPremium, setShowPremium] = useState(false);
  const { language, setLanguage, t } = useApp();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'music': return <MusicStudio onShowPremium={() => setShowPremium(true)} />;
      case 'video': return <VideoStudio onShowPremium={() => setShowPremium(true)} />;
      case 'voice': return <VoiceStudio onShowPremium={() => setShowPremium(true)} />;
      case 'upload': return <UploadStudio onShowPremium={() => setShowPremium(true)} />;
      case 'library': return <Library onShowPremium={() => setShowPremium(true)} />;
      default: return <MusicStudio onShowPremium={() => setShowPremium(true)} />;
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

          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-secondary/50 border border-white/5 flex items-center justify-center hover:bg-destructive/20 transition-all text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] -right-[30%] w-[100%] aspect-square rounded-full bg-primary/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] -left-[40%] w-[80%] aspect-square rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <main className="flex-1 pb-40">
        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {showPremium && <PremiumGate onBack={() => setShowPremium(false)} />}
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