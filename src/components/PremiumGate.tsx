"use client";

import React from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/app-context';

export function PremiumGate({ onBack }: { onBack: () => void }) {
  const { setSubscribed } = useApp();

  const handleSubscribe = () => {
    setSubscribed(true);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="flex justify-end">
        <button onClick={onBack} className="p-2 text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center mt-8 mb-12">
        <div className="w-20 h-20 rounded-2xl premium-gradient flex items-center justify-center glow-purple mb-6 animate-glow-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="font-headline text-3xl font-bold mb-2 text-glow-purple">Ku Biir Hibo Premium</h1>
        <p className="text-muted-foreground max-w-[280px]">
          Unlock the full power of Somali AI creativity. Generate unlimited songs, videos, and voices.
        </p>
      </div>

      <div className="space-y-4 mb-12">
        <FeatureItem text="Unlimited High Fidelity AI Music" />
        <FeatureItem text="HD Video & Visualizer Generation" />
        <FeatureItem text="Advanced AI Voice Cloning" />
        <FeatureItem text="Direct Social Export (TikTok/Insta)" />
        <FeatureItem text="No Watermarks on Content" />
      </div>

      <div className="grid gap-4 mb-8">
        <PriceCard 
          title="Bishii (Monthly)" 
          price="$9.99" 
          description="Cancel anytime" 
          onSelect={handleSubscribe}
        />
        <PriceCard 
          title="Sanadkii (Yearly)" 
          price="$89.99" 
          description="Save 25% annually" 
          isBestValue 
          onSelect={handleSubscribe}
        />
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        By subscribing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
        <Check className="w-3 h-3 text-primary" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

function PriceCard({ title, price, description, isBestValue, onSelect }: { 
  title: string; 
  price: string; 
  description: string; 
  isBestValue?: boolean;
  onSelect: () => void;
}) {
  return (
    <Card 
      className={cn(
        "relative p-5 glass-card border-2 transition-all cursor-pointer group hover:scale-[1.02]",
        isBestValue ? "border-primary glow-purple" : "border-border hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      {isBestValue && (
        <span className="absolute -top-3 right-4 px-3 py-1 bg-primary text-[10px] font-bold uppercase tracking-tighter rounded-full">
          Gooni u goosad
        </span>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-headline">{price}</span>
          <p className="text-[10px] text-muted-foreground">per cycle</p>
        </div>
      </div>
    </Card>
  );
}
