'use client';

import { useState } from 'react';
import { useTemplateStore, Template } from '@/stores/templateStore';

interface TemplateGalleryProps {
  onTemplateSelect: (template: Template) => void;
  campaignId?: string;
}

export default function TemplateGallery({ onTemplateSelect }: TemplateGalleryProps) {
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
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

  const handleImageLoad = (templateId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [templateId]: false }));
  };

  const handleImageError = (templateId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [templateId]: false }));
    setImageErrors(prev => ({ ...prev, [templateId]: true }));
  };

  const handleImageStart = (templateId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [templateId]: true }));
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#262626] rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#404040] border-t-[#FAFAFA]"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#FAFAFA] mb-2">Loading Templates</h3>
          <p className="text-[#A3A3A3] text-sm sm:text-base">Finding the perfect designs for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-900/20 rounded-full">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#FAFAFA] mb-2">Failed to Load</h3>
          <p className="text-red-400 text-sm sm:text-base mb-4">Error loading templates: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#FAFAFA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-[#A3A3A3] uppercase tracking-wide">Template Gallery</span>
          </div>
          <p className="text-[#A3A3A3] text-sm">Choose your campaign poster</p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full sm:rounded-xl text-xs sm:text-sm font-medium transition-all min-h-[36px] sm:min-h-[44px] ${
                  selectedCategory === null
                    ? 'bg-[#FAFAFA] text-[#0A0A0A] shadow-lg'
                    : 'bg-[#262626] text-[#FAFAFA] hover:bg-[#404040] border border-[#404040]'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">All Templates</span>
                <span className="sm:hidden">All</span>
                <span className="bg-current bg-opacity-20 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                  {filteredTemplates.length}
                </span>
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full sm:rounded-xl text-xs sm:text-sm font-medium transition-all min-h-[36px] sm:min-h-[44px] ${
                    selectedCategory === category
                      ? 'bg-[#FAFAFA] text-[#0A0A0A] shadow-lg'
                      : 'bg-[#262626] text-[#FAFAFA] hover:bg-[#404040] border border-[#404040]'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`group relative cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-[#FAFAFA] shadow-2xl shadow-white/10'
                : 'hover:shadow-xl hover:shadow-black/20'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            {/* Template Image Container */}
            <div className="aspect-square relative bg-[#262626] rounded-xl sm:rounded-2xl overflow-hidden">
              {/* Loading State */}
              {imageLoadingStates[template.id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#262626]">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#404040] border-t-[#FAFAFA]"></div>
                </div>
              )}
              
              {/* Error State */}
              {imageErrors[template.id] ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#262626] text-[#737373]">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Preview unavailable</span>
                </div>
              ) : (
                <img
                  src={template.imageUrls.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  onLoadStart={() => handleImageStart(template.id)}
                  onLoad={() => handleImageLoad(template.id)}
                  onError={() => handleImageError(template.id)}
                />
              )}

              {/* Selection Overlay */}
              {selectedTemplate?.id === template.id && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                  <div className="absolute top-3 right-3">
                    <div className="bg-[#FAFAFA] text-[#0A0A0A] rounded-full p-2 shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-block bg-[#FAFAFA] text-[#0A0A0A] px-3 py-1 rounded-full text-xs font-semibold">
                      Selected
                    </span>
                  </div>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-white text-xs font-medium">Click to select</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-2 sm:p-3 bg-[#171717] rounded-b-xl sm:rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-[#FAFAFA] text-xs sm:text-sm truncate">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="text-xs text-[#737373]">{template.category}</p>
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="ml-1 sm:ml-2 flex-shrink-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#FAFAFA] rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#262626] rounded-full">
            <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#FAFAFA] mb-2">
            {selectedCategory ? `No ${selectedCategory} Templates` : 'No Templates Available'}
          </h3>
          <p className="text-[#A3A3A3] text-sm sm:text-base mb-4">
            {selectedCategory
              ? `We don't have any templates in the ${selectedCategory} category yet.`
              : 'Templates are being loaded. Please try again.'}
          </p>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View All Templates
            </button>
          )}
        </div>
      )}
    </div>
  );
}