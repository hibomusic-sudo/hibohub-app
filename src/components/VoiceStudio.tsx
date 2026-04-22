
"use client";

import React, { useState, useRef } from 'react';
import { Mic2, Sparkles, Volume2, Download, Play, Pause, ChevronDown, Music4, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { generateReplicateVoice } from '@/ai/flows/generate-replicate-voice';
import { generateReplicateSong } from '@/ai/flows/generate-replicate-song';
import { VOICE_OPTIONS, EMOTION_OPTIONS, SONG_STYLE_OPTIONS } from '@/lib/voice-options';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Mode = 'tts' | 'song';

export function VoiceStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const [mode, setMode] = useState<Mode>('song'); // default to song mode
  // TTS state
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Friendly_Person');
  const [selectedEmotion, setSelectedEmotion] = useState('happy');
  // Song state
  const [songLyrics, setSongLyrics] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Dhaanto Somali');
  // Shared state
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { useGeneration } = useApp();

  const handleGenerate = async () => {
    if (onRequireAuth()) return;
    if (!useGeneration()) { onShowPremium(); return; }

    if (mode === 'tts' && !ttsText.trim()) {
      toast({ title: "Qoraal Geli", description: "Fadlan qoraal ku qor.", variant: "destructive" });
      return;
    }
    if (mode === 'song' && !songLyrics.trim()) {
      toast({ title: "Heesta Geli", description: "Fadlan heesta qoraalkeeda geli.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setAudioBase64(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    try {
      let result: { audioBase64: string };
      if (mode === 'tts') {
        result = await generateReplicateVoice({ text: ttsText, voice: selectedVoice, emotion: selectedEmotion });
        toast({ title: "Guul! 🎙️", description: "Codkii waa la sameeyay!" });
      } else {
        result = await generateReplicateSong({ lyrics: songLyrics, style: selectedStyle });
        toast({ title: "Guul! 🎵", description: "Heestaadii waa diyaar!" });
      }
      setAudioBase64(result.audioBase64);
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Wax baa qaldamay. Mar kale isku day.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioBase64) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioBase64);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioBase64;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    // Convert base64 data URL to Blob for reliable download
    const mimeType = mode === 'tts' ? 'audio/mpeg' : 'audio/mpeg';
    const ext = 'mp3';
    try {
      const base64String = audioBase64.split(',')[1] || audioBase64;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hibohub-${mode}-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: direct download
      const link = document.createElement('a');
      link.href = audioBase64;
      link.download = `hibohub-${mode}-${Date.now()}.${ext}`;
      link.click();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple">
          {mode === 'song' ? 'Hees AI 🎵' : 'Cod AI 🎙️'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === 'song'
            ? 'Qor heesta lyrics-keeda — AI wuxuu sameynayaa hees cod + muusig ah. 🎶'
            : 'Qoraal geli — AI-gu wuxuu u akhriyaa af Soomaali iyo 40+ luqadood. 🌍'}
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 rounded-2xl bg-card border border-border">
        <button
          id="mode-song"
          onClick={() => { setMode('song'); setAudioBase64(null); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === 'song'
              ? "bg-primary text-white glow-purple shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Music4 className="w-4 h-4" />
          Hees + Muusig 🎵
        </button>
        <button
          id="mode-tts"
          onClick={() => { setMode('tts'); setAudioBase64(null); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === 'tts'
              ? "bg-primary text-white glow-purple shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Cod Akhri 🎙️
        </button>
      </div>

      {/* ── SONG MODE ── */}
      {mode === 'song' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Lyrics Heesta 🎼</label>
            <Textarea
              id="song-lyrics-input"
              placeholder={`Tusaale:\nJaceylkayga waa cadceed\nInaad joogto xiisadeed\nQalbigeygana wuu heestaa\nMagacaagana wuu tilmaamaa ♪`}
              value={songLyrics}
              onChange={(e) => setSongLyrics(e.target.value.slice(0, 600))}
              rows={6}
              className="w-full rounded-2xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">{songLyrics.length}/600</span>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Nooca Muusigga 🎹</label>
            <div className="grid grid-cols-2 gap-2">
              {SONG_STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={cn(
                    "py-3 px-3 rounded-xl text-xs font-bold transition-all border text-left",
                    selectedStyle === s.id
                      ? "bg-primary text-white border-primary glow-purple"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Song tips */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
            <p className="text-xs font-bold text-amber-400">💡 Talo:</p>
            <p className="text-xs text-muted-foreground">Si heesta u fiicnaato, qor lyrics gaaban (4-8 sadar). Adigoo raaciya garaaca muusigga noocaada dooran.</p>
          </div>
        </div>
      )}

      {/* ── TTS MODE ── */}
      {mode === 'tts' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Qoraalka 📝</label>
            <div className="relative">
              <Textarea
                id="voice-text-input"
                placeholder="Halkaan qoraal ku qor si cod laga sameeyo... Af Soomaali waa la taageeri karaa! 🇸🇴"
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value.slice(0, 500))}
                rows={5}
                className="w-full rounded-2xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary pb-8"
              />
              <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{ttsText.length}/500</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Noocel Cod 🎤</label>
              <div className="relative">
                <select
                  id="voice-selector"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {VOICE_OPTIONS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dareen 😊</label>
              <div className="relative">
                <select
                  id="emotion-selector"
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value)}
                  className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  {EMOTION_OPTIONS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        id="generate-audio-btn"
        onClick={handleGenerate}
        disabled={isGenerating || (mode === 'tts' ? !ttsText.trim() : !songLyrics.trim())}
        className="w-full h-14 rounded-2xl premium-gradient text-base font-bold glow-purple group transition-all"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{mode === 'song' ? 'Samaynaya Hees...' : 'Samaynaya Codka...'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>{mode === 'song' ? 'Samee Hees AI 🎵' : 'Samee Cod AI 🎙️'}</span>
          </div>
        )}
      </Button>

      {/* Audio Result */}
      {audioBase64 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 rounded-[1.5rem] glass-card border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {mode === 'song' ? 'Heestaadii Waa Diyaar! 🎉' : 'Codkaagii Waa Diyaar! 🎉'}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === 'song' ? selectedStyle : `${VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label}`}
              </p>
            </div>
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-[2px] h-12 px-2">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-all",
                  isPlaying ? "bg-primary animate-pulse" : "bg-primary/40"
                )}
                style={{
                  height: `${25 + Math.sin(i * 0.7) * 20 + Math.sin(i * 1.3) * 10}%`,
                  animationDelay: `${i * 0.04}s`
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button id="play-audio-btn" onClick={handlePlayPause} variant="outline" className="flex-1 rounded-xl h-11 gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Jooji" : "Dhegayso"}
            </Button>
            <Button id="download-audio-btn" onClick={handleDownload} variant="outline" className="rounded-xl h-11 gap-2 px-4">
              <Download className="w-4 h-4" />
              Soo Dajiso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
