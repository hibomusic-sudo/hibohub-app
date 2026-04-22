"use client";

import React from 'react';
import { Music, Video, Mic, Library, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';

export type TabType = 'music' | 'video' | 'voice' | 'upload' | 'library';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { t, userProfile } = useApp();
  
  const tabs = [
    { id: 'music', label: 'MUSIC', icon: Music },
    { id: 'video', label: 'VIDEO', icon: Video },
    { id: 'voice', label: 'VOICE', icon: Mic },
    { id: 'upload', label: 'UPLOAD', icon: Upload },
    { id: 'library', label: 'YOUR', icon: Library },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-6 pb-8 pt-4">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              activeTab === tab.id 
                ? "text-primary scale-110" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "drop-shadow-[0_0_8px_rgba(140,44,251,0.6)]")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}