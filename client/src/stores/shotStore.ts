import { create } from 'zustand';
import type { AgentMessage } from '../types';

interface ShotState {
  messages: AgentMessage[];
  currentSceneIndex: number;
  completedScenes: number[];
  totalScenes: number;
  isDebating: boolean;
  isComplete: boolean;
  addMessage: (message: AgentMessage) => void;
  completeScene: (sceneIndex: number) => void;
  setCurrentScene: (index: number) => void;
  setIsDebating: (debating: boolean) => void;
  setComplete: () => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useShotStore = create<ShotState>((set) => ({
  messages: [],
  currentSceneIndex: 0,
  completedScenes: [],
  totalScenes: 8,
  isDebating: false,
  isComplete: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  completeScene: (sceneIndex) => set((state) => ({ completedScenes: [...state.completedScenes, sceneIndex] })),
  setCurrentScene: (index) => set({ currentSceneIndex: index }),
  setIsDebating: (debating) => set({ isDebating: debating }),
  setComplete: () => set({ isComplete: true }),
  clearMessages: () => set({ messages: [] }),
  reset: () => set({ messages: [], currentSceneIndex: 0, completedScenes: [], isDebating: false, isComplete: false }),
}));
