'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useSupporterStore } from '@/stores/supporterStore';
import { useTemplateStore, Template } from '@/stores/templateStore';
import { usePosterStore } from '@/stores/posterStore';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoCropper from '@/components/PhotoCropper';
import TemplateGallery from '@/components/TemplateGallery';
import PosterPreview from '@/components/PosterPreview';
import SocialShare from '@/components/SocialShare';

export default function Home() {
  const { currentStep, nextStep, previousStep, setSessionId } = useSessionStore();
  const { name, title, photo, setName, setTitle, setPhoto } = useSupporterStore();
  const { setSelectedTemplate, setTemplates, setLoading } = useTemplateStore();
  const { setFinalPosterUrl, setGenerationStatus } = usePosterStore();

  const [showCropper, setShowCropper] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/templates`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Set some mock templates for testing
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [setTemplates, setLoading]);

  useEffect(() => {
    // Generate session ID on mount
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(sessionId);

    // Load templates
    loadTemplates();
  }, [setSessionId, loadTemplates]);

  const handlePhotoSelected = (file: File) => {
    const url = URL.createObjectURL(file);
    setPhoto({ file, url });
    setShowCropper(true);
  };

  const handleCropComplete = () => {
    setShowCropper(false);
    nextStep();
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    nextStep();
  };

  const handleGeneratePoster = async () => {
    setGenerationStatus('generating');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Generate final poster through API
      const response = await fetch(`${apiUrl}/api/poster/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: useTemplateStore.getState().selectedTemplate?.id,
          supporterData: { name, title },
          photoUrl: photo.url,
          sessionId: useSessionStore.getState().sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setFinalPosterUrl(data.finalUrl);
      setGenerationStatus('completed');
      nextStep();
    } catch (error) {
      console.error('Poster generation failed:', error);
      setGenerationStatus('error');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return name.trim() && title.trim();
      case 'photo':
        return photo.url && !showCropper;
      case 'template':
        return useTemplateStore.getState().selectedTemplate;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Postyup</h1>
          <p className="text-gray-600 text-sm mt-1">Create your political poster in minutes</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            {['Details', 'Photo', 'Template', 'Preview', 'Complete'].map((step, index) => {
              const stepNames: string[] = ['details', 'photo', 'template', 'preview', 'complete'];
              const isActive = stepNames[index] === currentStep;
              const isCompleted = stepNames.indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                    {step}
                  </span>
                  {index < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'details' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Tell us about yourself</h2>
              <p className="text-gray-600">Enter your details to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Title/Role *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Small Business Owner"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'photo' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add your photo</h2>
              <p className="text-gray-600">Upload a clear photo of yourself</p>
            </div>
            
            {!showCropper ? (
              <PhotoUpload onPhotoSelected={handlePhotoSelected} />
            ) : (
              <PhotoCropper 
                imageSrc={photo.url!} 
                onCropComplete={handleCropComplete}
              />
            )}
          </div>
        )}

        {currentStep === 'template' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose your template</h2>
              <p className="text-gray-600">Select a poster design that fits your campaign</p>
            </div>
            
            <TemplateGallery onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Preview your poster</h2>
              <p className="text-gray-600">Review and generate your final poster</p>
            </div>
            
            <PosterPreview 
              showControls={true}
              onGenerate={handleGeneratePoster}
            />
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your poster is ready!</h2>
              <p className="text-gray-600">Download and share your professional poster</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <PosterPreview showControls={false} />
              <SocialShare />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            onClick={previousStep}
            disabled={currentStep === 'details'}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={!canProceed() || currentStep === 'complete'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            {currentStep === 'preview' ? 'Generate Poster' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}