
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
import { HelperBot } from '@/components/HelperBot';
import { Onboarding } from '@/components/Onboarding';
import { Toaster } from '@/components/ui/toaster';
import { Music, Sparkles, Languages, LogOut, User as UserIcon, Bell, DollarSign } from 'lucide-react';
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
    <div className="max-w-md mx-auto min-h-[100dvh] flex flex-col relative px-6 pt-10">
      {/* Gen-Z Stickers */}
      <Sticker icon={Sparkles} className="top-[15%] left-[5%] w-8 h-8" delay="0s" />
      <Sticker icon={Sparkles} className="top-[40%] right-[10%] w-6 h-6" delay="1s" />
      <Sticker icon={Sparkles} className="bottom-[20%] left-[15%] w-10 h-10" delay="2s" />

      {/* Header */}
      {activeTab !== 'explore' && (
        <div className="flex items-center justify-between mb-10 relative z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center glow-purple rotate-3 shadow-lg">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-sm">HIBO MUSIC AI</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-secondary/50 border border-white/5 flex items-center justify-center hover:bg-secondary transition-all relative outline-none cursor-pointer">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,1)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-primary/10">
                  <h3 className="font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Ogeysiisyada (Notifications)</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto hide-scrollbar">
                  {/* Dummy Notification 1 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Heestaadii "Somali Love" waa diyaar! 🎵</p>
                      <p className="text-xs text-muted-foreground mt-1">2 daqiiqo kahor</p>
                    </div>
                  </div>
                  {/* Dummy Notification 2 */}
                  <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Axmed ayaa iibsaday heestaada! 💰</p>
                      <p className="text-xs text-muted-foreground mt-1">1 saac kahor</p>
                    </div>
                  </div>
                  {/* Dummy Notification 3 */}
                  <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Faadumo ayaa ku follow garaysay! 👋</p>
                      <p className="text-xs text-muted-foreground mt-1">3 saac kahor</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-white/5 text-center bg-black/40 hover:bg-white/5 cursor-pointer transition-colors">
                  <p className="text-xs font-bold text-primary">Arag Dhammaan</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
      <HelperBot />
      <Onboarding />
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
