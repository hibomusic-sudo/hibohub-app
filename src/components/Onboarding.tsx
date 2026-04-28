"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Music, DollarSign, ChevronRight, Check } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const slides = [
  {
    title: "Abuur Codkaaga 🎤",
    description: "Isticmaal Hibo AI Studio si aad u samayso heeso cusub ama aad u isticmaasho codadka fanaaniinta caanka ah.",
    icon: <Sparkles className="w-16 h-16 text-primary animate-pulse" />,
    color: "from-purple-500/20 to-transparent"
  },
  {
    title: "La Wadaag Vibe-ka 🌊",
    description: "Soo gali heesahaaga qaybta Vibe. Hel likes, comments, oo noqo fanaan caan ah gudaha HiboMusic.",
    icon: <Music className="w-16 h-16 text-blue-400 animate-bounce" />,
    color: "from-blue-500/20 to-transparent"
  },
  {
    title: "Lacag Ka Samee 💰",
    description: "Iibi heesahaaga! Dadku way iibsan karaan, adiguna waxaad helaysaa 70% faa'iidada (70/30 split).",
    icon: <DollarSign className="w-16 h-16 text-green-400 animate-pulse" />,
    color: "from-green-500/20 to-transparent"
  }
];

export function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b opacity-50 transition-colors duration-700",
        slides[currentSlide].color
      )} />

      <div className="relative w-full max-w-sm bg-zinc-950/80 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden min-h-[400px] justify-between">
        
        {/* Pagination Dots */}
        <div className="flex gap-2 mb-8 absolute top-8">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300", 
                i === currentSlide ? "w-8 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "w-2 bg-white/20"
              )} 
            />
          ))}
        </div>

        {/* Slide Content */}
        <div 
          key={currentSlide} 
          className="flex flex-col items-center mt-12 animate-in slide-in-from-right-8 fade-in duration-500"
        >
          <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            {slides[currentSlide].icon}
          </div>
          
          <h2 className="text-2xl font-black text-white mb-4">{slides[currentSlide].title}</h2>
          <p className="text-sm text-white/70 leading-relaxed font-medium px-4">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Controls */}
        <div className="w-full mt-10">
          <Button 
            onClick={handleNext} 
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/80 text-white font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            {currentSlide === slides.length - 1 ? (
              <>Bilaab App-ka <Check className="w-5 h-5" /></>
            ) : (
              <>Sii Soco <ChevronRight className="w-5 h-5" /></>
            )}
          </Button>
          
          {currentSlide < slides.length - 1 && (
            <button 
              onClick={handleComplete} 
              className="mt-4 text-xs font-bold text-white/40 hover:text-white transition-colors"
            >
              Skip Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
