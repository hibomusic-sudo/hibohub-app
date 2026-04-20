"use client";

import React, { useState, useRef } from 'react';
import { Sparkles, Music, Drum, Mic2, Heart, Radio, Flame, Globe, Zap, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { GoogleGenAI } from '@google/genai';
import { getGeminiLiveKey } from '@/ai/actions/get-gemini-key';
import { PCMPlayer } from '@/lib/pcm-player';

const GENRE_CATEGORIES = [
  {
    name: 'Dhaqan (Traditional)',
    icon: Drum,
    image: '/images/trad_drum.png',
    styles: ['Dhaanto', 'Buraanbur', 'Xamari', 'May-Maay', 'Saar', 'Jaandheer']
  },
  {
    name: 'Casri (Modern)',
    icon: Flame,
    image: '/images/mod_mic.png',
    styles: ['Pop Somali', 'Afrobeat Somali', 'R&B Somali', 'Hip-hop', 'Trap Somali', 'Dancehall']
  },
  {
    name: 'Classic & Spiritual',
    icon: Music,
    image: '/images/classic_oud.png',
    styles: ['Qaraami', 'Nashiid', 'Qasiido', 'Oud Classic']
  },
  {
    name: 'Fusion & Dance',
    icon: Zap,
    image: '/images/fusion_dj.png',
    styles: ['Somali EDM', 'Afro-Somali Fusion', 'Arabic Fusion', 'Club Music']
  }
];

export function MusicStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Dhaanto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const { useGeneration, t } = useApp();
  
  const sessionRef = useRef<any>(null);
  const playerRef = useRef<PCMPlayer | null>(null);

  const stopStream = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.stop();
        // Wait a bit to ensure session is fully closed
        setTimeout(() => {
          sessionRef.current = null;
        }, 100);
      } catch (e) {
        console.error(e);
      }
    }
    
    setIsStreaming(false);
    setIsGenerating(false);

    if (playerRef.current && user) {
      toast({ title: "Kaydinaya...", description: "Heesta ayaa lagu shubayaa Storage-ka..." });
      try {
        const wavBlob = playerRef.current.getWavBlob();
        const songId = Date.now().toString();
        const storage = getStorage(firebaseApp);
        const storageRefPath = ref(storage, `users/${user.uid}/songs/${songId}.wav`);
        
        await uploadBytes(storageRefPath, wavBlob);
        const downloadUrl = await getDownloadURL(storageRefPath);

        const songData = {
          id: songId,
          userId: user.uid,
          title: prompt.slice(0, 30) || 'Suno Generation',
          audioFileUrl: downloadUrl,
          genreId: selectedStyle,
          genre: selectedStyle,
          prompt: prompt,
          durationSeconds: 60,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid, 'aiGeneratedSongs', songId), songData);
        toast({ title: "Guul!", description: "Heestaadii waa diyaar!" });
      } catch (e: any) {
        toast({ title: "Cillad", description: e.message || "Failed to save song.", variant: "destructive" });
      }
      
      playerRef.current.stop();
      playerRef.current = null;
    }
  };

  const handleGenerate = async () => {
    if (onRequireAuth()) return;
    if (!user) return;
    
    if (!prompt.trim()) {
      toast({ title: "Prompt missing", description: "Fadlan qor mawduuca heesta.", variant: "destructive" });
      return;
    }

    if (!useGeneration()) {
      onShowPremium();
      return;
    }

    if (isStreaming) {
      await stopStream();
      return;
    }

    setIsGenerating(true);
    try {
      const apiKey = await getGeminiLiveKey();
      const client = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
      
      playerRef.current = new PCMPlayer(44100);

      const session = await client.live.music.connect({
        model: "models/lyria-realtime-exp",
        callbacks: {
          onmessage: (message: any) => {
            console.log("Received message:", message);
            if (message.error) {
              toast({ title: "API Error", description: JSON.stringify(message.error), variant: "destructive" });
              setIsGenerating(false);
              stopStream();
              return;
            }
            if (message.serverContent?.audioChunks) {
              if (!isStreaming) setIsStreaming(true);
              for (const chunk of message.serverContent.audioChunks) {
                playerRef.current?.feedBase64(chunk.data);
              }
            }
          },
          onerror: (error: any) => {
            console.error("music session error:", error);
            toast({ title: "WebSocket Error", description: error?.message || "Waxaa cilladi ku timid stream-ka.", variant: "destructive" });
            setIsGenerating(false);
            stopStream();
          },
          onclose: () => {
            console.log("Lyria RealTime stream closed.");
            setIsGenerating(false);
            stopStream();
          },
        },
      });

      sessionRef.current = session;

      await session.setMusicGenerationConfig({
        musicGenerationConfig: {
          bpm: 90,
          temperature: 1.0,
          audioFormat: "pcm16",
          sampleRateHz: 44100,
        },
      });

      await session.setWeightedPrompts({
        weightedPrompts: [
          { text: `${selectedStyle} style, ${prompt}`, weight: 1.0 },
        ],
      });

      await session.play();
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Something went wrong.", variant: "destructive" });
      setIsGenerating(false);
      setIsStreaming(false);
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
          U samee hees Somali ah oo heer caalami ah adigoo isticmaalaya AI. ✨🎧🎹
        </p>
      </header>

      <div className="space-y-6">
        <div className="relative group">
          <div className="flex items-center justify-between mb-3 px-1">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mawduuca ✍️</label>
            <button 
              onClick={() => setPrompt("Hees jaceyl ah oo gaaban, garaac degdeg ah iyo cod macaan.")}
              className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition-all font-bold flex items-center gap-1 shadow-lg border border-primary/20"
            >
              🎁 Tusaale
            </button>
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <Textarea 
            placeholder={t('prompt_placeholder')}
            className="relative min-h-[160px] bg-card/60 backdrop-blur-xl border-white/5 focus:border-primary/50 transition-all resize-none rounded-2xl text-lg p-6 shadow-2xl"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming || isGenerating}
          />
        </div>

        <div className="space-y-6">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> {t('genre_label')} 🪘
          </label>
          
          <div className="space-y-6">
            {(showAllGenres ? GENRE_CATEGORIES : [GENRE_CATEGORIES[0]]).map((cat) => (
              <div key={cat.name} className="space-y-4 relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-5 shadow-inner">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-center gap-3 px-1 relative z-10">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-xl glow-purple relative group-hover:scale-110 transition-transform">
                    <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white/90 uppercase tracking-tight block">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><cat.icon className="w-3 h-3 text-accent" /> Soo dooro noocaaga</span>
                  </div>
                </div>
                <ScrollArea className="w-full whitespace-nowrap pb-2 relative z-10">
                  <div className="flex gap-2">
                    {cat.styles.map((style) => (
                      <button
                        key={style}
                        disabled={isStreaming || isGenerating}
                        onClick={() => setSelectedStyle(style)}
                        className={cn(
                          "px-5 py-3 rounded-xl text-xs font-bold transition-all border shrink-0",
                          selectedStyle === style 
                            ? "bg-primary text-white border-primary glow-purple scale-105" 
                            : "bg-secondary/40 text-muted-foreground border-white/5 hover:bg-secondary/60 hover:border-white/10",
                          (isStreaming || isGenerating) && "opacity-50 cursor-not-allowed"
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
            
            <button 
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="w-full py-3 rounded-xl border border-white/10 text-xs font-bold text-muted-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              {showAllGenres ? '🙉 Qari Qaybaha (See less)' : '🎵 Eeg Noocyo Kale (See more)'}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-32 left-6 right-6 z-40 max-w-md mx-auto">
        <Button 
          onClick={handleGenerate}
          className={cn(
            "w-full h-20 rounded-[2.5rem] text-xl font-bold group transition-all active:scale-95 overflow-hidden relative shadow-2xl border-t border-white/20",
            isStreaming ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 glow-red" : "premium-gradient glow-purple shadow-primary/40"
          )}
        >
          {isStreaming ? (
            <div className="flex items-center gap-3">
              <Square className="w-7 h-7 fill-current" />
              <span>Jooji Heesta (Stop Stream)</span>
              <div className="absolute top-0 right-0 h-full w-full bg-white/10 animate-pulse" />
            </div>
          ) : isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="animate-pulse">Isku Xiraya (Connecting)...</span>
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
