'use client';

import { useRef, useEffect } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';
import { useTemplateStore } from '@/stores/templateStore';

interface PosterPreviewProps {
  width?: number;
  height?: number;
  showControls?: boolean;
  onGenerate?: () => void;
}

export default function PosterPreview({ 
  width = 400, 
  height = 400, 
  showControls = true,
  onGenerate 
}: PosterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { name, title, photo } = useSupporterStore();
  const { selectedTemplate } = useTemplateStore();

  useEffect(() => {
    if (selectedTemplate && canvasRef.current) {
      renderPreview();
    }
  }, [selectedTemplate, name, title, photo]);

  const renderPreview = async () => {
    if (!selectedTemplate || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    try {
      // Load template image
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve;
        templateImg.onerror = reject;
        templateImg.src = selectedTemplate.imageUrls.preview;
      });

      // Draw template background
      ctx.drawImage(templateImg, 0, 0, width, height);

      // Draw user photo if available
      if (photo.url && selectedTemplate.layoutConfig.photoZones.length > 0) {
        const photoZone = selectedTemplate.layoutConfig.photoZones[0];
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          userImg.onload = resolve;
          userImg.onerror = reject;
          userImg.src = photo.url!;
        });

        // Calculate photo position and size (based on 1080x1080 final size)
        const photoX = (photoZone.x / 1080) * width;
        const photoY = (photoZone.y / 1080) * height;
        const photoWidth = (photoZone.width / 1080) * width;
        const photoHeight = (photoZone.height / 1080) * height;

        // Save context for clipping
        ctx.save();
        
        // Create circular clip if borderRadius is specified
        if (photoZone.borderRadius) {
          ctx.beginPath();
          ctx.arc(
            photoX + photoWidth / 2,
            photoY + photoHeight / 2,
            Math.min(photoWidth, photoHeight) / 2,
            0,
            2 * Math.PI
          );
          ctx.clip();
        }

        // Draw photo
        ctx.drawImage(userImg, photoX, photoY, photoWidth, photoHeight);
        ctx.restore();
      }

      // Draw text overlays
      selectedTemplate.layoutConfig.textZones.forEach((textZone) => {
        let textContent = textZone.type === 'name' ? name : title;
        if (!textContent) return;

        // Apply text transformations
        const extendedTextZone = textZone as typeof textZone & { textTransform?: string; fontWeight?: string };
        if (extendedTextZone.textTransform === 'uppercase') {
          textContent = textContent.toUpperCase();
        }

        const textX = (textZone.x / 1080) * width;
        const textY = (textZone.y / 1080) * height;
        const fontSize = (textZone.fontSize / 1080) * width;

        // Build font string with weight
        const fontWeight = extendedTextZone.fontWeight || 'normal';
        ctx.font = `${fontWeight} ${fontSize}px ${textZone.fontFamily}`;
        ctx.fillStyle = textZone.color;
        ctx.textAlign = textZone.textAlign as CanvasTextAlign;

        // Handle text wrapping if needed
        const maxWidth = (textZone.width / 1080) * width;
        const lines = wrapText(ctx, textContent, maxWidth);
        
        lines.forEach((line, index) => {
          const lineHeight = fontSize * 1.3; // Improved line height for better readability
          const lineY = textY + (index * lineHeight);
          ctx.fillText(line, textX, lineY);
        });
      });

    } catch (error) {
      console.error('Error rendering preview:', error);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        // Check if single word is too long, break it character by character
        const singleWordMetrics = ctx.measureText(word);
        if (singleWordMetrics.width > maxWidth) {
          let partialWord = '';
          for (let i = 0; i < word.length; i++) {
            const testChar = partialWord + word[i];
            const charMetrics = ctx.measureText(testChar);
            if (charMetrics.width > maxWidth && partialWord) {
              lines.push(partialWord);
              partialWord = word[i];
            } else {
              partialWord = testChar;
            }
          }
          currentLine = partialWord;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  if (!selectedTemplate) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Select a template to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      {showControls && (
        <div className="mt-4 space-y-3">
          <div className="text-sm text-gray-600">
            <p><strong>Name:</strong> {name || 'Not set'}</p>
            <p><strong>Title:</strong> {title || 'Not set'}</p>
            <p><strong>Template:</strong> {selectedTemplate.name}</p>
          </div>
          
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={!name || !title || !photo.url}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
            >
              Generate Final Poster
            </button>
          )}
        </div>
      )}
    </div>
  );
}