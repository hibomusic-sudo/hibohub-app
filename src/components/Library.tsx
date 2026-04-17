"use client";

import React, { useState } from 'react';
import { Play, Download, Share2, Music, Video, Mic, Trash2 } from 'lucide-react';
import { useApp, LibraryItem } from '@/lib/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export function Library({ onShowPremium }: { onShowPremium: () => void }) {
  const { library, removeFromLibrary } = useApp();
  const [activeItem, setActiveItem] = useState<LibraryItem | null>(null);

  const handleDownload = (item: LibraryItem) => {
    toast({ title: "Soo dajinaya...", description: `${item.title} has started downloading.` });
  };

  const handleShare = (item: LibraryItem) => {
    toast({ title: "Share", description: "Sharing to TikTok/Instagram..." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple">Kaydkaaga</h1>
        <p className="text-muted-foreground text-sm">Heesahaaga iyo muuqaaladaada aad halkan ka helaysaa.</p>
      </header>

      {activeItem && (
        <div className="p-6 rounded-[2rem] premium-gradient glow-purple animate-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Now Playing</p>
              <h2 className="text-xl font-bold text-white truncate max-w-[200px]">{activeItem.title}</h2>
            </div>
            <button onClick={() => setActiveItem(null)} className="text-white/70 hover:text-white">
              <Trash2 className="w-5 h-5" onClick={() => removeFromLibrary(activeItem.id)} />
            </button>
          </div>

          <div className="aspect-video w-full bg-black/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
             {activeItem.type === 'video' ? (
                <video src={activeItem.url} controls className="w-full h-full object-cover" />
             ) : (
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center animate-glow-pulse">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                </div>
             )}
          </div>

          <div className="flex justify-between gap-4">
            <Button onClick={() => handleDownload(activeItem)} variant="secondary" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button onClick={() => handleShare(activeItem)} variant="secondary" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
          
          {activeItem.type === 'song' && (
            <div className="mt-4">
               <audio src={activeItem.url} controls className="w-full h-8 opacity-60" />
            </div>
          )}
        </div>
      )}

      {library.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
            <LibraryIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Wax madow ah kuma jiraan kaydkaaga.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {library.map((item) => (
            <Card 
              key={item.id} 
              className={cn(
                "p-4 glass-card border-border hover:border-primary/50 cursor-pointer transition-all group",
                activeItem?.id === item.id ? "border-primary bg-primary/5" : ""
              )}
              onClick={() => setActiveItem(item)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  item.type === 'song' ? "bg-primary/20 text-primary" : 
                  item.type === 'video' ? "bg-accent/20 text-accent" : "bg-purple-500/20 text-purple-500"
                )}>
                  {item.type === 'song' ? <Music className="w-6 h-6" /> : 
                   item.type === 'video' ? <Video className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <button className="p-2 text-muted-foreground hover:text-primary">
                  <Play className="w-5 h-5 fill-current" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" />
    </svg>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
