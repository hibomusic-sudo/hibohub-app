
"use client";

import React, { useState } from 'react';
import { Upload, Music, Globe, Lock, CheckCircle2, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function UploadStudio({ onShowPremium, onRequireAuth }: { onShowPremium: () => void, onRequireAuth: () => boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const { t } = useApp();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);

  const handleUpload = async () => {
    if (onRequireAuth()) return;
    if (!user) return;
    
    if (!title.trim()) {
      toast({ title: "Error", description: "Please enter a title.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const songId = Date.now().toString();
      const songData = {
        id: songId,
        uploaderId: user.uid,
        title: title,
        audioFileUrl: "https://picsum.photos/seed/music/300/300", // Mock URL
        durationSeconds: 120,
        isPublic: isPublic,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'uploadedSongs', songId), songData);
      
      toast({ title: "Success!", description: "Song uploaded to your library." });
      setTitle('');
      setFileSelected(false);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-teal">{t('upload_studio')}</h1>
        <p className="text-muted-foreground text-sm">Ku dar heesahaaga Hibo Hub si ay u noqdaan kuwa Public ama Private ah.</p>
      </header>

      <Card className="glass-card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center space-y-4">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all",
          fileSelected ? "bg-accent/20 text-accent glow-teal" : "bg-secondary/50 text-muted-foreground"
        )}>
          {fileSelected ? <CheckCircle2 className="w-10 h-10" /> : <CloudUpload className="w-10 h-10" />}
        </div>
        
        <div className="text-center">
          <Button variant="secondary" onClick={() => setFileSelected(true)} className="rounded-xl font-bold">
            Select Audio File
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">MP3, WAV (MAX 120 SECONDS)</p>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{t('title_label')}</label>
          <Input 
            placeholder="Tusaale: Hees Cusub 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-14 bg-card/60 border-white/5 rounded-2xl p-6 text-lg font-bold"
          />
        </div>

        <div className="flex items-center justify-between p-6 glass-card rounded-2xl">
          <div className="flex items-center gap-3">
            {isPublic ? <Globe className="w-5 h-5 text-accent" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
            <span className="text-sm font-bold">{isPublic ? t('public') : t('private')}</span>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        <Button 
          onClick={handleUpload}
          disabled={isUploading || !fileSelected}
          className="w-full h-16 rounded-[2rem] premium-gradient glow-purple text-lg font-bold shadow-2xl"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="w-6 h-6" />
              <span>{t('upload_song')}</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
