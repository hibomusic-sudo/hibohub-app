"use client";

import React from 'react';

const socialLinks = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/user/MrFaraton',
    emoji: '🎥',
    color: 'hover:bg-red-500/20 hover:text-red-400',
    description: 'Casharada AI & Tech',
  },
  {
    name: 'WhatsApp',
    url: 'https://shorturl.at/3HXba',
    emoji: '💬',
    color: 'hover:bg-green-500/20 hover:text-green-400',
    description: 'Group',
  },
  {
    name: 'Facebook',
    url: 'https://shorturl.at/O3TSv',
    emoji: '👥',
    color: 'hover:bg-blue-500/20 hover:text-blue-400',
    description: 'Page',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/Somalienglish3',
    emoji: '✈️',
    color: 'hover:bg-sky-500/20 hover:text-sky-400',
    description: 'Channel',
  },
];

export function Footer() {
  return (
    <footer className="w-full mt-8 mb-28 px-4">
      {/* Social Links */}
      <div className="flex justify-center gap-3 mb-4">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${link.name} - ${link.description}`}
            className={`
              w-11 h-11 rounded-2xl bg-card border border-white/5
              flex items-center justify-center
              transition-all duration-300 
              hover:scale-110 hover:shadow-lg hover:-translate-y-1
              active:scale-95
              ${link.color}
              group
            `}
          >
            <span className="text-lg group-hover:animate-bounce" role="img" aria-label={link.name}>
              {link.emoji}
            </span>
          </a>
        ))}
      </div>

      {/* Tagline */}
      <p className="text-center text-[10px] text-muted-foreground/60 mb-2">
        Hel casharada AI & Tech 🤖 — Ku biir bulshadeena!
      </p>

      {/* Copyright */}
      <div className="text-center space-y-1">
        <p className="text-[11px] font-bold text-muted-foreground/50">
          © {new Date().getFullYear()} HiboMusic. All rights reserved.
        </p>
        <p className="text-[9px] text-muted-foreground/30">
          Powered by AI ✨ — Made with ❤️ in Somalia 🇸🇴
        </p>
      </div>
    </footer>
  );
}
