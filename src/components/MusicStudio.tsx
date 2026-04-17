
"use client";

import React, { useState } from 'react';
import { Sparkles, Music, Drum, Mic2, Heart, Radio, Flame, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { generateSongFromPromptAndGenre } from '@/ai/flows/generate-song-from-prompt-and-genre';
import { toast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const GENRE_CATEGORIES = [
  {
    name: 'Dhaqan (Traditional)',
    icon: Drum,
    styles: ['Dhaanto', 'Buraanbur', 'Xamari', 'May-Maay', 'Saar', 'Jaandheer']
  },
  {
    name: 'Casri (Modern)',
    icon: Flame,
    styles: ['Pop Somali', 'Afrobeat Somali', 'R&B Somali', 'Hip-hop', 'Trap Somali', 'Dancehall']
  },
  {
    name: 'Classic & Spiritual',
    icon: Music,
    styles: ['Qaraami', 'Nashiid', 'Qasiido', 'Oud Classic']
  },
  {
    name: 'Fusion & Dance',
    icon: Zap,
    styles: ['Somali EDM', 'Afro-Somali Fusion', 'Arabic Fusion', 'Club Music']
  }
];

export function MusicStudio({ onShowPremium }: { onShowPremium: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Dhaanto');
  const [isGenerating, setIsGenerating] = useState(false);
  const { useGeneration, addToLibrary, t, language } = useApp();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt missing", description: "Fadlan qor mawduuca heesta.", variant: "destructive" });
      return;
    }

    if (!useGeneration()) {
      onShowPremium();
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSongFromPromptAndGenre({
        prompt,
        genre: selectedStyle as any
      });
      
      addToLibrary({
        id: Date.now().toString(),
        type: 'song',
        title: prompt.slice(0, 30) + '...',
        url: result.songDataUri,
        createdAt: new Date().toISOString(),
        genre: selectedStyle
      });

      toast({ title: "Guul!", description: "Heestaadii waa diyaar!" });
      setPrompt('');
    } catch (error) {
      toast({ title: "Cillad", description: "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest animate-bounce">
          <Zap className="w-3 h-3 fill-current" /> AI Magic Enabled
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-glow-purple">
          {t('music_studio')}
        </h1>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          U samee hees Somali ah oo heer caalami ah adigoo isticmaalaya AI.
        </p>
      </header>

      <div className="space-y-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <Textarea 
            placeholder={t('prompt_placeholder')}
            className="relative min-h-[160px] bg-card/60 backdrop-blur-xl border-white/5 focus:border-primary/50 transition-all resize-none rounded-2xl text-lg p-6"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> {t('genre_label')}
          </label>
          
          <div className="space-y-8">
            {GENRE_CATEGORIES.map((cat) => (
              <div key={cat.name} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <cat.icon className="w-4 h-4 text-accent" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-tighter">{cat.name}</span>
                </div>
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <div className="flex gap-2">
                    {cat.styles.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={cn(
                          "px-5 py-3 rounded-xl text-xs font-bold transition-all border shrink-0",
                          selectedStyle === style 
                            ? "bg-primary text-white border-primary glow-purple scale-105" 
                            : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary/60 hover:border-white/10"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 left-6 right-6 z-40 max-w-md mx-auto">
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-20 rounded-[2rem] premium-gradient text-xl font-bold glow-purple group transition-all active:scale-95 overflow-hidden relative shadow-2xl shadow-primary/40"
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="animate-pulse">Abuuraya...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" />
              <span>{t('generate_song')}</span>
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
