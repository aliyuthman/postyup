import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Step = 'details' | 'photo' | 'template' | 'preview';

export interface FormErrors {
  name?: string;
  title?: string;
  photo?: string;
  template?: string;
}

export interface SessionState {
  currentStep: Step;
  sessionId: string;
  formErrors: FormErrors;
  isLoading: boolean;
  setCurrentStep: (step: Step) => void;
  setSessionId: (id: string) => void;
  setFormErrors: (errors: FormErrors) => void;
  setLoading: (loading: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const steps: Step[] = ['details', 'photo', 'template', 'preview'];

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentStep: 'details',
      sessionId: '',
      formErrors: {},
      isLoading: false,
      setCurrentStep: (step) => set({ currentStep: step }),
      setSessionId: (id) => set({ sessionId: id }),
      setFormErrors: (errors) => set({ formErrors: errors }),
      setLoading: (loading) => set({ isLoading: loading }),
      nextStep: () => {
        const { currentStep } = get();
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          set({ currentStep: steps[currentIndex + 1] });
        }
      },
      previousStep: () => {
        const { currentStep } = get();
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: steps[currentIndex - 1] });
        }
      },
      reset: () => set({
        currentStep: 'details',
        sessionId: '',
        formErrors: {},
        isLoading: false,
      }),
    }),
    {
      name: 'session-storage',
    }
  )
);