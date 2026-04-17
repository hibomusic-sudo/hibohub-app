"use client";

import React, { useState } from 'react';
import { Sparkles, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/app-context';
import { generateSongFromPromptAndGenre } from '@/ai/flows/generate-song-from-prompt-and-genre';
import { toast } from '@/hooks/use-toast';

const GENRES = ['Dhaanto', 'Qaraami', 'Afro-Somali', 'Rap'];

export function MusicStudio({ onShowPremium }: { onShowPremium: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Dhaanto');
  const [isGenerating, setIsGenerating] = useState(false);
  const { useGeneration, addToLibrary } = useApp();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt missing", description: "Please enter a theme for your song.", variant: "destructive" });
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
        genre: selectedGenre as any
      });
      
      addToLibrary({
        id: Date.now().toString(),
        type: 'song',
        title: prompt.slice(0, 20) + '...',
        url: result.songDataUri,
        createdAt: new Date().toISOString(),
        genre: selectedGenre
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple">Hees Sameyso</h1>
        <p className="text-muted-foreground text-sm">U samee hees Somali ah si fudud adigoo isticmaalaya AI.</p>
      </header>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mawduuca Heesta (Prompt)</label>
        <Textarea 
          placeholder="Tusaale: Samee hees jacayl ah oo ku saabsan quruxda Hargeisa..." 
          className="min-h-[140px] bg-card/40 border-border focus:border-primary transition-all resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nooca Heesta (Genre)</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                selectedGenre === genre 
                  ? "bg-primary text-white glow-purple" 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full h-16 rounded-2xl premium-gradient text-lg font-bold glow-purple group transition-all"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Abuuraya...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span>Abuur Hees</span>
          </div>
        )}
      </Button>

      <div className="p-6 rounded-2xl glass-card border-dashed border-2 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <Music className="w-6 h-6 text-accent" />
        </div>
        <h3 className="font-bold mb-1">Afro-Somali Beats</h3>
        <p className="text-xs text-muted-foreground">High fidelity studio quality production with traditional instruments.</p>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
