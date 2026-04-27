"use client";

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PremiumVisualizerProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}

export function PremiumVisualizer({ isPlaying, className, barCount = 40 }: PremiumVisualizerProps) {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(10));
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // Smoothly animate back to resting state
      setHeights(prev => prev.map(() => 10));
      return;
    }

    let time = 0;
    const animate = () => {
      time += 0.1;
      setHeights(prev => 
        prev.map((_, i) => {
          // Create a realistic-looking wave using sine functions and some noise
          const noise = Math.random() * 20;
          const wave1 = Math.sin(time + i * 0.2) * 20;
          const wave2 = Math.sin(time * 1.5 + i * 0.5) * 15;
          const centerBoost = Math.max(0, 40 - Math.abs(i - barCount / 2) * 3);
          
          let height = 20 + wave1 + wave2 + noise + centerBoost;
          // Keep within reasonable bounds (10% to 100%)
          return Math.max(10, Math.min(100, height));
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div className={cn("flex items-end justify-center gap-[2px] w-full", className)}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full premium-gradient transition-all duration-75 ease-out opacity-80"
          style={{ 
            height: `${h}%`,
            boxShadow: isPlaying ? '0 0 10px rgba(140, 44, 251, 0.5)' : 'none'
          }}
        />
      ))}
    </div>
  );
}
