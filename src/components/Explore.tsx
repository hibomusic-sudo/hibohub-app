"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Lock, Share2, Play, Pause, MoreVertical, 
  Search, Upload, Music4, Video, Download, Copy, Check,
  Clock, User as UserIcon, Flame, Sparkles, X, CloudUpload,
  CheckCircle2, FileAudio, FileVideo, Heart, MessageCircle, Send, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { 
  collectionGroup, query, where, getDocs, orderBy, limit, 
  doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ContentItem = {
  id: string;
  song_id?: string;
  title: string;
  audio_url?: string;
  audioFileUrl?: string;
  video_url?: string;
  cover_image?: string;
  genre?: string;
  mood?: string;
  uploaderId?: string;
  userId?: string;
  createdAt: string;
  created_at?: string;
  isPublic: boolean;
  type?: 'music' | 'voice' | 'upload';
  likesCount?: number;
  commentsCount?: number;
};

export function Explore({ onShowPremium, onRequireAuth, onRemix }: { onShowPremium: () => void, onRequireAuth: () => boolean, onRemix: (data: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { t } = useApp();
  
  const [publicContent, setPublicContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload Modal State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicContent();
  }, [db]);

  const fetchPublicContent = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      // Fetch public uploads
      const uploadsQuery = query(
        collectionGroup(db, 'uploadedSongs'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      // Fetch public AI songs
      const aiSongsQuery = query(
        collectionGroup(db, 'aiGeneratedSongs'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const aiVoicesQuery = query(
        collectionGroup(db, 'aiGeneratedVoices'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const [uploadsSnap, aiSongsSnap, aiVoicesSnap] = await Promise.all([
        getDocs(uploadsQuery).catch(e => { console.error("Uploads query failed:", e); return { docs: [] }; }),
        getDocs(aiSongsQuery).catch(e => { console.error("AI Songs query failed:", e); return { docs: [] }; }),
        getDocs(aiVoicesQuery).catch(e => { console.error("AI Voices query failed:", e); return { docs: [] }; })
      ]);

      const uploads = (uploadsSnap as any).docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem));
      const aiSongs = (aiSongsSnap as any).docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem));
      const aiVoices = (aiVoicesSnap as any).docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem));

      const combined = [...uploads, ...aiSongs, ...aiVoices].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setPublicContent(combined);
    } catch (error) {
      console.error("Error fetching explore content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!feedRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          setActiveVideoId(id);
        }
      });
    }, { threshold: 0.8 });

    const items = feedRef.current.querySelectorAll('.feed-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [publicContent, isLoading]);

  const handlePlayPause = (item: ContentItem) => {
    const url = item.audio_url || item.audioFileUrl;
    if (!url) return;

    if (currentlyPlaying === item.id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setCurrentlyPlaying(item.id);
      audioRef.current.onended = () => setCurrentlyPlaying(null);
    }
  };

  const handleShare = async (item: ContentItem) => {
    const url = window.location.origin + "/song/" + (item.id || item.song_id);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied! 🔗", description: "Heesta link-geeda waa la koobiyeeyay." });
    } catch (err) {
      toast({ title: "Cillad", description: "Link-ga waa la koobiyeen waayay.", variant: "destructive" });
    }
  };

  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const handleLike = (id: string) => {
    const newLiked = new Set(likedSongs);
    if (newLiked.has(id)) {
      newLiked.delete(id);
      toast({ title: "Unliked", description: "Heesta waa laga saaray Favorites." });
    } else {
      newLiked.add(id);
      toast({ title: "Liked! ❤️", description: "Heestan waa lagu daray Favorites-kaaga." });
    }
    setLikedSongs(newLiked);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate rules: Max 20MB audio, 50MB video, formats: mp3, wav, m4a, mp4
    const validExtensions = ['mp3', 'wav', 'm4a', 'mp4'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!validExtensions.includes(ext)) {
      toast({ title: "Nooc khaldan", description: "Fadlan file nooca MP3, WAV, M4A ama MP4 dooro.", variant: "destructive" });
      return;
    }

    // Validate file size (Audio: 20MB, Video: 50MB)
    const isVideo = file.type.includes('video');
    const limit = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > limit) {
      toast({ 
        title: "Aad u weyn", 
        description: `File-ka ${isVideo ? 'Video' : 'Audio'} waa inuu ka yar yahay ${isVideo ? '50MB' : '20MB'}.`, 
        variant: "destructive" 
      });
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUpload = async () => {
    if (onRequireAuth()) return;
    if (!user || !db) return;
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const songId = Date.now().toString();
      const storage = getStorage(firebaseApp);
      const ext = selectedFile.name.split('.').pop() || 'mp3';
      const storageRef = ref(storage, `users/${user.uid}/uploads/${songId}.${ext}`);

      toast({ title: "Uploading... ⬆️", description: "Heesta waa la soo gelinayaa (Uploading)..." });
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      const songData = {
        id: songId,
        uploaderId: user.uid,
        title: uploadTitle.trim(),
        audioFileUrl: selectedFile.type.includes('video') ? '' : downloadUrl,
        video_url: selectedFile.type.includes('video') ? downloadUrl : '',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        isPublic: uploadIsPublic,
        createdAt: new Date().toISOString(),
        type: 'upload'
      };

      await setDoc(doc(db, 'users', user.uid, 'uploadedSongs', songId), songData);
      
      toast({ title: "Guul! ✅", description: "Heestaadii waa la soo geliyay!" });
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
      fetchPublicContent();
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Upload failed.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredContent = publicContent.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-black animate-in fade-in duration-500 rounded-3xl border border-white/5">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex flex-col gap-4 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-headline text-3xl font-black text-white drop-shadow-lg pointer-events-auto tracking-tighter">
              Vibe <span className="text-primary italic text-sm">✨ Live</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
              onClick={() => toast({ title: "Search Mode 🔍", description: "Raadi vibes-ka ugu shidan!" })}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="rounded-full bg-primary text-white h-10 px-4 shadow-lg glow-purple font-bold border-none"
            >
              <Upload className="w-4 h-4 mr-2" /> Post 🚀
            </Button>
          </div>
        </div>

        {/* Suggestions Bar (Gen-Z Style) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pointer-events-auto pb-2">
          {['For You 🔥', 'Trending 📈', 'New 💎', 'Somali Pop 🎸', 'Aflo 🌊', 'Chill ☕', 'Party 💃'].map((tag) => (
            <button 
              key={tag}
              className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-bold hover:bg-white/10 hover:text-white transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredContent.length > 0 ? (
        <div 
          ref={feedRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        >
          {filteredContent.map((item) => (
            <div 
              key={item.id} 
              data-id={item.id}
              className="feed-item h-full w-full snap-start relative flex flex-col items-center justify-center bg-zinc-900"
            >
              {/* Media Content */}
              <div className="absolute inset-0 z-0">
                {item.video_url ? (
                  <video 
                    src={item.video_url} 
                    className="w-full h-full object-cover" 
                    loop 
                    muted={activeVideoId !== item.id}
                    autoPlay={activeVideoId === item.id}
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-zinc-800 to-black relative">
                    {/* Audio Visualizer Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="flex items-end gap-1 h-32">
                        {[1,2,3,4,5,6,7,8].map(i => (
                          <div key={i} className="w-2 bg-primary rounded-full animate-bounce" style={{ animationDuration: `${0.5 + i*0.1}s` }} />
                        ))}
                      </div>
                    </div>
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-48 h-48 rounded-3xl object-cover z-10 shadow-2xl glow-purple rotate-3" />
                    ) : (
                      <div className="w-48 h-48 rounded-3xl bg-secondary/50 flex items-center justify-center z-10 shadow-2xl glow-teal rotate-3">
                         <Music4 className="w-20 h-20 text-primary" />
                      </div>
                    )}
                  </div>
                )}
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-10 left-6 right-20 z-10 space-y-3">
                {item.lyrics && (
                  <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 max-w-[80%] animate-in fade-in slide-in-from-left-4">
                    <p className="text-white/90 text-sm italic line-clamp-3 leading-relaxed">
                      "{item.lyrics}"
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                   </div>
                   <span className="font-bold text-white text-lg">User_{item.userId?.slice(0,4)}</span>
                   <button className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold">Follow</button>
                </div>
                <h3 className="text-white font-medium text-base drop-shadow-md pr-4">{item.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/80 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <Music4 className="w-3 h-3" /> {item.genre || 'Original'}
                  </span>
                  <span className="text-xs text-white/80 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <Star className="w-3 h-3 text-yellow-400" /> Viral
                  </span>
                </div>
              </div>

              {/* Interaction Sidebar */}
              <div className="absolute bottom-12 right-4 z-20 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => handleLike(item.id)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-90",
                      likedSongs.has(item.id) ? "bg-red-500 text-white" : "bg-black/40 text-white"
                    )}
                  >
                    <Heart className={cn("w-6 h-6", likedSongs.has(item.id) && "fill-current")} />
                  </button>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{Math.floor(Math.random() * 500) + 100}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{Math.floor(Math.random() * 50)}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => handleShare(item)}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => onRemix(item)}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white glow-purple transition-all active:scale-90 animate-spin-slow"
                  >
                    <Sparkles className="w-6 h-6" />
                  </button>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">Remix</span>
                </div>

                {/* Love Sticker (Animated) */}
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => toast({ title: "Love Stickers! ❤️", description: "You sent a burst of love!" })}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-90"
                  >
                    <Heart className="w-6 h-6 animate-pulse" />
                  </button>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">Love</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
           <Sparkles className="w-16 h-16 text-muted-foreground opacity-20" />
           <p className="text-muted-foreground text-sm">Weli wax heeso ah laguma soo darin qaybtan.</p>
           <Button onClick={() => fetchPublicContent()} variant="outline" className="rounded-full">Reload Feed</Button>
        </div>
      )}

      {/* Upload Modal Overlay */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 bg-card border-white/10 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute right-6 top-6 p-2 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <header className="space-y-1 pr-12">
              <h2 className="text-2xl font-bold">Post to Explore ⬆️</h2>
              <p className="text-xs text-muted-foreground">La wadaag dunida heestaada ama videogaaga.</p>
            </header>

            <div className="space-y-4">
              <div 
                className={cn(
                  "p-8 border-dashed border-2 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all",
                  selectedFile ? "border-primary/40 bg-primary/5" : "border-white/10 bg-black/20 hover:border-primary/20"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                  selectedFile ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                )}>
                  {selectedFile ? (
                    selectedFile.type.includes('video') ? <FileVideo className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />
                  ) : <CloudUpload className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{selectedFile ? selectedFile.name : "Dooro Audio ama Video"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">MP3, M4A, WAV, MP4 (MAX 25MB)</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Magaca Heesta</label>
                <Input 
                  placeholder="Magaca heesta geli..."
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="h-12 bg-black/20 border-white/5 rounded-2xl px-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs font-bold">Public Content</p>
                    <p className="text-[10px] text-muted-foreground">Ka dhig mid muuqda qaybta Explore.</p>
                  </div>
                </div>
                <Switch checked={uploadIsPublic} onCheckedChange={setUploadIsPublic} />
              </div>

              <Button 
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !uploadTitle}
                className="w-full h-14 rounded-2xl premium-gradient glow-purple font-bold text-white shadow-xl"
              >
                {isUploading ? "Uploading..." : "Publish Now 🚀"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
