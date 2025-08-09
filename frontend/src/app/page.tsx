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
      // Auto-detect API URL based on environment
      const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const apiUrl = isLocal ? 'http://localhost:3001' : (process.env.NEXT_PUBLIC_API_URL || 'https://postyup.up.railway.app');
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
    // Generate UUID for session ID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const sessionId = generateUUID();
    console.log('Generated session ID:', sessionId);
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
    console.log('Starting poster generation...');
    setGenerationStatus('generating');
    try {
      // Auto-detect API URL based on environment
      const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const apiUrl = isLocal ? 'http://localhost:3001' : (process.env.NEXT_PUBLIC_API_URL || 'https://postyup.up.railway.app');
      const templateId = useTemplateStore.getState().selectedTemplate?.id;
      const sessionId = useSessionStore.getState().sessionId;
      
      console.log('API URL:', apiUrl);
      console.log('Template ID:', templateId);
      console.log('Supporter data:', { name, title });
      console.log('Photo file:', photo.file);
      console.log('Session ID:', sessionId);

      // Check if photo file exists
      if (!photo.file) {
        throw new Error('No photo file available');
      }

      // First, upload the photo to get a server-accessible URL
      console.log('Uploading photo...');
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('sessionId', sessionId);

      const uploadResponse = await fetch(`${apiUrl}/api/photo/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        console.error('Photo upload failed:', uploadError);
        throw new Error(`Photo upload failed: ${uploadResponse.status} - ${uploadError}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Photo uploaded successfully:', uploadData.photoUrl);
      
      // Now generate the poster with the uploaded photo URL
      console.log('Generating poster...');
      const response = await fetch(`${apiUrl}/api/poster/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          supporterData: { name, title },
          photoUrl: uploadData.photoUrl,
          sessionId,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      console.log('Final poster URL:', data.finalUrl);
      
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[#FAFAFA]">Postyup</h1>
          <p className="text-[#A3A3A3] text-xs sm:text-sm mt-1">Create your political poster in minutes</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-[#171717] border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            {['Details', 'Photo', 'Template', 'Preview', 'Complete'].map((step, index) => {
              const stepNames: string[] = ['details', 'photo', 'template', 'preview', 'complete'];
              const isActive = stepNames[index] === currentStep;
              const isCompleted = stepNames.indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium ${
                      isCompleted
                        ? 'bg-[#FAFAFA] text-[#0A0A0A]'
                        : isActive
                        ? 'bg-[#737373] text-[#FAFAFA]'
                        : 'bg-[#404040] text-[#A3A3A3]'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-1 sm:ml-2 text-xs sm:text-sm ${isActive ? 'font-medium text-[#FAFAFA]' : 'text-[#A3A3A3]'} whitespace-nowrap`}>
                    {step}
                  </span>
                  {index < 4 && <div className="w-4 sm:w-8 h-0.5 bg-[#404040] mx-2 sm:mx-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentStep === 'details' && (
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Tell us about yourself</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Enter your details to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#FAFAFA] mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#262626] border border-[#404040] rounded-xl focus:ring-2 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] placeholder-[#A3A3A3] text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#FAFAFA] mb-2">
                  Your Title/Role *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Small Business Owner"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#262626] border border-[#404040] rounded-xl focus:ring-2 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] placeholder-[#A3A3A3] text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'photo' && (
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Add your photo</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Upload a clear photo of yourself</p>
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
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Choose your template</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Select a poster design that fits your campaign</p>
            </div>
            
            <TemplateGallery onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Preview your poster</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Review and generate your final poster</p>
            </div>
            
            <PosterPreview 
              showControls={true}
              onGenerate={handleGeneratePoster}
            />
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Your poster is ready!</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Download and share your professional poster</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <PosterPreview showControls={false} />
              <SocialShare />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#262626] space-y-3 sm:space-y-0">
          <button
            onClick={previousStep}
            disabled={currentStep === 'details'}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={!canProceed() || currentStep === 'complete'}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            {currentStep === 'preview' ? 'Generate Poster' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}