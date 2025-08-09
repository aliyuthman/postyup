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
        <div className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#FAFAFA] mx-auto"></div>
          <p className="mt-4 text-[#A3A3A3] text-sm sm:text-base">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-6 sm:py-8">
          <p className="text-red-400 text-sm sm:text-base">Error loading templates: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Category Filter */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-[#FAFAFA] mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[40px] sm:min-h-[44px] ${
              selectedCategory === null
                ? 'bg-[#FAFAFA] text-[#0A0A0A]'
                : 'bg-[#404040] text-[#FAFAFA] hover:bg-[#525252]'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[40px] sm:min-h-[44px] ${
                selectedCategory === category
                  ? 'bg-[#FAFAFA] text-[#0A0A0A]'
                  : 'bg-[#404040] text-[#FAFAFA] hover:bg-[#525252]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
              selectedTemplate?.id === template.id
                ? 'border-[#FAFAFA] ring-2 ring-[#737373]'
                : 'border-[#404040] hover:border-[#525252]'
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
                <div className="absolute inset-0 bg-[#0A0A0A] bg-opacity-50 flex items-center justify-center">
                  <div className="bg-[#FAFAFA] text-[#0A0A0A] rounded-full p-2">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
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
            <div className="p-2 sm:p-3">
              <h4 className="font-medium text-[#FAFAFA] text-xs sm:text-sm truncate">
                {template.name}
              </h4>
              <p className="text-xs text-[#A3A3A3] mt-1">{template.category}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-[#A3A3A3] text-sm sm:text-base">
            {selectedCategory
              ? `No templates found in ${selectedCategory} category`
              : 'No templates available'}
          </p>
        </div>
      )}
    </div>
  );
}