
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
        
        // Calculate progress within the word (0 to 100%)
        let progress = 0;
        let fillColor = 'rgba(255, 255, 255, 0.2)';
        
        if (isActive) {
          progress = ((currentTime - item.start) / (item.end - item.start)) * 100;
          fillColor = '#8C2CFB'; // Primary color
        } else if (isPast) {
          progress = 100;
          fillColor = 'rgba(140, 44, 251, 0.6)'; // Primary color at 60% opacity
        }

        return (
          <span
            key={`${index}-${item.word}`}
            className={cn(
              "relative inline-block text-2xl font-black transition-all duration-200 select-none",
              isActive ? "scale-110 active-word z-10" : "scale-100"
            )}
            style={{
              backgroundImage: `linear-gradient(to right, ${fillColor} ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: isActive ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' : 'none',
              color: 'transparent' // Fallback
            }}
          >
            {item.word}

            {/* Subtle highlight bar below the active word */}
            {isActive && (
              <span className="absolute -bottom-1 left-0 h-0.5 bg-primary w-full rounded-full animate-pulse shadow-[0_0_10px_#A855F7]" />
            )}
          </span>
        );
      })}
    </div>
  );
}
