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

  const getValidationMessage = () => {
    switch (currentStep) {
      case 'template':
        if (!useTemplateStore.getState().selectedTemplate) return 'Please select a template';
        return '';
      case 'photo':
        if (!photo.url) return 'Please upload a photo';
        if (showCropper) return 'Please complete photo cropping';
        return '';
      case 'details':
        if (!name.trim()) return 'Please enter your name';
        if (name.trim().length < 2) return 'Name must be at least 2 characters';
        if (!title.trim()) return 'Please enter your title/role';
        if (title.trim().length < 2) return 'Title must be at least 2 characters';
        return '';
      case 'preview':
        return ''; // No validation needed on final step
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      {/* Loading/Success Overlay */}
      {(generationStatus === 'generating' || generationStatus === 'completed') && (
        <div className="fixed inset-0 bg-[#0A0A0A] bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            {generationStatus === 'generating' ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FAFAFA] mx-auto mb-4"></div>
                <p className="text-[#FAFAFA] text-lg font-medium">Generating your poster...</p>
                <p className="text-[#A3A3A3] text-sm mt-2">This may take a few moments</p>
              </>
            ) : (
              <>
                <div className="bg-green-500 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#FAFAFA] text-lg font-medium">Poster generated successfully!</p>
                <p className="text-[#A3A3A3] text-sm mt-2">Redirecting you to download...</p>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-[#171717] border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FAFAFA] p-2 rounded-lg">
              <svg className="w-6 h-6 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#FAFAFA]">Postyup</h1>
              <p className="text-[#A3A3A3] text-xs sm:text-sm mt-0.5">Create political posters</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-[#171717] border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            {['Template', 'Photo', 'Details', 'Preview'].map((step, index) => {
              const stepNames: string[] = ['template', 'photo', 'details', 'preview'];
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
                  {index < 3 && <div className="w-4 sm:w-8 h-0.5 bg-[#404040] mx-2 sm:mx-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentStep === 'template' && (
          <div className="space-y-4 sm:space-y-6">
            <TemplateGallery onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        {currentStep === 'photo' && (
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Add Photo</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Upload your photo</p>
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
            
            <div className="max-w-md mx-auto">
              <PosterPreview 
                showControls={!finalPosterUrl}
                onGenerate={handleGeneratePoster}
              />
              {finalPosterUrl && <SocialShare />}
            </div>
          </div>
        )}

        {/* Validation Message */}
        {!canProceed() && getValidationMessage() && (
          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-200 text-sm">{getValidationMessage()}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#262626] space-y-3 sm:space-y-0">
          <button
            onClick={previousStep}
            disabled={currentStep === 'template'}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
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
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] transition-colors font-medium min-h-[44px]"
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
      </main>
    </div>
  );
}