"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Lock, Share2, Play, Pause, MoreVertical, 
  Search, Upload, Music4, Video, Download, Copy, Check,
  Clock, User as UserIcon, Flame, Sparkles, X, CloudUpload,
  CheckCircle2, FileAudio, FileVideo
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
};

export function Explore({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
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

      const [uploadsSnap, aiSongsSnap] = await Promise.all([
        getDocs(uploadsQuery),
        getDocs(aiSongsQuery)
      ]);

      const uploads = uploadsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem));
      const aiSongs = aiSongsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ContentItem));

      const combined = [...uploads, ...aiSongs].sort((a, b) => {
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
    const url = window.location.origin + "/song/" + item.id;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied! 🔗", description: "Heesta link-geeda waa la koobiyeeyay." });
    } catch (err) {
      toast({ title: "Cillad", description: "Link-ga waa la koobiyeen waayay.", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate rules: Max 25MB, formats: mp3, wav, m4a, mp4
    const validExtensions = ['mp3', 'wav', 'm4a', 'mp4'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!validExtensions.includes(ext)) {
      toast({ title: "Nooc khaldan", description: "Fadlan file nooca MP3, WAV, M4A ama MP4 dooro.", variant: "destructive" });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "Aad u weyn", description: "File-ka waa inuu ka yar yahay 25MB.", variant: "destructive" });
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

      toast({ title: "Uploading... ⬆️", description: "Heesta waa la soo shubayaa..." });
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
      
      toast({ title: "Guul! ✅", description: "Heestaadii waa la soo shubay!" });
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold text-glow-teal flex items-center gap-2">
            Explore <Flame className="w-6 h-6 text-orange-500" />
          </h1>
          <p className="text-muted-foreground text-xs font-medium">Heesaha ugu shidan bulshada Hibo Hub.</p>
        </div>
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="rounded-2xl bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 h-12 px-5 gap-2 font-bold"
        >
          <Upload className="w-4 h-4" />
          <span>Post</span>
        </Button>
      </header>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Raadi heeso, genres ama fanaaniin..." 
          className="h-14 pl-12 pr-4 bg-card/40 border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-card/40 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredContent.map((item) => (
            <Card key={item.id} className="p-4 bg-card/60 border-white/5 hover:border-primary/20 transition-all rounded-3xl group relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center overflow-hidden">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music4 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button 
                    onClick={() => handlePlayPause(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                  >
                    {currentlyPlaying === item.id ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate pr-8">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                      {item.genre || 'General'}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(item.createdAt || item.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleShare(item)}
                    className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Decorative background blur on hover */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Wax heeso ah weli laguma soo darin halkan.</p>
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
}
