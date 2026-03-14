import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoryState {
  storyText: string;
  isGenerating: boolean;
  storyboardId: number | null;
  setStoryText: (text: string) => void;
  setStoryboardId: (id: number | null) => void;
  startGenerating: () => void;
  stopGenerating: () => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      storyText: '',
      isGenerating: false,
      storyboardId: null,
      setStoryText: (text) => set({ storyText: text }),
      setStoryboardId: (id) => set({ storyboardId: id }),
      startGenerating: () => set({ isGenerating: true }),
      stopGenerating: () => set({ isGenerating: false }),
      reset: () => set({ storyText: '', isGenerating: false, storyboardId: null }),
    }),
    { name: 'story-store', partialize: (s) => ({ storyboardId: s.storyboardId }) }
  )
);
