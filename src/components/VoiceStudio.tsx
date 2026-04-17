"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/app-context';
import { createCustomAiVoiceModel } from '@/ai/flows/create-custom-ai-voice-model';
import { toast } from '@/hooks/use-toast';

export function VoiceStudio({ onShowPremium }: { onShowPremium: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { useGeneration, addToLibrary } = useApp();
  
  // Mock recording logic for demo purposes
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Create a dummy blob
      setAudioBlob(new Blob());
    } else {
      setIsRecording(true);
      setAudioBlob(null);
    }
  };

  const handleCloneVoice = async () => {
    if (!useGeneration()) {
      onShowPremium();
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, we would use a real data URI from the recording
      const mockDataUri = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      
      const result = await createCustomAiVoiceModel({
        voiceSampleDataUri: mockDataUri
      });
      
      addToLibrary({
        id: result.voiceModelId,
        type: 'voice',
        title: `Codkayga: ${result.voiceModelId.slice(0, 5)}`,
        url: '#', // Placeholder
        createdAt: new Date().toISOString()
      });

      toast({ title: "Guul!", description: "Codkaagii waa la xafiday!" });
      setAudioBlob(null);
    } catch (error) {
      toast({ title: "Cillad", description: "Voice cloning failed. Try a longer sample.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-glow-purple">Codkaaga Sameyso</h1>
        <p className="text-muted-foreground text-sm">Duub codkaaga si AI-gu uu ugu heeso codkaaga oo kale.</p>
      </header>

      <div className="flex flex-col items-center justify-center p-12 rounded-[2rem] glass-card border-white/10 relative overflow-hidden">
        {/* Background glow */}
        <div className={cn(
          "absolute inset-0 premium-gradient opacity-10 transition-opacity duration-1000",
          isRecording ? "opacity-30" : "opacity-5"
        )} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 mb-8",
            isRecording ? "bg-red-500 glow-purple scale-110" : "bg-primary glow-purple"
          )}>
            <button 
              onClick={handleToggleRecord}
              className="w-full h-full flex items-center justify-center"
            >
              {isRecording ? <Square className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-white" />}
            </button>
          </div>
          
          <h2 className={cn("text-xl font-bold mb-2", isRecording ? "text-red-400" : "")}>
            {isRecording ? "Duubaya..." : "Duub Codkaaga"}
          </h2>
          <p className="text-muted-foreground text-xs text-center max-w-[200px]">
            {isRecording ? "Read a poem or sing for at least 30 seconds." : "Press the mic to start recording your voice sample."}
          </p>

          {isRecording && (
            <div className="flex gap-1 mt-6 h-8 items-center">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-red-500 rounded-full animate-pulse" 
                  style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 rounded-xl bg-card border border-border">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium">Quality Check: Crystal Clear</span>
        </div>

        <Button 
          onClick={handleCloneVoice}
          disabled={isProcessing || isRecording || !audioBlob}
          className="w-full h-16 rounded-2xl premium-gradient text-lg font-bold glow-purple group transition-all"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Samaynaya Codka...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>Clone Voice Model</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
