
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export type Language = 'so' | 'ar' | 'en';
export type UserRole = 'Regular' | 'Artist' | 'MusicDesigner';

interface AppContextType {
  isSubscribed: boolean;
  freeGenerationsUsed: number;
  language: Language;
  userProfile: any | null;
  setLanguage: (lang: Language) => void;
  setSubscribed: (val: boolean) => Promise<void>;
  useGeneration: () => Promise<boolean>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  so: {
    app_name: 'Hibo Hub',
    music_studio: 'Hees Sameyso',
    video_studio: 'Muuqaal Sameeye',
    voice_studio: 'Codkaaga Sameyso',
    library: 'Kaydkaaga',
    upload_studio: 'Upload Studio',
    generate_song: 'Abuur Hees',
    generate_video: 'Samee Muuqaal',
    clone_voice: 'Codkaaga Clone',
    premium_cta: 'Ku Biir Hibo Premium',
    prompt_placeholder: 'Tusaale: Samee hees jacayl ah...',
    genre_label: 'Nooca Heesta (Genre)',
    style_label: 'Habka Muuqaalka',
    select_song_first: 'Marka hore hees abuur',
    download: 'Soo deji',
    share: 'La wadaag',
    empty_library: 'Wax madow ah kuma jiraan kaydkaaga.',
    free_left: '1 Generation oo bilaash ah ayaa kuu haray',
    go_premium: 'Hadda ku biir Premium',
    artist: 'Fannaan',
    music_designer: 'Music Designer',
    regular_user: 'Shacab ka mid ah',
    choose_role: 'Dooro Noocaaga',
    login: 'Soo gal',
    signup: 'Is-diiwaangeli',
    logout: 'Ka bax',
    public: 'Public',
    private: 'Private',
    upload_song: 'Geli Hees',
    title_label: 'Ciwaanka Heesta'
  },
  ar: {
    app_name: 'هيبو هب',
    music_studio: 'صناعة الموسيقى',
    video_studio: 'صانع الفيديو',
    voice_studio: 'استوديو الصوت',
    library: 'مكتبتك',
    upload_studio: 'استوديو الرفع',
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
    go_premium: 'اشترك الآن',
    artist: 'فنان',
    music_designer: 'مصمم موسيقى',
    regular_user: 'مستخدم عادي',
    choose_role: 'اختر دورك',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'خروج',
    public: 'عام',
    private: 'خاص',
    upload_song: 'رفع أغنية',
    title_label: 'عنوان الأغنية'
  },
  en: {
    app_name: 'Hibo Hub',
    music_studio: 'Music Studio',
    video_studio: 'Video Creator',
    voice_studio: 'Voice Studio',
    library: 'Your Library',
    upload_studio: 'Upload Studio',
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
    go_premium: 'Go Premium Now',
    artist: 'Artist',
    music_designer: 'Music Designer',
    regular_user: 'Regular User',
    choose_role: 'Choose Your Role',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    public: 'Public',
    private: 'Private',
    upload_song: 'Upload Song',
    title_label: 'Song Title'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(0);
  const [language, setLanguage] = useState<Language>('so');
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile(data);
          setIsSubscribed(data.isPremiumSubscriber || false);
          setFreeGenerationsUsed(data.freeGenerationsUsed || 0);
        } else {
          const newProfile = {
            id: user.uid,
            externalAuthId: user.uid,
            username: user.displayName || 'User',
            email: user.email || '',
            role: 'Regular',
            freeGenerationsUsed: 0,
            isPremiumSubscriber: false,
            createdAt: new Date().toISOString()
          };
          setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        }
      });
    }
  }, [user, db]);

  useEffect(() => {
    const savedLang = localStorage.getItem('hibo_hub_lang');
    if (savedLang) {
      setLanguage(savedLang as Language);
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Mogadishu') || tz.includes('Nairobi')) setLanguage('so');
      else if (tz.includes('Riyadh') || tz.includes('Dubai') || tz.includes('Cairo')) setLanguage('ar');
      else setLanguage('en');
    }
  }, []);

  const setLanguageAndSave = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('hibo_hub_lang', lang);
  };

  const handleSetSubscribed = async (val: boolean) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPremiumSubscriber: val
      });
      setIsSubscribed(val);
      toast({ title: "Premium Activated!", description: "You now have unlimited access." });
    } catch (e) {
      toast({ title: "Error", description: "Could not update subscription.", variant: "destructive" });
    }
  };

  const useGeneration = async () => {
    if (isSubscribed) return true;
    if (freeGenerationsUsed < 1) {
      const nextUsed = freeGenerationsUsed + 1;
      setFreeGenerationsUsed(nextUsed);
      if (user && db) {
        await updateDoc(doc(db, 'users', user.uid), {
          freeGenerationsUsed: nextUsed
        });
      }
      return true;
    }
    return false;
  };

  const t = (key: string) => translations[language][key] || key;

  return (
    <AppContext.Provider value={{
      isSubscribed,
      freeGenerationsUsed,
      language,
      userProfile,
      setLanguage: setLanguageAndSave,
      setSubscribed: handleSetSubscribed,
      useGeneration,
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
