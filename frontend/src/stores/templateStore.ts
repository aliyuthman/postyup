import { create } from 'zustand';

export interface Template {
  id: string;
  name: string;
  category: string;
  imageUrls: {
    thumbnail: string;
    preview: string;
    full: string;
  };
  layoutConfig: {
    textZones: Array<{
      type: 'name' | 'title';
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      fontFamily: string;
      fontWeight?: string;
      color: string;
      textAlign: string;
      textTransform?: string;
    }>;
    photoZones: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      borderRadius?: number;
    }>;
  };
  createdAt: string;
}

export interface TemplateState {
  templates: Template[];
  selectedTemplate: Template | null;
  categories: string[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredTemplates: () => Template[];
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
  setTemplates: (templates) => {
    const categories = [...new Set(templates.map(t => t.category))];
    set({ templates, categories });
  },
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  getFilteredTemplates: () => {
    const { templates, selectedCategory } = get();
    if (!selectedCategory) return templates;
    return templates.filter(t => t.category === selectedCategory);
  },
}));