'use client';

import { useState, useRef, useEffect } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
}

export default function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { photo } = useSupporterStore();

  // Check for camera support on mount
  useEffect(() => {
    const checkCameraSupport = () => {
      try {
        // Check if we have media devices API and basic camera support
        const hasMediaDevices = typeof navigator !== 'undefined' && 
          navigator.mediaDevices && 
          typeof navigator.mediaDevices.getUserMedia === 'function';
        
        if (hasMediaDevices) {
          // Check if it's likely a mobile device or has touch capability
          const isMobileDevice = typeof navigator !== 'undefined' && 
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const hasTouchScreen = typeof window !== 'undefined' && 
            ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
          
          setHasCamera(Boolean(isMobileDevice || hasTouchScreen));
        } else {
          setHasCamera(false);
        }
      } catch {
        setHasCamera(false);
      }
    };
    
    checkCameraSupport();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      onPhotoSelected(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const openFileSelector = () => {
    if (inputRef.current) {
      inputRef.current.value = ''; // Clear previous selection
      inputRef.current.click();
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''; // Clear previous selection
      cameraInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {photo.url ? (
        // Selected photo state
        <div className="space-y-4">
          <div className="relative">
            <img
              src={photo.url}
              alt="Selected photo"
              className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl mx-auto border-2 border-[#404040]"
            />
            <div className="absolute top-2 right-2 bg-[#0A0A0A] bg-opacity-80 rounded-full p-1">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-3">
            <p className="text-sm text-[#A3A3A3]">Photo ready for cropping</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={openFileSelector}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#404040] text-[#FAFAFA] rounded-lg hover:bg-[#525252] transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Change Photo
              </button>
              {hasCamera && (
                <button
                  onClick={handleCameraCapture}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#404040] text-[#FAFAFA] rounded-lg hover:bg-[#525252] transition-colors font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take New
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload state
        <div className="space-y-6">
          {/* Drag and drop area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-[#FAFAFA] bg-[#171717] scale-[1.02]'
                : 'border-[#404040] hover:border-[#525252] hover:bg-[#0F0F0F]'
            } ${isUploading ? 'border-[#FAFAFA] bg-[#171717]' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#404040] border-t-[#FAFAFA] mx-auto mb-4"></div>
                <p className="text-[#FAFAFA] font-medium">Processing photo...</p>
                <p className="text-[#A3A3A3] text-sm mt-1">Please wait</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-[#262626] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#FAFAFA] mb-2">Add Your Photo</h3>
                  <p className="text-sm text-[#A3A3A3] mb-1">
                    Drag and drop your photo here
                  </p>
                  <p className="text-xs text-[#737373]">
                    Supports JPG, PNG • Max 10MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          {!isUploading && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#404040]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#0A0A0A] text-xs text-[#737373] uppercase tracking-wider">
                    Or choose file
                  </span>
                </div>
              </div>

              <div className={`grid gap-3 ${hasCamera ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={openFileSelector}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-all duration-200 font-semibold min-h-[56px] shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Browse Files
                </button>
                
                {hasCamera && (
                  <button
                    onClick={handleCameraCapture}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-[#262626] text-[#FAFAFA] rounded-xl hover:bg-[#404040] transition-all duration-200 font-semibold min-h-[56px] border border-[#404040] hover:border-[#525252]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </button>
                )}
              </div>

              {hasCamera && (
                <p className="text-center text-xs text-[#737373] mt-3">
                  📱 Camera detected - you can take a photo directly
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}