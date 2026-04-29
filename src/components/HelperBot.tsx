"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export function HelperBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: '👋 Soo dhowoow sxb! Ma ku caawiyaa sida loo sameeyo heesaha ama app-ka loo isticmaalo?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pop up after 5 seconds on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenBot');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
        localStorage.setItem('hasSeenBot', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply || "Waan ka xumahay, cillad ayaa dhacday." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Internet-kaaga iska hubi sxb." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      {/* Greeting Bubble */}
      {showGreeting && !isOpen && (
        <div 
          onClick={() => { setIsOpen(true); setShowGreeting(false); }}
          className="mb-4 p-4 bg-black/80 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.2)] max-w-[260px] animate-in slide-in-from-bottom-5 fade-in duration-700 relative overflow-hidden cursor-pointer hover:border-primary/60 hover:scale-105 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-black text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary animate-pulse" /> Hibo Assistant ✨
            </p>
            <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
              <p className="text-white/80 pb-1">Ma ogtahay inaad HiboHub ku samayn karto:</p>
              <p className="flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Heeso AI casri ah 🎵</p>
              <p className="flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Voice Cloning & Covers 🎙️</p>
              <p className="flex items-center gap-1.5 text-white"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Train Custom Voice 🚀</p>
            </div>
            <p className="text-[10px] text-primary font-bold mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <span>I weydii sida loo bilaabo!</span>
              <span className="animate-bounce">👋</span>
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }} 
            className="absolute top-3 right-3 p-1 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[300px] h-[400px] bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 bg-primary/20 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-sm text-white">Hibo Assistant ✨</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-[13px] leading-relaxed shadow-sm", 
                  msg.role === 'user' ? "bg-primary text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm border border-white/5"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-2xl rounded-bl-sm p-3 flex gap-1 items-center border border-white/5">
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-zinc-900 border-t border-white/5 flex gap-2 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Weydii su'aal..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-white/30"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-full p-0 bg-primary hover:bg-primary/80 shrink-0 shadow-lg glow-purple">
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
        className={cn(
          "w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:scale-110",
          isOpen ? "bg-zinc-800 border border-white/10" : "bg-primary shadow-[0_0_20px_rgba(168,85,247,0.4)] glow-purple"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
