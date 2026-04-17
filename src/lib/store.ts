import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LibraryItem = {
  id: string;
  type: 'song' | 'video' | 'voice';
  title: string;
  url: string;
  createdAt: string;
  style?: string;
  genre?: string;
};

interface AppState {
  isSubscribed: boolean;
  freeGenerationsUsed: number;
  library: LibraryItem[];
  setSubscribed: (val: boolean) => void;
  incrementFreeGenerations: () => void;
  addToLibrary: (item: LibraryItem) => void;
  removeFromLibrary: (id: string) => void;
}

// Minimalistic zustand-like implementation since we don't have zustand installed, 
// using simple react state or a custom hook if preferred, but I'll use a standard object pattern for now.
// Actually, I'll implement a simple React context for global state to stay within project bounds.
