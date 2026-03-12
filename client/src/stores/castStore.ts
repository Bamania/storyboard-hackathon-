import { create } from 'zustand';
import type { Character } from '../types';

interface CastState {
  characters: Character[];
  regeneratingId: string | null;
  allLocked: boolean;
  setCharacters: (characters: Character[]) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  addCharacter: (character: Character) => void;
  deleteCharacter: (id: string) => void;
  lockCharacter: (id: string) => void;
  unlockCharacter: (id: string) => void;
  setRegenerating: (id: string | null) => void;
  reset: () => void;
}

export const useCastStore = create<CastState>((set, get) => ({
  characters: [],
  regeneratingId: null,
  allLocked: false,
  setCharacters: (characters) => {
    set({ characters });
    const allLocked = characters.length > 0 && characters.every((c) => c.isLocked);
    set({ allLocked });
  },
  updateCharacter: (id, updates) => {
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates, isLocked: false } : c)),
      allLocked: false,
    }));
  },
  addCharacter: (character) =>
    set((state) => ({ characters: [...state.characters, character], allLocked: false })),
  deleteCharacter: (id) => {
    set((state) => {
      const characters = state.characters.filter((c) => c.id !== id);
      return { characters, allLocked: characters.length > 0 && characters.every((c) => c.isLocked) };
    });
  },
  lockCharacter: (id) => {
    set((state) => {
      const characters = state.characters.map((c) => (c.id === id ? { ...c, isLocked: true } : c));
      return { characters, allLocked: characters.every((c) => c.isLocked) };
    });
  },
  unlockCharacter: (id) =>
    set((state) => ({
      characters: state.characters.map((c) => (c.id === id ? { ...c, isLocked: false } : c)),
      allLocked: false,
    })),
  setRegenerating: (id) => set({ regeneratingId: id }),
  reset: () => set({ characters: [], regeneratingId: null, allLocked: false }),
}));
