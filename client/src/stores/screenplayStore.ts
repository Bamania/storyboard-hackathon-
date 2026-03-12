import { create } from 'zustand';
import type { Scene } from '../types';

interface ScreenplayState {
  scenes: Scene[];
  editingSceneId: string | null;
  isApproved: boolean;
  setScenes: (scenes: Scene[]) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  addScene: (scene: Scene) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  setEditingScene: (id: string | null) => void;
  approveScript: () => void;
  reset: () => void;
}

export const useScreenplayStore = create<ScreenplayState>((set) => ({
  scenes: [],
  editingSceneId: null,
  isApproved: false,
  setScenes: (scenes) => set({ scenes }),
  updateScene: (id, updates) =>
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  deleteScene: (id) =>
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id).map((s, i) => ({ ...s, number: i + 1 })),
    })),
  addScene: (scene) =>
    set((state) => ({
      scenes: [...state.scenes, { ...scene, number: state.scenes.length + 1 }],
    })),
  reorderScenes: (fromIndex, toIndex) =>
    set((state) => {
      const newScenes = [...state.scenes];
      const [moved] = newScenes.splice(fromIndex, 1);
      newScenes.splice(toIndex, 0, moved);
      return { scenes: newScenes.map((s, i) => ({ ...s, number: i + 1 })) };
    }),
  setEditingScene: (id) => set({ editingSceneId: id }),
  approveScript: () => set({ isApproved: true }),
  reset: () => set({ scenes: [], editingSceneId: null, isApproved: false }),
}));
