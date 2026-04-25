
"use client";

import React, { useState, useEffect } from 'react';
import { User, Music, Video, Settings, Heart, Users, Calendar, Share2, Edit3, Grid, List as ListIcon, Sparkles } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Profile({ onRemix }: { onRemix: (data: any) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [stats, setStats] = useState({ creations: 0, followers: 0, following: 0 });
  const [myCreations, setMyCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const fetchProfileData = async () => {
      try {
        // Fetch User Stats (Mocked for now, can be expanded)
        setStats({ creations: 12, followers: 850, following: 120 });

        // Fetch User's Creations
        const songsQuery = query(
          collection(db, 'users', user.uid, 'aiGeneratedSongs'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const uploadsQuery = query(
          collection(db, 'users', user.uid, 'uploadedSongs'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const [songsSnap, uploadsSnap] = await Promise.all([
          getDocs(songsQuery),
          getDocs(uploadsQuery)
        ]);

        const songs = songsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'ai' }));
        const uploads = uploadsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'upload' }));
        
        setMyCreations([...songs, ...uploads].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ));
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, db]);

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
        <User className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">Fadlan login si aad u aragto profile-kaaga.</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Gradient */}
        <div className="h-32 w-full rounded-3xl premium-gradient opacity-30 blur-xl absolute top-0 left-0 -z-10" />
        
        <div className="flex flex-col items-center space-y-4 pt-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" />
            <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary/20">
              <AvatarImage src={user.photoURL || ""} />
              <AvatarFallback className="bg-secondary text-2xl font-bold">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg border-2 border-background hover:scale-110 transition-transform">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black tracking-tight">{user.displayName || "Artist Hub"} 💎</h2>
            <p className="text-sm text-muted-foreground">@{user.email?.split('@')[0]} — AI Creator 🚀</p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-8 py-4 px-8 bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
            <div className="text-center">
              <p className="text-lg font-black text-primary">{stats.creations}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Creations</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{stats.followers}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Followers</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{stats.following}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Following</p>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <Button className="flex-1 rounded-full premium-gradient font-bold shadow-lg shadow-primary/20 h-11">
              Follow Me ⚡
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-white/5 border-white/10 h-11 w-11 hover:bg-white/10">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <Tabs defaultValue="creations" className="w-full">
        <TabsList className="w-full bg-white/5 p-1 rounded-2xl h-12 border border-white/5">
          <TabsTrigger value="creations" className="flex-1 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold">
            <Sparkles className="w-4 h-4 mr-2" /> Creations
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-lg font-bold">
            <Heart className="w-4 h-4 mr-2" /> Liked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creations" className="mt-6 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : myCreations.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {myCreations.map((item) => (
                <Card 
                  key={item.id} 
                  className="aspect-square relative overflow-hidden group cursor-pointer border-none bg-secondary/30"
                  onClick={() => onRemix(item)}
                >
                  {item.video_url ? (
                    <video src={item.video_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" muted />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
                      <Music className="w-8 h-8 text-primary/40 mb-2" />
                      <p className="text-[10px] font-bold text-center line-clamp-2">{item.title}</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <p className="text-[10px] font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] text-white/60 flex items-center gap-1">
                        <Heart className="w-2 h-2 fill-primary text-primary" /> {Math.floor(Math.random() * 100)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Wali waxba ma aadan soo gelin 🥺</p>
              <Button variant="outline" className="rounded-full border-primary/20 text-primary">
                Make your first song ✨
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes">
          <div className="text-center py-20 opacity-40">
            <Heart className="w-12 h-12 mx-auto mb-4" />
            <p className="font-bold">Liked songs will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
