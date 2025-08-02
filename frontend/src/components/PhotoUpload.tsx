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
      inputRef.current.setAttribute('capture', 'environment');
      inputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
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
              className="w-32 h-32 object-cover rounded-lg mx-auto"
            />
            <button
              onClick={openFileSelector}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Change Photo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-400">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Add your photo
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to browse
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={openFileSelector}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
                >
                  Choose File
                </button>
                <button
                  onClick={handleCameraCapture}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium min-h-[44px]"
                >
                  Take Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}