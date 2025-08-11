import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PhotoData {
  file?: File;
  url?: string;
}

export interface SupporterState {
  name: string;
  title: string;
  photo: PhotoData;
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  setPhoto: (photo: PhotoData) => void;
  reset: () => void;
}

const initialState = {
  name: '',
  title: '',
  photo: {},
};

export const useSupporterStore = create<SupporterState>()(
  persist(
    (set) => ({
      ...initialState,
      setName: (name) => set({ name }),
      setTitle: (title) => set({ title }),
      setPhoto: (photo) => set({ photo }),
      reset: () => set(initialState),
    }),
    {
      name: 'supporter-storage',
    }
  )
);