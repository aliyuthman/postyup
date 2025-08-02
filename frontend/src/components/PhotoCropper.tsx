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
    (croppedArea: any, croppedAreaPixels: any) => {
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
    <div className="w-full max-w-md mx-auto">
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
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
        />
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation
          </label>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={onCropComplete}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
        >
          Confirm Crop
        </button>
      </div>
    </div>
  );
}