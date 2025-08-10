import { create } from 'zustand';

// Four-coordinate system for precise text positioning
export interface TextCoordinates {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

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
      // Four-coordinate system (new)
      coordinates?: TextCoordinates;
      // Legacy system (backward compatibility)
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
    // Show all templates
    const filteredTemplates = templates;
    
    // Define all available categories (including those that may be empty)
    const predefinedCategories = ['Endorsement', 'Campaign', 'Event', 'Announcement'];
    const templateCategories = [...new Set(filteredTemplates.map(t => t.category))];
    const allCategories = [...new Set([...predefinedCategories, ...templateCategories])];
    
    // Auto-select the first template if available
    const selectedTemplate = filteredTemplates.length > 0 ? filteredTemplates[0] : null;
    
    set({ templates: filteredTemplates, categories: allCategories, selectedTemplate });
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