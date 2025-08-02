import { create } from 'zustand';

export interface PosterState {
  generationStatus: 'idle' | 'generating' | 'completed' | 'error';
  previewUrl: string | null;
  finalPosterUrl: string | null;
  error: string | null;
  setGenerationStatus: (status: 'idle' | 'generating' | 'completed' | 'error') => void;
  setPreviewUrl: (url: string | null) => void;
  setFinalPosterUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePosterStore = create<PosterState>((set) => ({
  generationStatus: 'idle',
  previewUrl: null,
  finalPosterUrl: null,
  error: null,
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setFinalPosterUrl: (url) => set({ finalPosterUrl: url }),
  setError: (error) => set({ error }),
  reset: () => set({
    generationStatus: 'idle',
    previewUrl: null,
    finalPosterUrl: null,
    error: null,
  }),
}));