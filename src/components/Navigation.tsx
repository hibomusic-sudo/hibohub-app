"use client";

import React from 'react';
import { Music, Video, Mic, Library, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'music' | 'video' | 'voice' | 'library' | 'premium';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'music', label: 'Hees', icon: Music },
    { id: 'video', label: 'Muuqaal', icon: Video },
    { id: 'voice', label: 'Cod', icon: Mic },
    { id: 'library', label: 'Kaydka', icon: Library },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-6 pb-6 pt-3">
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
            <span className="text-[10px] font-medium uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
