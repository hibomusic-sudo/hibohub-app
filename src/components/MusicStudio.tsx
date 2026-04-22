"use client";

import React, { useState } from 'react';
import { Sparkles, Music, Drum, Mic2, Heart, Radio, Flame, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateReplicateMusic } from '@/ai/flows/generate-replicate-music';
import { toast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';

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
  const [showAllGenres, setShowAllGenres] = useState(false);
  const { useGeneration, t } = useApp();

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

    setIsGenerating(true);
    try {
      const result = await generateReplicateMusic({
        prompt,
        genre: selectedStyle as any
      });
      
      const songId = Date.now().toString();
      
      // Upload base64 audio to Firebase Storage
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `users/${user.uid}/songs/${songId}.wav`);
      
      toast({ title: "Kaydinaya...", description: "Heesta ayaa lagu shubayaa Storage-ka..." });
      await uploadString(storageRef, result.audioBase64, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      const songData = {
        id: songId,
        userId: user.uid,
        title: prompt.slice(0, 30) + '...',
        audioFileUrl: downloadUrl, // Store the small URL
        genreId: selectedStyle,
        genre: selectedStyle,
        prompt: prompt,
        durationSeconds: 60,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'aiGeneratedSongs', songId), songData);

      toast({ title: "Guul!", description: "Heestaadii waa diyaar!" });
      setPrompt('');
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Something went wrong.", variant: "destructive" });
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
          U samee hees Somali ah oo heer caalami ah adigoo isticmaalaya AI. ✨🎧🎹
        </p>
      </header>

      <div className="space-y-6">
        <div className="relative group">
          <div className="flex items-center justify-between mb-3 px-1">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mawduuca ✍️</label>
            <button 
              onClick={() => setPrompt("Hees jaceyl ah oo gaaban, 10 ilbiriqsi oo kaliya, garaac degdeg ah iyo cod macaan.")}
              className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition-all font-bold flex items-center gap-1 shadow-lg border border-primary/20"
            >
              🎁 Tusaale (Tijaabo 10 Sekan)
            </button>
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <Textarea 
            placeholder={t('prompt_placeholder')}
            className="relative min-h-[160px] bg-card/60 backdrop-blur-xl border-white/5 focus:border-primary/50 transition-all resize-none rounded-2xl text-lg p-6 shadow-2xl"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
          disabled={isGenerating}
          className="w-full h-20 rounded-[2.5rem] premium-gradient text-xl font-bold glow-purple group transition-all active:scale-95 overflow-hidden relative shadow-2xl shadow-primary/40 border-t border-white/20"
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
