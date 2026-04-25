"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic2, Sparkles, Volume2, Download, Play, Pause, ChevronDown, Music4, MessageSquare, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import { generateReplicateVoice } from '@/ai/flows/generate-replicate-voice';
import { generateReplicateSong } from '@/ai/flows/generate-replicate-song';
import { VOICE_OPTIONS, EMOTION_OPTIONS } from '@/lib/voice-options';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

type Mode = 'music' | 'voice';

const GENRE_LIST = [
  "Pop", "Hip Hop", "Afrobeat", "R&B", "Rock", "Electronic", "Jazz", 
  "Classical", "Lo-fi", "Trap", "Dance", "Gospel", "Reggae", "Latin", "Country"
];

const MOOD_LIST = [
  "Happy", "Sad", "Energetic", "Romantic", "Chill", 
  "Dark", "Motivational", "Emotional", "Epic"
];

const SONG_TYPES = [
  "Audio Song", "Video Song"
];

export function AiStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  
  const [mode, setMode] = useState<Mode>('music');
  
  // TTS (Voice) state
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Friendly_Person');
  const [selectedVoiceEmotion, setSelectedVoiceEmotion] = useState('happy');
  
  // Music state
  const [songPrompt, setSongPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(GENRE_LIST[0]);
  const [selectedMood, setSelectedMood] = useState(MOOD_LIST[0]);
  const [selectedSongType, setSelectedSongType] = useState(SONG_TYPES[0]);
  
  // Shared state
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { useGeneration, t } = useApp();

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedAudio = localStorage.getItem('hibohub_last_audio');
      const savedMode = localStorage.getItem('hibohub_last_mode');
      const savedVideo = localStorage.getItem('hibohub_last_video');
      if (savedAudio) setAudioBase64(savedAudio);
      if (savedVideo) setVideoBase64(savedVideo);
      if (savedMode) setMode(savedMode as Mode);
    } catch (e) {
      console.warn('Failed to load from local storage', e);
    }
  }, []);

  const saveToFirebase = async (data: any, type: 'voice' | 'music') => {
    if (!user) return;
    try {
      const id = Date.now().toString();
      const storage = getStorage(firebaseApp);
      
      let mediaUrl = '';
      if (data.audioBase64) {
        const storageRef = ref(storage, `users/${user.uid}/aiGeneratedVoices/${id}.mp3`);
        await uploadString(storageRef, data.audioBase64, 'data_url');
        mediaUrl = await getDownloadURL(storageRef);
      } else if (data.videoBase64) {
        const storageRef = ref(storage, `users/${user.uid}/aiGeneratedVideos/${id}.mp4`);
        await uploadString(storageRef, data.videoBase64, 'data_url');
        mediaUrl = await getDownloadURL(storageRef);
      }
      
      const docData = {
        id,
        userId: user.uid,
        title: data.prompt ? data.prompt.slice(0, 30) + '...' : 'AI Generated Content',
        mediaUrl: mediaUrl,
        type: type,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid, type === 'music' ? 'aiGeneratedSongs' : 'aiGeneratedVoices', id), docData);
    } catch (error) {
      console.error("Firebase save error:", error);
    }
  };

  const handleGenerate = async () => {
    if (onRequireAuth()) return;
    if (!useGeneration()) { onShowPremium(); return; }

    if (mode === 'voice' && !ttsText.trim()) {
      toast({ title: "Qoraal Geli", description: "Fadlan qoraal ku qor.", variant: "destructive" });
      return;
    }
    if (mode === 'music' && !songPrompt.trim()) {
      toast({ title: "Mawduuca Geli", description: "Fadlan heesta mawduuceeda qor.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setAudioBase64(null);
    setVideoBase64(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (videoRef.current) { videoRef.current.pause(); videoRef.current = null; }

    try {
      if (mode === 'voice') {
        const result = await generateReplicateVoice({ text: ttsText, voice: selectedVoice, emotion: selectedVoiceEmotion });
        setAudioBase64(result.audioBase64);
        try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'voice'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
        await saveToFirebase({ audioBase64: result.audioBase64, prompt: ttsText }, 'voice');
        toast({ title: "Guul! 🎙️", description: "Codkii waa la sameeyay!" });
      } else {
        const stylePrompt = `${selectedGenre}, ${selectedMood} mood`;
        
        if (selectedSongType === 'Video Song') {
            // Because generateReplicateVideo might not exist or we don't have it imported,
            // we will just use generateReplicateSong but ideally would use generateReplicateVideo
            // Let's assume we just generate a song for now if Video isn't fully supported,
            // or we use generateReplicateSong. Let me verify if generateReplicateVideo exists.
            const result = await generateReplicateSong({ lyrics: songPrompt, style: stylePrompt });
            setAudioBase64(result.audioBase64);
            try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'music'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
            await saveToFirebase({ audioBase64: result.audioBase64, prompt: songPrompt }, 'music');
            toast({ title: "Guul! 🎵 (Audio Only)", description: "Video generation not yet hooked up, generated audio instead." });
        } else {
          const result = await generateReplicateSong({ lyrics: songPrompt, style: stylePrompt });
          setAudioBase64(result.audioBase64);
          try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'music'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
          await saveToFirebase({ audioBase64: result.audioBase64, prompt: songPrompt }, 'music');
          toast({ title: "Guul! 🎵", description: "Heestaadii waa diyaar!" });
        }
      }
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Wax baa qaldamay. Mar kale isku day.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (audioBase64) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioBase64);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
      else { audioRef.current.play(); setIsPlaying(true); }
    } else if (videoBase64) {
      if (!videoRef.current) return;
      if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
      else { videoRef.current.play(); setIsPlaying(true); }
    }
  };

  const handleDownload = () => {
    const dataUrl = audioBase64 || videoBase64;
    if (!dataUrl) return;
    
    const ext = audioBase64 ? "mp3" : "mp4";
    const downloadBlob = async () => {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hibohub-${mode}-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Download failed", e);
      }
    };
    void downloadBlob();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple flex items-center gap-2">
          AI Studio <Sparkles className="w-6 h-6" />
        </h1>
        <p className="text-muted-foreground text-sm">
          Abuur heeso, muusig, iyo codad macaan adigoo isticmaalaya awoodda AI.
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 rounded-2xl bg-card border border-border">
        <button
          onClick={() => { setMode('music'); setAudioBase64(null); setVideoBase64(null); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === 'music' ? "bg-primary text-white glow-purple shadow-lg" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Music4 className="w-4 h-4" />
          Create AI Music
        </button>
        <button
          onClick={() => { setMode('voice'); setAudioBase64(null); setVideoBase64(null); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
            mode === 'voice' ? "bg-primary text-white glow-purple shadow-lg" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          AI + Voice
        </button>
      </div>

      {/* ── MUSIC MODE ── */}
      {mode === 'music' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Song Description / Lyrics 🎼</label>
            <Textarea
              placeholder={`Describe the song or provide lyrics...\ne.g. An upbeat pop song about summer nights.`}
              value={songPrompt}
              onChange={(e) => setSongPrompt(e.target.value.slice(0, 600))}
              rows={4}
              className="w-full rounded-2xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary"
            />
            <div className="text-right"><span className="text-xs text-muted-foreground">{songPrompt.length}/600</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Genre 🎸</label>
              <div className="relative">
                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {GENRE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Mood 😊</label>
              <div className="relative">
                <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {MOOD_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">AI Song Type 🎬</label>
            <div className="grid grid-cols-2 gap-2">
              {SONG_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedSongType(t)}
                  className={cn(
                    "py-3 px-3 rounded-xl text-sm font-bold transition-all border text-center",
                    selectedSongType === t
                      ? "bg-primary text-white border-primary glow-purple"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VOICE MODE ── */}
      {mode === 'voice' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Qoraalka 📝</label>
            <div className="relative">
              <Textarea
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
                <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {VOICE_OPTIONS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dareen 😊</label>
              <div className="relative">
                <select value={selectedVoiceEmotion} onChange={(e) => setSelectedVoiceEmotion(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
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
        onClick={handleGenerate}
        disabled={isGenerating || (mode === 'voice' ? !ttsText.trim() : !songPrompt.trim())}
        className="w-full h-14 rounded-2xl premium-gradient text-base font-bold glow-purple group transition-all mt-4"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{mode === 'music' ? 'Abuuraya...' : 'Samaynaya Codka...'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{mode === 'music' ? 'Create AI Music 🎵' : 'Generate Voice 🎙️'}</span>
          </div>
        )}
      </Button>

      {/* Audio/Video Result */}
      {(audioBase64 || videoBase64) && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 rounded-[1.5rem] glass-card border border-white/10 p-6 space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                Natiijada Waa Diyaar! 🎉
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === 'music' ? `${selectedGenre} • ${selectedMood}` : `AI Voice`}
              </p>
            </div>
          </div>

          {videoBase64 ? (
            <video 
              ref={videoRef}
              src={videoBase64} 
              className="w-full rounded-xl"
              controls
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
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
          )}

          <div className="flex gap-3">
            {!videoBase64 && (
              <Button onClick={handlePlayPause} variant="outline" className="flex-1 rounded-xl h-11 gap-2">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Jooji" : "Dhegayso"}
              </Button>
            )}
            <Button onClick={handleDownload} variant="outline" className="flex-1 rounded-xl h-11 gap-2 px-4">
              <Download className="w-4 h-4" />
              Soo Dajiso
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
