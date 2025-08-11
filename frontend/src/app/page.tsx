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
  const { setFinalPosterUrl, setGenerationStatus, generationStatus, finalPosterUrl } = usePosterStore();

  const [showCropper, setShowCropper] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

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
    // Clear all stores on fresh page load (but preserve on navigation)
    const hasJustRefreshed = !sessionStorage.getItem('app-initialized');
    
    if (hasJustRefreshed) {
      // Clear all stores on page refresh
      useSessionStore.getState().reset();
      useSupporterStore.getState().reset();
      useTemplateStore.getState().setSelectedTemplate(null);
      usePosterStore.getState().setFinalPosterUrl('');
      usePosterStore.getState().setGenerationStatus('idle');
      
      // Mark app as initialized
      sessionStorage.setItem('app-initialized', 'true');
    }

    // Generate UUID for session ID if not exists
    if (!useSessionStore.getState().sessionId) {
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
    }

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
      
      // Clear success state after a moment - user stays on preview
      setTimeout(() => {
        setGenerationStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Poster generation failed:', error);
      setGenerationStatus('error');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return useTemplateStore.getState().selectedTemplate;
      case 'photo':
        return photo.url && !showCropper;
      case 'details':
        return name.trim().length >= 2 && title.trim().length >= 2;
      case 'preview':
        return false; // No next step from preview
      default:
        return true;
    }
  };


  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      {/* Loading/Success Overlay */}
      {(generationStatus === 'generating' || generationStatus === 'completed') && (
        <div className="fixed inset-0 bg-[#0A0A0A] bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-auto border border-[#262626] text-center">
            {generationStatus === 'generating' ? (
              <>
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#404040] border-t-[#FAFAFA] mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#FAFAFA] rounded-full opacity-20 animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#FAFAFA] mb-2">Creating Your Poster</h3>
                <p className="text-[#A3A3A3] text-sm mb-4 leading-relaxed">
                  We&apos;re processing your photo and generating a high-quality 2000×2000 poster. This usually takes 15-30 seconds.
                </p>
                <div className="bg-[#262626] rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-[#737373]">
                    <div className="w-2 h-2 bg-[#FAFAFA] rounded-full animate-pulse"></div>
                    <span>Please keep this tab open</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#FAFAFA] mb-2">Poster Ready!</h3>
                <p className="text-[#A3A3A3] text-sm">
                  Your professional poster has been generated successfully and is ready for download.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-[#171717] border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <img 
                src="/PNG/light-bg-logo.png" 
                alt="Postyup Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#FAFAFA]">Postyup</h1>
              <p className="text-[#A3A3A3] text-xs sm:text-sm mt-0.5">Create political posters</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar - Hide on template step */}
      {currentStep !== 'template' && (
        <div className="bg-[#171717] border-b border-[#262626]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              {['Photo', 'Details', 'Preview'].map((step, index) => {
                const stepNames: string[] = ['photo', 'details', 'preview'];
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
                    {index < 2 && <div className="w-4 sm:w-8 h-0.5 bg-[#404040] mx-2 sm:mx-4" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentStep === 'template' && (
          <div className="space-y-4 sm:space-y-6">
            <TemplateGallery onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        {currentStep === 'photo' && (
          <div className="w-full max-w-lg mx-auto space-y-6 px-4">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Add Photo</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">
                {!showCropper ? 'Upload a clear photo of yourself' : 'Crop your photo to fit perfectly'}
              </p>
            </div>
            
            {!showCropper ? (
              <PhotoUpload onPhotoSelected={handlePhotoSelected} />
            ) : (
              <div className="space-y-4">
                <PhotoCropper 
                  imageSrc={photo.url!} 
                  onCropComplete={handleCropComplete}
                />
                <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#FAFAFA] mb-1">Cropping Tips</p>
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">
                        Position your face in the center of the circle. Your photo will be used to create a professional poster.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'details' && (
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Your Details</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Enter your information</p>
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

        {currentStep === 'preview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">
                {finalPosterUrl ? 'Your poster is ready!' : 'Preview your poster'}
              </h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">
                {finalPosterUrl 
                  ? 'Download and share your professional poster' 
                  : 'Review and generate your final poster'}
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              {/* Debug Toggle */}
              <div className="flex justify-center">
                <button
                  onClick={() => setDebugMode(!debugMode)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    debugMode 
                      ? 'bg-red-600 text-white' 
                      : 'bg-[#404040] text-[#A3A3A3] hover:bg-[#505050]'
                  }`}
                >
                  {debugMode ? '🐛 Debug ON' : 'Debug Mode'}
                </button>
              </div>
              
              <PosterPreview 
                showControls={!finalPosterUrl}
                onGenerate={handleGeneratePoster}
                debugMode={debugMode}
              />
              {finalPosterUrl && <SocialShare />}
            </div>
          </div>
        )}


        {/* Navigation */}
        {currentStep !== 'template' && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#262626] space-y-3 sm:space-y-0">
            <button
              onClick={previousStep}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] transition-colors font-medium min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            {currentStep === 'preview' && finalPosterUrl ? (
              <button
                onClick={() => {
                  // Clear poster and restart
                  usePosterStore.getState().reset();
                  useSessionStore.getState().reset();
                  useSupporterStore.getState().reset();
                  useTemplateStore.getState().setSelectedTemplate(null);
                }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start Over
              </button>
            ) : currentStep !== 'preview' ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}