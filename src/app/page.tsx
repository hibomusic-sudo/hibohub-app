"use client";

import React, { useState } from 'react';
import { AppProvider } from '@/lib/app-context';
import { Navigation, TabType } from '@/components/Navigation';
import { MusicStudio } from '@/components/MusicStudio';
import { VideoStudio } from '@/components/VideoStudio';
import { VoiceStudio } from '@/components/VoiceStudio';
import { Library } from '@/components/Library';
import { PremiumGate } from '@/components/PremiumGate';
import { Toaster } from '@/components/ui/toaster';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('music');
  const [showPremium, setShowPremium] = useState(false);

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
    <AppProvider>
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative px-6 pt-10">
        {/* App Logo/Branding */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center glow-purple">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight">Hibo Hub</span>
        </div>

        {/* Dynamic Background elements */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] -right-[20%] w-[80%] aspect-square rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[20%] -left-[20%] w-[60%] aspect-square rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <main className="flex-1 pb-10">
          {renderContent()}
        </main>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {showPremium && <PremiumGate onBack={() => setShowPremium(false)} />}
        <Toaster />
      </div>
    </AppProvider>
  );
}
