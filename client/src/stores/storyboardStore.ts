import { create } from 'zustand';
import type { Frame, ChatMessage, InstantParams, DeepParams } from '../types';

interface StoryboardState {
  frames: Frame[];
  selectedFrameId: string | null;
  isEditorOpen: boolean;
  activeSceneFilter: string | null;
  chatMessages: ChatMessage[];
  pendingDeepChanges: Partial<DeepParams>;
  setFrames: (frames: Frame[]) => void;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  addFrame: (frame: Frame) => void;
  selectFrame: (id: string) => void;
  closeEditor: () => void;
  setSceneFilter: (sceneId: string | null) => void;
  updateInstantParams: (frameId: string, params: Partial<InstantParams>) => void;
  setPendingDeepChange: (changes: Partial<DeepParams>) => void;
  applyDeepChanges: (frameId: string) => void;
  clearPendingChanges: () => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  reset: () => void;
}

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  isEditorOpen: false,
  activeSceneFilter: null,
  chatMessages: [],
  pendingDeepChanges: {},
  setFrames: (frames) => set({ frames }),
  updateFrame: (id, updates) =>
    set((state) => ({ frames: state.frames.map((f) => (f.id === id ? { ...f, ...updates } : f)) })),
  addFrame: (frame) => set((state) => ({ frames: [...state.frames, frame] })),
  selectFrame: (id) => set({ selectedFrameId: id, isEditorOpen: true }),
  closeEditor: () => set({ selectedFrameId: null, isEditorOpen: false, pendingDeepChanges: {} }),
  setSceneFilter: (sceneId) => set({ activeSceneFilter: sceneId }),
  updateInstantParams: (frameId, params) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, instantParams: { ...f.instantParams, ...params } } : f
      ),
    })),
  setPendingDeepChange: (changes) =>
    set((state) => ({ pendingDeepChanges: { ...state.pendingDeepChanges, ...changes } })),
  applyDeepChanges: (frameId) => {
    const { pendingDeepChanges } = get();
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, deepParams: { ...f.deepParams, ...pendingDeepChanges } } : f
      ),
      pendingDeepChanges: {},
    }));
  },
  clearPendingChanges: () => set({ pendingDeepChanges: {} }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),
  reset: () =>
    set({ frames: [], selectedFrameId: null, isEditorOpen: false, activeSceneFilter: null, chatMessages: [], pendingDeepChanges: {} }),
}));
