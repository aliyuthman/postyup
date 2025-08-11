'use client';

import { useState, useRef } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
}

export default function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { photo } = useSupporterStore();


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
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-[#262626] rounded-full flex items-center justify-center border-2 border-[#404040] relative overflow-hidden">
                    {/* Default profile avatar */}
                    <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#737373]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    {/* Upload indicator overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
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

              <div className="grid gap-3 grid-cols-1">
                <button
                  onClick={openFileSelector}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-all duration-200 font-semibold min-h-[56px] shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}