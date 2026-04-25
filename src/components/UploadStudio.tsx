
"use client";

import React, { useState, useRef } from 'react';
import { Upload, Music, Globe, Lock, CheckCircle2, CloudUpload, FileAudio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function UploadStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { t } = useApp();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a|mp4|mov|avi|webm)$/i)) {
      toast({ title: "Nooc khaldan", description: "Fadlan file nooca Audio ama Video dooro.", variant: "destructive" });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Aad u weyn", description: "File-ka waa inuu ka yar yahay 50MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Auto-fill title from filename
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUpload = async () => {
    if (onRequireAuth()) return;
    if (!user || !db) return;
    
    if (!selectedFile) {
      toast({ title: "File dooro", description: "Fadlan audio file dooro.", variant: "destructive" });
      return;
    }

    if (!title.trim()) {
      toast({ title: "Magac geli", description: "Fadlan heesta magac u geli.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const songId = Date.now().toString();
      const storage = getStorage(firebaseApp);
      const ext = selectedFile.name.split('.').pop() || 'mp3';
      const storageRef = ref(storage, `users/${user.uid}/uploads/${songId}.${ext}`);

      // Upload file to Firebase Storage
      toast({ title: "Uploading... ⬆️", description: "Heesta waa la soo gelinayaa..." });
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      const isVideo = selectedFile.type.includes('video') || selectedFile.name.match(/\.(mp4|mov|avi|webm)$/i);
      const songData = {
        id: songId,
        uploaderId: user.uid,
        title: title.trim(),
        audioFileUrl: isVideo ? '' : downloadUrl,
        video_url: isVideo ? downloadUrl : '',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        durationSeconds: 0,
        isPublic: isPublic,
        createdAt: new Date().toISOString(),
        type: 'upload'
      };

      await setDoc(doc(db, 'users', user.uid, 'uploadedSongs', songId), songData);
      
      toast({ title: "Guul! ✅", description: "Heestaadii waa la soo geliyay!" });
      setTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast({ title: "Cillad", description: error.message || "Upload failed.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-teal">Upload Studio ⬆️</h1>
        <p className="text-muted-foreground text-sm">Codkaaga ama heestaada soo upload garee — library-gaaga ku kaydi. 🎶</p>
      </header>

      {/* File Drop Zone */}
      <Card 
        className={cn(
          "p-8 border-dashed border-2 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all",
          selectedFile 
            ? "border-accent/40 bg-accent/5" 
            : "border-white/10 bg-card/40 hover:border-primary/30 hover:bg-card/60"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all",
          selectedFile ? "bg-accent/20 text-accent" : "bg-secondary/50 text-muted-foreground"
        )}>
          {selectedFile ? <CheckCircle2 className="w-10 h-10" /> : <CloudUpload className="w-10 h-10" />}
        </div>
        
        {selectedFile ? (
          <div className="text-center space-y-1">
            <div className="flex items-center gap-2 justify-center">
              <FileAudio className="w-4 h-4 text-accent" />
              <p className="text-sm font-bold text-accent">{selectedFile.name}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB — Dooro kale riix
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-bold text-muted-foreground">Riix si aad file dorato</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">MP3, WAV, OGG, AAC (MAX 50MB)</p>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Magaca Heesta 🏷️</label>
          <Input 
            placeholder="Tusaale: Jaceylaaga Wuu Xiisadeed"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-14 bg-card/60 border-white/5 rounded-2xl p-6 text-sm font-bold"
          />
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center justify-between p-5 glass-card rounded-2xl">
          <div className="flex items-center gap-3">
            {isPublic ? <Globe className="w-5 h-5 text-accent" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
            <div>
              <span className="text-sm font-bold">{isPublic ? 'Public' : 'Private'}</span>
              <p className="text-[10px] text-muted-foreground">
                {isPublic ? 'Qof kasta wuu dhageysan karaa' : 'Adiga kaliya ayaa arki karta'}
              </p>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
          className="w-full h-14 rounded-2xl premium-gradient glow-purple text-base font-bold shadow-2xl"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Soo shubaya...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              <span>Soo Shub Heesta ⬆️</span>
            </div>
          )}
        </Button>

        {/* Tips */}
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 space-y-1">
          <p className="text-xs font-bold text-primary">💡 Talo:</p>
          <p className="text-xs text-muted-foreground">Upload-ka heesaha u isticmaal Video Studio — video cusub ka samee heestaada!</p>
        </div>
      </div>
    </div>
  );
}
