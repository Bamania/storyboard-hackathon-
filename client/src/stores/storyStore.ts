import { create } from 'zustand';

interface StoryState {
  storyText: string;
  isGenerating: boolean;
  setStoryText: (text: string) => void;
  startGenerating: () => void;
  stopGenerating: () => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  storyText: '',
  isGenerating: false,
  setStoryText: (text) => set({ storyText: text }),
  startGenerating: () => set({ isGenerating: true }),
  stopGenerating: () => set({ isGenerating: false }),
  reset: () => set({ storyText: '', isGenerating: false }),
}));
