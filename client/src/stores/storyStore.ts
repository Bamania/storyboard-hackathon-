import { create } from 'zustand';

interface StoryState {
  storyText: string;
  genre: string | null;
  isGenerating: boolean;
  setStoryText: (text: string) => void;
  setGenre: (genre: string) => void;
  startGenerating: () => void;
  stopGenerating: () => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  storyText: '',
  genre: null,
  isGenerating: false,
  setStoryText: (text) => set({ storyText: text }),
  setGenre: (genre) => set({ genre }),
  startGenerating: () => set({ isGenerating: true }),
  stopGenerating: () => set({ isGenerating: false }),
  reset: () => set({ storyText: '', genre: null, isGenerating: false }),
}));
