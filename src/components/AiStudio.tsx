"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic2, Sparkles, Volume2, Download, Play, Pause, ChevronDown, Music4, MessageSquare, Flame, UploadCloud, Mic, X, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/lib/app-context';
import { generateVoiceCover } from '@/ai/flows/generate-voice-cover';
import { generateReplicateSong } from '@/ai/flows/generate-replicate-song';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
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

const SINGER_TYPES = [
  "Male Voice (Nin)",
  "Female Voice (Naag)",
  "Group / Choir (Jamac)"
];

const SONG_TYPES = [
  "Audio Song", "Video Song"
];

const LANGUAGES = [
  "Af Soomaali", "English", "Arabic", "Swahili"
];

const ADVANCED_STEPS = [
  "Voice Cleaning (Removing noise)...",
  "Voice Analysis (Detecting tone)...",
  "Voice Clone Creation...",
  "Instrument Selection...",
  "Vocal Synthesis...",
  "Mix & Master..."
];

export function AiStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  
  const [mode, setMode] = useState<Mode>('music');
  
  // Voice Cloning state
  const { isRecording, audioBlob, audioUrl: recordedAudioUrl, duration: recordedDuration, startRecording, stopRecording, clearAudio } = useAudioRecorder();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'record'>('upload');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Music state
  const [songPrompt, setSongPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(GENRE_LIST[0]);
  const [selectedMood, setSelectedMood] = useState(MOOD_LIST[0]);
  const [selectedSingerType, setSelectedSingerType] = useState(SINGER_TYPES[0]);
  const [selectedSongType, setSelectedSongType] = useState(SONG_TYPES[0]);
  const [isInstrumental, setIsInstrumental] = useState(false);
  
  // Shared state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
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
        id, // Keep id for React mapping
        song_id: id,
        userId: user.uid,
        title: data.prompt ? data.prompt.slice(0, 30) + '...' : 'AI Generated Content',
        audio_url: data.audioBase64 ? mediaUrl : '',
        video_url: data.videoBase64 ? mediaUrl : '',
        audioFileUrl: data.audioBase64 ? mediaUrl : '', // Fallback for older code
        cover_image: '', // Placeholder until we generate cover images
        genre: type === 'music' ? selectedGenre : '',
        mood: type === 'music' ? selectedMood : selectedMood,
        language: type === 'voice' ? selectedLanguage : '',
        singer_type: type === 'music' ? (isInstrumental ? 'Instrumental' : selectedSingerType) : 'User Upload',
        isPublic: isPublic,
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(), // Fallback for older sorting code
        type: type
      };
      
      await setDoc(doc(db, 'users', user.uid, type === 'music' ? 'aiGeneratedSongs' : 'aiGeneratedVoices', id), docData);
    } catch (error) {
      console.error("Firebase save error:", error);
    }
  };

  const handleGenerate = async () => {
    if (onRequireAuth()) return;
    if (!useGeneration()) { onShowPremium(); return; }

    if (mode === 'voice') {
      if (!audioBlob && !uploadedFile) {
        toast({ title: "Cod Maqan", description: "Fadlan soo geli ama duub codkaaga.", variant: "destructive" });
        return;
      }
      if (uploadMethod === 'record' && recordedDuration < 10) {
        toast({ title: "Duubista waa gaaban tahay", description: "Fadlan duub cod ka badan 10 ilbiriqsi.", variant: "destructive" });
        return;
      }
    }
    if (mode === 'music' && !isInstrumental && !songPrompt.trim()) {
      toast({ title: "Mawduuca Geli", description: "Fadlan heesta mawduuceeda qor ama shid 'Instrumental'.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGenerationStepIndex(0);
    
    // Simulate advanced steps processing for Voice mode
    let stepInterval: NodeJS.Timeout;
    if (mode === 'voice') {
      let currentStep = 0;
      stepInterval = setInterval(() => {
        currentStep++;
        if (currentStep < ADVANCED_STEPS.length) {
          setGenerationStepIndex(currentStep);
        }
      }, 4000); // Change step every 4 seconds
    }

    setAudioBase64(null);
    setVideoBase64(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (videoRef.current) { videoRef.current.pause(); videoRef.current = null; }

    try {
      if (mode === 'voice') {
        const fileToUse = audioBlob || uploadedFile;
        if (!fileToUse) return;

        // Convert Blob/File to Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(fileToUse);
        const base64Audio = await base64Promise;

        const result = await generateVoiceCover({ 
          referenceAudioBase64: base64Audio, 
          genre: selectedGenre, 
          mood: selectedMood 
        });
        setAudioBase64(result.audioBase64);
        try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'voice'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
        await saveToFirebase({ audioBase64: result.audioBase64, prompt: 'Voice Cover' }, 'voice');
        toast({ title: "Guul! 🎙️", description: "Heestii codkaaga ahayd waa diyaar!" });
      } else {
        const actualLyrics = isInstrumental ? (songPrompt.trim() || "[Instrumental]") : songPrompt;
        const stylePrompt = isInstrumental 
          ? `${selectedGenre}, ${selectedMood} mood, instrumental, no vocals`
          : `${selectedGenre}, ${selectedMood} mood, ${selectedSingerType}`;
        
        if (selectedSongType === 'Video Song') {
            const result = await generateReplicateSong({ lyrics: actualLyrics, style: stylePrompt, isInstrumental });
            setAudioBase64(result.audioBase64);
            try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'music'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
            await saveToFirebase({ audioBase64: result.audioBase64, prompt: actualLyrics }, 'music');
            toast({ title: "Guul! 🎵 (Audio Only)", description: "Video generation not yet hooked up, generated audio instead." });
        } else {
          const result = await generateReplicateSong({ lyrics: actualLyrics, style: stylePrompt, isInstrumental });
          setAudioBase64(result.audioBase64);
          try { localStorage.setItem('hibohub_last_audio', result.audioBase64); localStorage.setItem('hibohub_last_mode', 'music'); localStorage.removeItem('hibohub_last_video'); } catch (e) {}
          await saveToFirebase({ audioBase64: result.audioBase64, prompt: actualLyrics }, 'music');
          toast({ title: "Guul! 🎵", description: "Heestaadii waa diyaar!" });
        }
      }
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Wax baa qaldamay. Mar kale isku day.", variant: "destructive" });
    } finally {
      if (stepInterval!) clearInterval(stepInterval);
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
          <Mic className="w-4 h-4" />
          Voice Cloning
        </button>
      </div>

      {/* ── MUSIC MODE ── */}
      {mode === 'music' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div>
              <p className="text-sm font-bold text-white">Instrumental (Music Kaliya) 🎵</p>
              <p className="text-xs text-muted-foreground mt-1">Muusig aan laheyn codka fanaanka.</p>
            </div>
            <button
              onClick={() => setIsInstrumental(!isInstrumental)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isInstrumental ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                isInstrumental ? "translate-x-6" : "translate-x-0.5"
              )} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Song Description / Lyrics 🎼</label>
            <Textarea
              placeholder={isInstrumental ? `Describe the vibe of the instrumental...\ne.g. An upbeat pop backing track.` : `Describe the song or provide lyrics...\ne.g. An upbeat pop song about summer nights.`}
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
            
            {!isInstrumental && (
              <div className="space-y-2 col-span-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-muted-foreground">Singer Type 🎤</label>
                <div className="relative">
                  <select value={selectedSingerType} onChange={(e) => setSelectedSingerType(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                    {SINGER_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
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

      {/* ── VOICE UPLOAD MODE ── */}
      {mode === 'voice' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex gap-2 p-1 rounded-2xl bg-secondary/30 border border-white/5">
            <button
              onClick={() => { setUploadMethod('upload'); clearAudio(); }}
              className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", uploadMethod === 'upload' ? "bg-secondary text-white" : "text-muted-foreground")}
            >Upload Audio</button>
            <button
              onClick={() => { setUploadMethod('record'); setUploadedFile(null); }}
              className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", uploadMethod === 'record' ? "bg-secondary text-white" : "text-muted-foreground")}
            >Record Voice</button>
          </div>

          {uploadMethod === 'upload' ? (
            <div className="border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors rounded-3xl p-8 text-center bg-black/20 flex flex-col items-center justify-center gap-3">
              {uploadedFile ? (
                <div className="flex items-center gap-3 bg-primary/20 px-4 py-3 rounded-2xl border border-primary/30">
                  <Music4 className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white truncate max-w-[150px]">{uploadedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="p-2 hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Upload Voice / Audio</p>
                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A up to 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({ title: "Feylka wuu weyn yahay", description: "Fadlan soo geli feyl ka yar 10MB.", variant: "destructive" });
                          return;
                        }
                        
                        // Check duration
                        const audio = new Audio(URL.createObjectURL(file));
                        audio.onloadedmetadata = () => {
                          if (audio.duration < 10) {
                            toast({ title: "Feylku wuu gaaban yahay", description: "Fadlan soo geli feyl ka badan 10 ilbiriqsi.", variant: "destructive" });
                          } else {
                            setUploadedFile(file);
                          }
                        };
                      }
                    }}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl mt-2">Select File</Button>
                </>
              )}
            </div>
          ) : (
            <div className="border border-white/10 rounded-3xl p-8 text-center bg-black/20 flex flex-col items-center justify-center gap-4">
              {audioBlob ? (
                <div className="w-full space-y-4">
                  <audio src={recordedAudioUrl || undefined} controls className="w-full h-10" />
                  <Button onClick={clearAudio} variant="outline" className="w-full rounded-xl gap-2"><Trash2 className="w-4 h-4"/> Delete Recording</Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl border-4",
                      isRecording 
                        ? "bg-destructive border-destructive/30 animate-pulse scale-110" 
                        : "bg-primary border-primary/30 hover:scale-105"
                    )}
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </button>
                  <div>
                    <p className="text-sm font-bold">{isRecording ? "Duubista waa socotaa..." : "Taabo si aad u duubto codkaaga"}</p>
                    {isRecording && <p className="text-xs text-destructive animate-pulse mt-1">Recording...</p>}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Song Language 🌍</label>
              <div className="relative">
                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Genre to Match 🎸</label>
              <div className="relative">
                <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {GENRE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Mood to Match 😊</label>
              <div className="relative">
                <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="w-full appearance-none rounded-2xl bg-card border border-border text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                  {MOOD_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public/Private Toggle */}
      <div className="flex items-center justify-between p-4 bg-card/60 border border-border rounded-2xl">
        <div className="flex items-center gap-3">
          <Globe className={cn("w-5 h-5", isPublic ? "text-primary" : "text-muted-foreground")} />
          <div>
            <p className="text-sm font-bold">{isPublic ? 'Public Content' : 'Private Content'}</p>
            <p className="text-[10px] text-muted-foreground">Mark as public to show in Explore feed.</p>
          </div>
        </div>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || (mode === 'voice' ? (!audioBlob && !uploadedFile) : (!isInstrumental && !songPrompt.trim()))}
        className="w-full h-14 rounded-2xl premium-gradient text-base font-bold glow-purple group transition-all mt-4"
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{mode === 'music' ? 'Abuuraya...' : ADVANCED_STEPS[Math.min(generationStepIndex, ADVANCED_STEPS.length - 1)]}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{mode === 'music' ? 'Create AI Music 🎵' : 'Clone Voice & Create 🎙️'}</span>
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
