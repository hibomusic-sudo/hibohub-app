"use client";

import React, { useState } from 'react';
import { Check, Sparkles, X, Zap, Crown, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function PremiumGate({ onBack }: { onBack: () => void }) {
  const { setSubscribed } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSubscribe = async () => {
    if (selectedPlan === 'free') {
      onBack();
      return;
    }
    // Instead of subscribing immediately, show the payment options
    setShowPaymentModal(true);
  };

  const handleSimulatePayment = async () => {
    await setSubscribed(true);
    setShowPaymentModal(false);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500 pb-24">
      {/* Dynamic Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex justify-end relative z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center mt-4 mb-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center glow-purple mb-4 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
          <Crown className="w-8 h-8 text-black" />
        </div>
        <h1 className="font-headline text-4xl font-black mb-2 text-white drop-shadow-md">Dooro Qorshahaaga</h1>
        <p className="text-white/60 max-w-[280px] text-sm">
          Soo saar awoodaada faneed adigoo isticmaalaya Hibo AI. Dooro qorshaha kugu haboon.
        </p>
      </div>

      <div className="grid gap-4 mb-8 relative z-10">
        
        {/* FREE TIER */}
        <PriceCard 
          id="free"
          title="Bilaash (Free)" 
          price="$0" 
          description="Ku fiican bilowga" 
          features={["Ilaa 3 Video/Heesood maalinkii", "Dhererka ugu badan 30 ilbidhiqsi", "Tayada caadiga ah (Standard Audio)"]}
          isSelected={selectedPlan === 'free'}
          onSelect={() => setSelectedPlan('free')}
          icon={<Zap className="w-5 h-5 text-zinc-400" />}
        />

        {/* MONTHLY TIER */}
        <PriceCard 
          id="monthly"
          title="Bishii (Pro)" 
          price="$9.99" 
          description="Awood dhamaystiran bishii" 
          features={["Abuur aan xad lahayn (Unlimited)", "Heeso buuxa (Ilaa 3 daqiiqo)", "Tayo sare (HQ Audio & 4K Video)", "Watermark la'aan"]}
          isSelected={selectedPlan === 'monthly'}
          isPopular
          onSelect={() => setSelectedPlan('monthly')}
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />

        {/* YEARLY TIER */}
        <PriceCard 
          id="yearly"
          title="Sanadkii (Max)" 
          price="$89.99" 
          description="Keydso 25% sanadkii" 
          features={["Wax kasta oo Pro ku jira", "Helitaanka Model-ada cusub horta", "Taageero toos ah (Priority Support)"]}
          isSelected={selectedPlan === 'yearly'}
          onSelect={() => setSelectedPlan('yearly')}
          icon={<Crown className="w-5 h-5 text-yellow-500" />}
        />

      </div>

      <div className="mt-auto relative z-10 w-full flex flex-col items-center gap-4">
        <Button 
          onClick={handleSubscribe}
          className="w-full max-w-sm h-14 rounded-full font-black text-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all"
          variant={selectedPlan === 'free' ? 'outline' : 'default'}
        >
          {selectedPlan === 'free' ? 'Sii Wado Bilaash' : 'Bixi Lacagta (Pay Now)'}
        </Button>
      </div>

      {/* PAYMENT MODAL (Simulated) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-black text-white mb-6 text-center">Dooro Qaabka Lacag Bixinta</h2>
            
            <div className="space-y-4">
              {/* Local Mobile Money */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">East Africa Mobile Money</h3>
                    <p className="text-[10px] text-white/50">Zaad, E-Dahab, Sahal, M-Pesa</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Tusaale: +252 63 XXX XXXX" className="bg-black/50 border-white/10 text-white" />
                  <Button onClick={handleSimulatePayment} className="bg-green-500 hover:bg-green-600 text-white font-bold">Bixi</Button>
                </div>
                <p className="text-[9px] text-white/40 mt-2 text-center">Fariin USSD (Push) ah ayaa kugu soo dhacaysa si aad PIN-ka u geliso.</p>
              </div>

              {/* International Cards */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">International Cards</h3>
                    <p className="text-[10px] text-white/50">Visa, Mastercard (via Stripe)</p>
                  </div>
                </div>
                <Button onClick={handleSimulatePayment} variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                  Pay with Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceCard({ id, title, price, description, features, isPopular, isSelected, onSelect, icon }: { 
  id: string;
  title: string; 
  price: string; 
  description: string; 
  features: string[];
  isPopular?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Card 
      onClick={onSelect}
      className={cn(
        "relative p-5 border-2 transition-all cursor-pointer group rounded-[2rem] overflow-hidden",
        isSelected 
          ? isPopular ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]" : "bg-white/10 border-white/30"
          : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
          Kan Ugu Wacan
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className="font-black text-xl text-white">{title}</h3>
          </div>
          <p className="text-xs text-white/50 font-medium">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-white">{price}</span>
        </div>
      </div>

      <div className="space-y-2.5 mt-4 pt-4 border-t border-white/10">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
              isSelected ? "bg-primary text-white" : "bg-white/10 text-white/50"
            )}>
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className={cn(
              "text-xs font-medium",
              isSelected ? "text-white" : "text-white/60"
            )}>{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
