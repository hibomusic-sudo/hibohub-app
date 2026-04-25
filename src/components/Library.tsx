"use client";

import React, { useState } from 'react';
import { Play, Download, Share2, Music, Video, Mic, Trash2, Globe, Lock, Check, Sparkles, Edit2 } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, deleteDoc, collection, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Library({ onShowPremium, onRequireAuth, onRemix }: { onShowPremium: () => void, onRequireAuth: () => boolean, onRemix: (data: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { t } = useApp();
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isLiking, setIsLiking] = useState(false);

  const songsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'aiGeneratedSongs');
  }, [db, user]);

  const uploadsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'uploadedSongs');
  }, [db, user]);

  const { data: aiSongs } = useCollection(songsQuery);
  const { data: uploads } = useCollection(uploadsQuery);

  const libraryItems = [
    ...(aiSongs?.map(s => ({ ...s, type: 'song' })) || [])
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const handleDownload = (item: any) => {
    toast({ title: "Downloading...", description: `${item.title} has started downloading.` });
  };

  const handleShare = (item: any) => {
    const shareText = `Check out my song on Hibo Hub: ${item.title}`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRemove = async (item: any) => {
    if (!user || !db) return;
    const colName = item.type === 'song' ? 'aiGeneratedSongs' : 'uploadedSongs';
    await deleteDoc(doc(db, 'users', user.uid, colName, item.id));
    if (activeItem?.id === item.id) setActiveItem(null);
    toast({ title: "Removed", description: "Item deleted from library." });
  };

  const handleRename = async () => {
    if (!user || !db || !activeItem) return;
    const colName = activeItem.type === 'song' ? 'aiGeneratedSongs' : 'uploadedSongs';
    try {
      await updateDoc(doc(db, 'users', user.uid, colName, activeItem.id), {
        title: newTitle.trim()
      });
      setActiveItem({ ...activeItem, title: newTitle.trim() });
      setIsRenaming(false);
      toast({ title: "Renamed! ✏️", description: "Heesta magaceeda waa la bedelay." });
    } catch (e) {
      toast({ title: "Cillad", description: "Magaca lama bedeli waayay.", variant: "destructive" });
    }
  };

  const handleLike = () => {
    setIsLiking(!isLiking);
    toast({ 
      title: !isLiking ? "Liked! ❤️" : "Unliked", 
      description: !isLiking ? "Heestan waxaad ku dartay Favorites-kaaga." : "Heesta waa laga saaray Favorites." 
    });
  };

  const togglePublic = async (item: any) => {
    if (!user || !db) return;
    const colName = item.type === 'song' ? 'aiGeneratedSongs' : 'uploadedSongs';
    const newStatus = !item.isPublic;
    try {
      await updateDoc(doc(db, 'users', user.uid, colName, item.id), {
        isPublic: newStatus
      });
      toast({ 
        title: newStatus ? "Published! 🚀" : "Unpublished 🔒", 
        description: newStatus ? "Heestaada waa public hadda." : "Heestaada waa private." 
      });
      if (activeItem?.id === item.id) setActiveItem({ ...activeItem, isPublic: newStatus });
    } catch (e) {
      toast({ title: "Cillad", description: "Waa la bedeli waayay status-ka.", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-secondary mx-auto flex items-center justify-center">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Kaydkaagu waa xiran yahay</h2>
          <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
            Fadlan soo gal si aad u aragto heesaha aad abuurtay ama aad soo gelisay.
          </p>
        </div>
        <Button onClick={() => onRequireAuth()} className="premium-gradient glow-purple rounded-xl font-bold">
          Soo Gal Hadda
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple">{t('library')}</h1>
        <p className="text-muted-foreground text-sm">Kaydkaaga heesaha iyo waxyaabaha aad abuurtay.</p>
      </header>

      {activeItem && (
        <div className="p-6 rounded-[2rem] premium-gradient glow-purple animate-in slide-in-from-top-4 duration-500 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Now Playing</p>
              <h2 className="text-xl font-bold text-white truncate max-w-[200px]">{activeItem.title}</h2>
            </div>
            <button onClick={() => handleRemove(activeItem)} className="text-white/70 hover:text-white p-2">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="aspect-video w-full bg-black/40 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
             <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center animate-glow-pulse shadow-xl">
                  <Music className="w-10 h-10 text-white" />
                </div>
             </div>
          </div>

          <div className="flex justify-between gap-4">
            <Button onClick={() => handleDownload(activeItem)} variant="secondary" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 rounded-2xl h-12">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button onClick={() => handleShare(activeItem)} variant="secondary" className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 rounded-2xl h-12">
              {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />} 
              {isCopied ? "Copied" : "Share Link"}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
             <Button 
                onClick={() => onRemix(activeItem)} 
                variant="outline" 
                className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
             >
                <Sparkles className="w-4 h-4 text-primary" /> Remix
             </Button>
             <Button 
                onClick={() => { setNewTitle(activeItem.title); setIsRenaming(true); }} 
                variant="outline" 
                className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2"
             >
                <Edit2 className="w-4 h-4 text-orange-400" /> Rename
             </Button>
          </div>

          {isRenaming && (
            <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200">
               <Input 
                  value={newTitle} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)} 
                  className="bg-background/50 mb-3 rounded-xl h-10"
                  autoFocus
               />
               <div className="flex gap-2">
                  <Button onClick={handleRename} className="flex-1 rounded-xl h-10 premium-gradient">Save</Button>
                  <Button onClick={() => setIsRenaming(false)} variant="ghost" className="flex-1 rounded-xl h-10">Cancel</Button>
               </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3">
                {activeItem.isPublic ? <Globe className="w-4 h-4 text-accent" /> : <Lock className="w-4 h-4 text-white/50" />}
                <div>
                   <p className="text-xs font-bold text-white">{activeItem.isPublic ? 'Publicly Visible' : 'Private Only'}</p>
                   <p className="text-[10px] text-white/50">Show this song in Explore feed.</p>
                </div>
             </div>
             <Switch checked={activeItem.isPublic || false} onCheckedChange={() => togglePublic(activeItem)} />
          </div>
          
          {activeItem.lyrics && (
            <div className="mt-4 p-4 rounded-2xl bg-black/30 border border-white/10 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Lyrics / Concept 🎼</p>
              <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed italic">"{activeItem.lyrics}"</p>
            </div>
          )}
          
          <div className="mt-6 bg-black/20 p-2 rounded-2xl flex flex-col gap-2">
             {(activeItem.audio_url || activeItem.audioFileUrl || activeItem.url || activeItem.mediaUrl) && !activeItem.video_url && (
               <audio src={activeItem.audio_url || activeItem.audioFileUrl || activeItem.mediaUrl || activeItem.url} controls className="w-full h-8 opacity-90" />
             )}
             {(activeItem.video_url || (activeItem.mediaUrl && activeItem.mediaUrl.includes('.mp4'))) && (
               <video src={activeItem.video_url || activeItem.mediaUrl} controls className="w-full rounded-lg mt-2 shadow-lg" />
             )}
          </div>
        </div>
      )}

      {libraryItems.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{t('empty_library')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {libraryItems.map((item) => (
            <Card 
              key={item.id} 
              className={cn(
                "p-4 glass-card border-border hover:border-primary/50 cursor-pointer transition-all group active:scale-[0.98]",
                activeItem?.id === item.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
              )}
              onClick={() => setActiveItem(item)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  item.type === 'song' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                )}>
                  <Music className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-sm">{item.title}</h3>
                    {item.isPublic !== undefined && (
                      item.isPublic ? <Globe className="w-3 h-3 text-accent" /> : <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    {item.type === 'song' ? (item.genre || 'AI Gen') + (item.mood ? ` • ${item.mood}` : '') : 'User Upload'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.singer_type && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.singer_type}</span>}
                  <button className="p-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
