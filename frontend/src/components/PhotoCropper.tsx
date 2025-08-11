'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useSupporterStore } from '@/stores/supporterStore';

interface PhotoCropperProps {
  imageSrc: string;
  onCropComplete: () => void;
}

export default function PhotoCropper({ imageSrc, onCropComplete }: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const { setCropData } = useSupporterStore();

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteHandler = useCallback(
    (croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      setCropData(
        {
          x: crop.x,
          y: crop.y,
          width: croppedArea.width,
          height: croppedArea.height,
        },
        croppedAreaPixels
      );
    },
    [crop, setCropData]
  );

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-[#262626] rounded-2xl overflow-hidden border border-[#404040]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropCompleteHandler}
          showGrid={false}
          cropShape="round"
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              position: 'relative'
            },
            cropAreaStyle: {
              border: '2px solid #FAFAFA',
              borderRadius: '50%'
            },
            mediaStyle: {
              width: '100%',
              height: '100%'
            }
          }}
        />
      </div>

      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#FAFAFA] mb-2">
            Zoom
          </label>
          <div className="relative">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-[#404040] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #FAFAFA 0%, #FAFAFA ${((zoom - 1) / 2) * 100}%, #404040 ${((zoom - 1) / 2) * 100}%, #404040 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#A3A3A3] mt-1">
              <span>1x</span>
              <span>3x</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#FAFAFA] mb-2">
            Rotation
          </label>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-2 bg-[#404040] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #FAFAFA 0%, #FAFAFA ${(rotation / 360) * 100}%, #404040 ${(rotation / 360) * 100}%, #404040 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#A3A3A3] mt-1">
              <span>0°</span>
              <span>360°</span>
            </div>
          </div>
        </div>

        <button
          onClick={onCropComplete}
          className="w-full py-3 sm:py-4 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] transition-colors font-semibold min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
        >
          Confirm Crop
        </button>
      </div>
    </div>
  );
}