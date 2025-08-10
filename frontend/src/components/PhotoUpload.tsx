'use client';

import { useState, useRef } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
}

export default function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
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

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      onPhotoSelected(file);
    } else {
      alert('Please select an image file');
    }
  };

  const openFileSelector = () => {
    inputRef.current?.click();
  };

  const handleCameraCapture = () => {
    if (inputRef.current) {
      // Set capture attribute for mobile camera
      inputRef.current.setAttribute('capture', 'environment');
      inputRef.current.setAttribute('accept', 'image/*');
      inputRef.current.click();
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors ${
          dragActive
            ? 'border-[#737373] bg-[#262626]'
            : 'border-[#404040] hover:border-[#525252]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {photo.url ? (
          <div className="space-y-4">
            <img
              src={photo.url}
              alt="Selected photo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl mx-auto"
            />
            <button
              onClick={openFileSelector}
              className="px-4 py-2 text-sm bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium"
            >
              Change Photo
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-[#737373]">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-base sm:text-lg font-medium text-[#FAFAFA] mb-2">
                Add your photo
              </p>
              <p className="text-xs sm:text-sm text-[#A3A3A3] mb-3 sm:mb-4">
                Drag and drop or click to browse
              </p>
              <div className="flex flex-col gap-2 justify-center">
                {isMobile() ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={openFileSelector}
                      className="flex items-center justify-center gap-2 px-3 py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium min-h-[44px] text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Gallery
                    </button>
                    <button
                      onClick={handleCameraCapture}
                      className="flex items-center justify-center gap-2 px-3 py-3 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] transition-colors font-medium min-h-[44px] text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Camera
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openFileSelector}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-medium min-h-[44px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}