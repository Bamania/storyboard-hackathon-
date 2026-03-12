import { create } from 'zustand';
import type { AppStep } from '../types';

interface NavigationState {
  currentStep: AppStep;
  completedSteps: AppStep[];
  setCurrentStep: (step: AppStep) => void;
  completeStep: (step: AppStep) => void;
  canNavigateTo: (step: AppStep) => boolean;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentStep: 1,
  completedSteps: [],
  setCurrentStep: (step) => set({ currentStep: step }),
  completeStep: (step) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),
  canNavigateTo: (step) => {
    const { completedSteps } = get();
    if (step === 1) return true;
    return completedSteps.includes((step - 1) as AppStep);
  },
  reset: () => set({ currentStep: 1, completedSteps: [] }),
}));
