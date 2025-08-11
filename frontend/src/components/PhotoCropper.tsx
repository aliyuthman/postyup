'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSupporterStore } from '@/stores/supporterStore';

// Dynamically import AvatarEditor to avoid SSR issues
const AvatarEditor = dynamic(() => import('react-avatar-editor'), { ssr: false });

interface PhotoCropperProps {
  imageSrc: string;
  onCropComplete: () => void;
}

export default function PhotoCropper({ imageSrc, onCropComplete }: PhotoCropperProps) {
  const [scale, setScale] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const { setPhoto } = useSupporterStore();

  const handleSave = () => {
    if (editorRef.current) {
      setIsProcessing(true);
      
      // Get the cropped image as a canvas and convert to data URL
      const canvas = editorRef.current.getImageScaledToCanvas();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      console.log('Created cropped image:', {
        width: canvas.width,
        height: canvas.height,
        dataUrl: dataUrl.substring(0, 50) + '...'
      });
      
      setPreview(dataUrl);
      
      // Store the cropped image as base64 in Zustand
      setPhoto({
        url: dataUrl,
        file: undefined, // Clear the original file
      });
      
      setIsEditing(false);
      setIsProcessing(false);
      
      // Complete the crop process
      setTimeout(() => {
        onCropComplete();
      }, 100);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (!isEditing && preview) {
    return (
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="space-y-4">
          <div className="relative mx-auto w-64 h-64 overflow-hidden rounded-full border-4 border-[#404040]">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={handleEdit}
            className="w-full py-3 sm:py-4 bg-[#404040] text-[#FAFAFA] rounded-xl hover:bg-[#525252] transition-colors font-semibold min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
          >
            Edit Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="space-y-4">
        <div className="relative mx-auto overflow-hidden rounded-2xl border border-[#404040] bg-[#262626]">
          <AvatarEditor
            // @ts-expect-error - AvatarEditor ref not properly typed
            ref={editorRef}
            image={imageSrc}
            width={300}
            height={300}
            border={25}
            borderRadius={150} // Make it circular
            color={[38, 38, 38, 0.6]} // Semi-transparent background
            scale={scale}
            rotate={0}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#FAFAFA] mb-2">
            Zoom
          </label>
          <div className="relative">
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#404040] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #FAFAFA 0%, #FAFAFA ${((scale - 1) / 2) * 100}%, #404040 ${((scale - 1) / 2) * 100}%, #404040 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#A3A3A3] mt-1">
              <span>1x</span>
              <span>3x</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="w-full py-3 sm:py-4 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] disabled:bg-[#404040] disabled:text-[#A3A3A3] transition-colors font-semibold min-h-[44px] sm:min-h-[56px] text-sm sm:text-base flex items-center justify-center gap-2"
        >
          {isProcessing ? 'Processing...' : 'Apply Crop'}
        </button>
      </div>
    </div>
  );
}