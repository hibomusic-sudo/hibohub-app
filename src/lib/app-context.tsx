"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  setSubscribed: (val: boolean) => void;
  useGeneration: () => boolean; // returns true if allowed
  addToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setSubscribed] = useState(false);
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(0);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('hibo_hub_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSubscribed(parsed.isSubscribed || false);
      setFreeGenerationsUsed(parsed.freeGenerationsUsed || 0);
      setLibrary(parsed.library || []);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('hibo_hub_data', JSON.stringify({
      isSubscribed,
      freeGenerationsUsed,
      library,
    }));
  }, [isSubscribed, freeGenerationsUsed, library]);

  const useGeneration = () => {
    if (isSubscribed) return true;
    if (freeGenerationsUsed < 1) {
      setFreeGenerationsUsed(prev => prev + 1);
      return true;
    }
    return false;
  };

  const addToLibrary = (item: LibraryItem) => {
    setLibrary(prev => [item, ...prev]);
  };

  const removeFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(i => i.id !== id));
  };

  return (
    <AppContext.Provider value={{
      isSubscribed,
      freeGenerationsUsed,
      library,
      setSubscribed,
      useGeneration,
      addToLibrary,
      removeFromLibrary,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
