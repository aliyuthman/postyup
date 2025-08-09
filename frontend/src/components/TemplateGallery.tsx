'use client';

import { useTemplateStore, Template } from '@/stores/templateStore';

interface TemplateGalleryProps {
  onTemplateSelect: (template: Template) => void;
  campaignId?: string;
}

export default function TemplateGallery({ onTemplateSelect }: TemplateGalleryProps) {
  const {
    selectedTemplate,
    categories,
    selectedCategory,
    isLoading,
    error,
    setSelectedCategory,
    getFilteredTemplates,
  } = useTemplateStore();

  const filteredTemplates = getFilteredTemplates();

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading templates: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="aspect-square relative">
              <img
                src={template.imageUrls.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-blue-600 text-white rounded-full p-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="font-medium text-gray-800 text-sm truncate">
                {template.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">{template.category}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {selectedCategory
              ? `No templates found in ${selectedCategory} category`
              : 'No templates available'}
          </p>
        </div>
      )}
    </div>
  );
}