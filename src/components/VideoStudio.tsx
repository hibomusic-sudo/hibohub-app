"use client";

import React, { useState } from 'react';
import { Sparkles, Video, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { generateVideoFromSongAndPrompt } from '@/ai/flows/generate-video-from-song-and-prompt';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

const STYLES = ['Cinematic', 'Anime', 'Realistic', 'Cyberpunk', 'Abstract'];

export function VideoStudio({ onShowPremium }: { onShowPremium: () => void }) {
  const [stylePrompt, setStylePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const { useGeneration, addToLibrary, library } = useApp();

  const songs = library.filter(item => item.type === 'song');

  const handleGenerate = async () => {
    if (songs.length === 0) {
      toast({ title: "No Songs", description: "First, generate a song in the Music Studio.", variant: "destructive" });
      return;
    }

    if (!stylePrompt.trim()) {
      toast({ title: "Style missing", description: "Please describe the video style.", variant: "destructive" });
      return;
    }

    if (!useGeneration()) {
      onShowPremium();
      return;
    }

    setIsGenerating(true);
    try {
      const lastSong = songs[0];
      const fullPrompt = `${selectedStyle}: ${stylePrompt}`;
      
      const result = await generateVideoFromSongAndPrompt({
        songAudioDataUri: lastSong.url,
        videoStylePrompt: fullPrompt
      });
      
      addToLibrary({
        id: Date.now().toString(),
        type: 'video',
        title: `Muuqaal: ${lastSong.title}`,
        url: result.videoDataUri,
        createdAt: new Date().toISOString(),
        style: selectedStyle
      });

      toast({ title: "Guul!", description: "Muuqaalkaagii waa diyaar!" });
      setStylePrompt('');
    } catch (error) {
      toast({ title: "Cillad", description: "Something went wrong. Video generation is intensive.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-teal">Muuqaal Sameeye</h1>
        <p className="text-muted-foreground text-sm">Samee muuqaal casri ah oo raacaya garaaca heestaada.</p>
      </header>

      {songs.length > 0 ? (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase text-accent tracking-tighter">Selected Song</p>
            <p className="truncate text-sm font-medium">{songs[0].title}</p>
          </div>
        </div>
      ) : (
        <Card className="p-6 bg-card/40 border-dashed border-2 flex flex-col items-center text-center">
          <MusicIcon className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Ma haysid hees la sameeyay. Marka hore hees abuur.</p>
        </Card>
      )}

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Style Details</label>
        <Textarea 
          placeholder="Tusaale: Qof dumar ah oo badda agteeda taagan, qorraxdu dhacayso, midabyo diirran..." 
          className="min-h-[100px] bg-card/40 border-border focus:border-accent transition-all resize-none"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visual Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                selectedStyle === style 
                  ? "bg-accent text-background glow-teal" 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleGenerate}
        disabled={isGenerating || songs.length === 0}
        className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-background text-lg font-bold glow-teal group transition-all"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            <span>Xisaabinaya...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            <span>Samee Muuqaal</span>
          </div>
        )}
      </Button>
    </div>
  );
}

function MusicIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
