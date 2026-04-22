
"use client";

import React, { useState } from 'react';
import { Sparkles, Video, Download, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { generateVideoFromSongAndPrompt } from '@/ai/flows/generate-video-from-song-and-prompt';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STYLES = [
  { id: 'Cinematic', emoji: '🎬' },
  { id: 'Anime', emoji: '🎌' },
  { id: 'Realistic', emoji: '📷' },
  { id: 'Cyberpunk', emoji: '🌆' },
  { id: 'Abstract', emoji: '🎨' },
  { id: 'Nature', emoji: '🌿' },
];

export function VideoStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const [stylePrompt, setStylePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const { useGeneration, t } = useApp();

  const handleGenerate = async () => {
    if (onRequireAuth()) return;

    if (!stylePrompt.trim()) {
      toast({ title: "Qoraal geli", description: "Fadlan sharaxaad ku qor video-ga.", variant: "destructive" });
      return;
    }

    if (!useGeneration()) {
      onShowPremium();
      return;
    }

    setIsGenerating(true);
    setVideoDataUri(null);
    try {
      const fullPrompt = `${selectedStyle} style: ${stylePrompt}`;
      
      const result = await generateVideoFromSongAndPrompt({
        songAudioDataUri: '', // Not needed for text-to-video
        videoStylePrompt: fullPrompt
      });
      
      setVideoDataUri(result.videoDataUri);
      toast({ title: "Guul! 🎬", description: "Muuqaalkaagii waa diyaar!" });
      setStylePrompt('');
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Video generation failed.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoDataUri) return;
    try {
      const base64String = videoDataUri.split(',')[1] || videoDataUri;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hibohub-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      const link = document.createElement('a');
      link.href = videoDataUri;
      link.download = `hibohub-video-${Date.now()}.mp4`;
      link.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-teal">Video Studio 🎬</h1>
        <p className="text-muted-foreground text-sm">Qor sharaxaad — AI-gu muuqaal casri ah kuugu sameynayaa. ✨🎥</p>
      </header>

      {/* Video Result */}
      {videoDataUri && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-accent/20 bg-black">
            <video 
              src={videoDataUri} 
              controls 
              autoPlay
              className="w-full rounded-2xl"
              style={{ maxHeight: '300px' }}
            />
          </div>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full rounded-xl border-accent/20 hover:bg-accent/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Soo Dajiso MP4 ⬇️
          </Button>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sharaxaad 🎨</label>
          <button 
            onClick={() => setStylePrompt("Qof dumar ah oo badda agteeda taagan, qorraxdu dhacayso, midabyo diirran")}
            className="text-[10px] bg-accent/20 text-accent px-3 py-1 rounded-full hover:bg-accent/30 transition-all font-bold flex items-center gap-1"
          >
            ✨ Tusaale
          </button>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Textarea 
            placeholder="Tusaale: Qof oo socda meel dabiici ah, duulimaad sare, midabyo qurux badan..." 
            className="relative min-h-[120px] bg-card/60 backdrop-blur-xl border-white/5 focus:border-accent/50 transition-all resize-none rounded-2xl text-base p-5"
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            maxLength={500}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">{stylePrompt.length}/500</p>
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visual Style</label>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                "px-3 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 justify-center",
                selectedStyle === style.id 
                  ? "bg-accent text-background shadow-lg shadow-accent/20" 
                  : "bg-card border border-white/5 text-muted-foreground hover:bg-card/80"
              )}
            >
              <span>{style.emoji}</span>
              {style.id}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl bg-accent/5 border border-accent/10 p-3 space-y-1">
        <p className="text-xs font-bold text-accent">💡 Talo:</p>
        <p className="text-xs text-muted-foreground">Video-gu wuxuu noqonayaa 6 ilbidhiqsi (720p). Si fiican u sharax meesha, midabka, iyo dhaqdhaqaaqa.</p>
      </div>

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate}
        disabled={isGenerating || !stylePrompt.trim()}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-accent to-teal-400 hover:opacity-90 text-background text-base font-bold shadow-2xl"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            <span>Sameynaya video... (waxay qaadanaysaa 1-3 min)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <span>Samee Video AI 🎬</span>
          </div>
        )}
      </Button>
    </div>
  );
}
