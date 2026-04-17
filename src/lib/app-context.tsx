
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'so' | 'ar' | 'en';

export type LibraryItem = {
  id: string;
  type: 'song' | 'video' | 'voice';
  title: string;
  url: string;
  createdAt: string;
  style?: string;
  genre?: string;
};

interface AppContextType {
  isSubscribed: boolean;
  freeGenerationsUsed: number;
  library: LibraryItem[];
  language: Language;
  setLanguage: (lang: Language) => void;
  setSubscribed: (val: boolean) => void;
  useGeneration: () => boolean;
  addToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (id: string) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  so: {
    app_name: 'Hibo Hub',
    music_studio: 'Hees Sameyso',
    video_studio: 'Muuqaal Sameeye',
    voice_studio: 'Codkaaga Sameyso',
    library: 'Kaydkaaga',
    generate_song: 'Abuur Hees',
    generate_video: 'Samee Muuqaal',
    clone_voice: 'Clone Voice',
    premium_cta: 'Ku Biir Hibo Premium',
    prompt_placeholder: 'Tusaale: Samee hees jacayl ah...',
    genre_label: 'Nooca Heesta (Genre)',
    style_label: 'Habka Muuqaalka',
    select_song_first: 'Marka hore hees abuur',
    download: 'Soo deji',
    share: 'La wadaag',
    empty_library: 'Wax madow ah kuma jiraan kaydkaaga.',
    free_left: '1 Generation oo bilaash ah ayaa kuu haray',
    go_premium: 'Hadda ku biir Premium'
  },
  ar: {
    app_name: 'هيبو هب',
    music_studio: 'صناعة الموسيقى',
    video_studio: 'صانع الفيديو',
    voice_studio: 'استوديو الصوت',
    library: 'مكتبتك',
    generate_song: 'أنشئ أغنية',
    generate_video: 'أنشئ فيديو',
    clone_voice: 'استنساخ الصوت',
    premium_cta: 'انضم إلى هيبو بريميوم',
    prompt_placeholder: 'مثال: اصنع أغنية حب عن...',
    genre_label: 'نوع الموسيقى',
    style_label: 'نمط الفيديو',
    select_song_first: 'أنشئ أغنية أولاً',
    download: 'تحميل',
    share: 'مشاركة',
    empty_library: 'مكتبتك فارغة حالياً.',
    free_left: 'يتبقى لك جيل مجاني واحد',
    go_premium: 'اشترك الآن'
  },
  en: {
    app_name: 'Hibo Hub',
    music_studio: 'Music Studio',
    video_studio: 'Video Creator',
    voice_studio: 'Voice Studio',
    library: 'Your Library',
    generate_song: 'Generate Song',
    generate_video: 'Generate Video',
    clone_voice: 'Clone Voice',
    premium_cta: 'Join Hibo Premium',
    prompt_placeholder: 'Example: Make a love song about...',
    genre_label: 'Select Genre',
    style_label: 'Video Style',
    select_song_first: 'Create a song first',
    download: 'Download',
    share: 'Share',
    empty_library: 'Your library is empty.',
    free_left: '1 free generation remaining',
    go_premium: 'Go Premium Now'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setSubscribed] = useState(false);
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(0);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [language, setLanguage] = useState<Language>('so');

  useEffect(() => {
    const saved = localStorage.getItem('hibo_hub_v2_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSubscribed(parsed.isSubscribed || false);
      setFreeGenerationsUsed(parsed.freeGenerationsUsed || 0);
      setLibrary(parsed.library || []);
      setLanguage(parsed.language || 'so');
    } else {
      // Automatic region detection
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Mogadishu') || tz.includes('Nairobi')) setLanguage('so');
      else if (tz.includes('Riyadh') || tz.includes('Dubai') || tz.includes('Cairo') || tz.includes('Kuwait')) setLanguage('ar');
      else setLanguage('en');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hibo_hub_v2_data', JSON.stringify({
      isSubscribed,
      freeGenerationsUsed,
      library,
      language
    }));
  }, [isSubscribed, freeGenerationsUsed, library, language]);

  const useGeneration = () => {
    if (isSubscribed) return true;
    if (freeGenerationsUsed < 1) {
      setFreeGenerationsUsed(prev => prev + 1);
      return true;
    }
    return false;
  };

  const addToLibrary = (item: LibraryItem) => setLibrary(prev => [item, ...prev]);
  const removeFromLibrary = (id: string) => setLibrary(prev => prev.filter(i => i.id !== id));
  
  const t = (key: string) => translations[language][key] || key;

  return (
    <AppContext.Provider value={{
      isSubscribed,
      freeGenerationsUsed,
      library,
      language,
      setLanguage,
      setSubscribed,
      useGeneration,
      addToLibrary,
      removeFromLibrary,
      t
    }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
