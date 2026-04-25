
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type WordSync = {
  word: string;
  start: number;
  end: number;
};

interface KaraokeLyricsProps {
  lyricsSync: WordSync[];
  currentTime: number;
  className?: string;
  activeColor?: string;
}

export function KaraokeLyrics({ 
  lyricsSync, 
  currentTime, 
  className,
  activeColor = "text-primary" 
}: KaraokeLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the active word
    const activeWord = containerRef.current?.querySelector('.active-word');
    if (activeWord) {
      activeWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  if (!lyricsSync || lyricsSync.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-wrap gap-x-1.5 gap-y-2 py-4 px-2 max-h-48 overflow-y-auto hide-scrollbar select-none",
        className
      )}
    >
      {lyricsSync.map((item, index) => {
        const isActive = currentTime >= item.start && currentTime <= item.end;
        const isPast = currentTime > item.end;

        return (
          <span
            key={`${index}-${item.word}`}
            className={cn(
              "text-lg font-black transition-all duration-300 rounded-lg px-1",
              isActive 
                ? cn(activeColor, "scale-125 glow-purple active-word z-10") 
                : isPast 
                  ? "text-white/40" 
                  : "text-white/80"
            )}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
}
