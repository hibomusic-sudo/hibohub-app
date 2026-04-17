
"use client";

import React, { useState } from 'react';
import { AppProvider, useApp, Language } from '@/lib/app-context';
import { Navigation, TabType } from '@/components/Navigation';
import { MusicStudio } from '@/components/MusicStudio';
import { VideoStudio } from '@/components/VideoStudio';
import { VoiceStudio } from '@/components/VoiceStudio';
import { Library } from '@/components/Library';
import { PremiumGate } from '@/components/PremiumGate';
import { Toaster } from '@/components/ui/toaster';
import { Sparkles, Languages, Globe } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('music');
  const [showPremium, setShowPremium] = useState(false);
  const { language, setLanguage, t } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'music': return <MusicStudio onShowPremium={() => setShowPremium(true)} />;
      case 'video': return <VideoStudio onShowPremium={() => setShowPremium(true)} />;
      case 'voice': return <VoiceStudio onShowPremium={() => setShowPremium(true)} />;
      case 'library': return <Library onShowPremium={() => setShowPremium(true)} />;
      default: return <MusicStudio onShowPremium={() => setShowPremium(true)} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative px-6 pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center glow-purple rotate-3 shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-headline text-2xl font-black tracking-tighter">HIBO HUB</span>
        </div>

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
      </div>

      {/* Dynamic Background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] -right-[30%] w-[100%] aspect-square rounded-full bg-primary/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] -left-[40%] w-[80%] aspect-square rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-purple-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
