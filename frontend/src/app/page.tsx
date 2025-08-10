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
    // Auto-advance to details step after a brief moment to show completion
    setTimeout(() => {
      nextStep();
    }, 500);
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
        <div className="fixed inset-0 bg-[#0A0A0A] bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-[#171717] rounded-2xl p-8 border border-[#262626] max-w-md mx-4 text-center">
            {generationStatus === 'generating' ? (
              <>
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#404040] border-t-[#FAFAFA] mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#FAFAFA] rounded-full opacity-20 animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-[#FAFAFA] text-xl font-semibold mb-2">Creating Your Poster</h3>
                <div className="space-y-2 text-sm text-[#A3A3A3]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Processing your photo</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Rendering text layers</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-[#404040] rounded-full"></div>
                    <span>Generating high-quality output</span>
                  </div>
                </div>
                <p className="text-[#737373] text-xs mt-4">This usually takes 10-15 seconds</p>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-[#FAFAFA] text-xl font-semibold mb-2">Poster Ready!</h3>
                <p className="text-[#A3A3A3] text-sm">Your high-quality 1080×1080 poster has been generated successfully</p>
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
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Template Context */}
            {useTemplateStore.getState().selectedTemplate && (
              <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#404040] flex-shrink-0">
                    <img 
                      src={useTemplateStore.getState().selectedTemplate!.imageUrls.thumbnail} 
                      alt="Template preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#FAFAFA] text-sm">
                      {useTemplateStore.getState().selectedTemplate!.name}
                    </h3>
                    <p className="text-[#A3A3A3] text-xs mt-1">
                      Your photo will appear in the circular area
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">Your Details</h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">Watch your poster come to life as you type</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Form Section */}
              <div className="order-2 lg:order-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#FAFAFA]">
                      Your Name *
                    </label>
                    <span className={`text-xs ${name.length > 25 ? 'text-yellow-400' : 'text-[#A3A3A3]'}`}>
                      {name.length}/30
                    </span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    maxLength={30}
                    onChange={(e) => {
                      setName(e.target.value);
                      // Auto-advance when both fields are filled
                      if (e.target.value.trim().length >= 2 && title.trim().length >= 2) {
                        setTimeout(() => nextStep(), 1000);
                      }
                    }}
                    placeholder={useTemplateStore.getState().selectedTemplate?.category === 'Endorsement' ? 'Sarah Johnson' : 'Alex Smith'}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#262626] border border-[#404040] rounded-xl focus:ring-2 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] placeholder-[#A3A3A3] text-sm sm:text-base"
                  />
                  <p className="text-xs text-[#A3A3A3] mt-1">Keep it short for best appearance</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#FAFAFA]">
                      Your Title/Role *
                    </label>
                    <span className={`text-xs ${title.length > 35 ? 'text-yellow-400' : 'text-[#A3A3A3]'}`}>
                      {title.length}/40
                    </span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    maxLength={40}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      // Auto-advance when both fields are filled
                      if (name.trim().length >= 2 && e.target.value.trim().length >= 2) {
                        setTimeout(() => nextStep(), 1000);
                      }
                    }}
                    placeholder={useTemplateStore.getState().selectedTemplate?.category === 'Endorsement' ? 'Local Business Owner' : 'Community Leader'}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#262626] border border-[#404040] rounded-xl focus:ring-2 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] placeholder-[#A3A3A3] text-sm sm:text-base"
                  />
                  <p className="text-xs text-[#A3A3A3] mt-1">Describe your role or occupation</p>
                </div>

                {/* Progress Indicator */}
                <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${name.trim().length >= 2 ? 'bg-green-500' : 'bg-[#404040]'}`} />
                    <span className={`text-sm ${name.trim().length >= 2 ? 'text-green-400' : 'text-[#A3A3A3]'}`}>Name added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${title.trim().length >= 2 ? 'bg-green-500' : 'bg-[#404040]'}`} />
                    <span className={`text-sm ${title.trim().length >= 2 ? 'text-green-400' : 'text-[#A3A3A3]'}`}>Title added</span>
                  </div>
                  {name.trim().length >= 2 && title.trim().length >= 2 && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Moving to preview...
                    </p>
                  )}
                </div>
              </div>

              {/* Live Preview Section */}
              <div className="order-1 lg:order-2">
                <div className="bg-[#171717] rounded-xl p-4 border border-[#262626] sticky top-4">
                  <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">Live Preview</h3>
                  <PosterPreview width={300} height={300} showControls={false} />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">
                {finalPosterUrl ? 'Your poster is ready!' : 'Preview & Generate'}
              </h2>
              <p className="text-[#A3A3A3] text-sm sm:text-base">
                {finalPosterUrl 
                  ? 'Download your high-quality 1080x1080 poster' 
                  : 'Review your poster and generate the final version'}
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Preview Section */}
                <div className="order-2 lg:order-1">
                  <PosterPreview 
                    showControls={!finalPosterUrl}
                    onGenerate={handleGeneratePoster}
                  />
                </div>

                {/* Quick Edit Section */}
                <div className="order-1 lg:order-2 space-y-4">
                  {!finalPosterUrl ? (
                    <>
                      <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                        <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">Quick Edit</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Name</label>
                            <input
                              type="text"
                              value={name}
                              maxLength={30}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg focus:ring-1 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Title</label>
                            <input
                              type="text"
                              value={title}
                              maxLength={40}
                              onChange={(e) => setTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg focus:ring-1 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                        <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">Generation Details</h3>
                        <div className="space-y-2 text-xs text-[#A3A3A3]">
                          <div className="flex justify-between">
                            <span>Template:</span>
                            <span className="text-[#FAFAFA]">{useTemplateStore.getState().selectedTemplate?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Resolution:</span>
                            <span className="text-[#FAFAFA]">1080 × 1080px</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span className="text-[#FAFAFA]">PNG</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quality:</span>
                            <span className="text-green-400">High</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <SocialShare />
                      
                      <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
                        <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">Need Changes?</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Name</label>
                            <input
                              type="text"
                              value={name}
                              maxLength={30}
                              onChange={(e) => {
                                setName(e.target.value);
                                // Clear current poster when editing
                                setFinalPosterUrl('');
                                setGenerationStatus('idle');
                              }}
                              className="w-full px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg focus:ring-1 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Title</label>
                            <input
                              type="text"
                              value={title}
                              maxLength={40}
                              onChange={(e) => {
                                setTitle(e.target.value);
                                // Clear current poster when editing
                                setFinalPosterUrl('');
                                setGenerationStatus('idle');
                              }}
                              className="w-full px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg focus:ring-1 focus:ring-[#737373] focus:border-[#737373] text-[#FAFAFA] text-sm"
                            />
                          </div>
                          <button
                            onClick={handleGeneratePoster}
                            disabled={!name || !title || !photo.url}
                            className="w-full py-2 bg-[#FAFAFA] text-[#0A0A0A] rounded-lg hover:bg-[#E5E5E5] disabled:bg-[#404040] disabled:text-[#737373] disabled:cursor-not-allowed transition-colors font-medium text-sm"
                          >
                            Regenerate Poster
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Navigation - Only show for preview step */}
        {currentStep === 'preview' && finalPosterUrl && (
          <div className="flex justify-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#262626]">
            <button
              onClick={() => {
                // Clear poster and restart
                usePosterStore.getState().reset();
                useSessionStore.getState().reset();
                useSupporterStore.getState().reset();
                useTemplateStore.getState().setSelectedTemplate(null);
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] transition-colors font-medium min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}