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
  }, [selectedTemplate, name, title, photo, width, height]);

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

      // Calculate name line count for dynamic spacing
      let nameLineCount = 1;
      const nameZone = selectedTemplate.layoutConfig.textZones.find(zone => zone.type === 'name');
      if (nameZone && name) {
        const nameContent = nameZone.textTransform === 'uppercase' ? name.toUpperCase() : name;
        const nameWidth = (nameZone.width / 1080) * width;
        // Increase base font size significantly - multiply by 1.4x for larger text
        const baseFontSize = nameZone.fontSize * width * 1.4;
        const nameFontSize = Math.max(baseFontSize, 18); // Minimum 18px instead of 12px
        
        // Create temporary context to measure
        ctx.save();
        const fontWeight = nameZone.fontWeight || 'normal';
        ctx.font = `${fontWeight} ${nameFontSize}px ${nameZone.fontFamily}`;
        
        const lines = smartWrapText(ctx, nameContent, nameWidth);
        nameLineCount = lines.length;
        ctx.restore();
      }

      // Draw text overlays with dynamic spacing
      selectedTemplate.layoutConfig.textZones.forEach((textZone) => {
        let textContent = textZone.type === 'name' ? name : title;
        if (!textContent) return;

        // Apply text transformations
        const extendedTextZone = textZone as typeof textZone & { textTransform?: string; fontWeight?: string };
        if (extendedTextZone.textTransform === 'uppercase') {
          textContent = textContent.toUpperCase();
        }

        const textX = (textZone.x / 1080) * width;
        let textY = (textZone.y / 1080) * height;
        
        // Increase font sizes significantly
        let baseFontSize;
        if (textZone.type === 'name') {
          // Name gets 1.4x larger font
          baseFontSize = textZone.fontSize * width * 1.4;
        } else {
          // Title gets 1.2x larger font
          baseFontSize = textZone.fontSize * width * 1.2;
        }
        const fontSize = Math.max(baseFontSize, textZone.type === 'name' ? 18 : 16);

        // Dynamic vertical spacing for title based on name line count
        if (textZone.type === 'title') {
          const baseSpacing = (74.63 / 1080) * height;
          const tightSpacing = (25 / 1080) * height; // Much tighter for single-line
          const mediumSpacing = (45 / 1080) * height; // Medium for 2-line names
          
          if (nameLineCount === 1) {
            // Single line name - bring title much closer
            textY = textY - (baseSpacing - tightSpacing);
          } else if (nameLineCount === 2) {
            // Two line name - medium spacing
            textY = textY - (baseSpacing - mediumSpacing);
          }
          // For 3+ lines, keep original spacing
        }

        // Build font string with weight
        const fontWeight = extendedTextZone.fontWeight || 'normal';
        ctx.font = `${fontWeight} ${fontSize}px ${textZone.fontFamily}`;
        ctx.fillStyle = textZone.color;
        ctx.textAlign = textZone.textAlign as CanvasTextAlign;

        // Handle text wrapping with smart breaking
        const maxWidth = (textZone.width / 1080) * width;
        const lines = textZone.type === 'name' ? smartWrapText(ctx, textContent, maxWidth) : wrapText(ctx, textContent, maxWidth);
        
        lines.forEach((line, index) => {
          // Dynamic line height based on text type and size
          const lineHeightMultiplier = textZone.type === 'name' ? 1.25 : 1.3;
          const lineHeight = fontSize * lineHeightMultiplier;
          const lineY = textY + (index * lineHeight);
          ctx.fillText(line, textX, lineY);
        });
      });

    } catch (error) {
      console.error('Error rendering preview:', error);
    }
  };

  // Smart text wrapping for names - tries to break at better points
  const smartWrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    if (words.length === 1) {
      // Single word - use regular wrapping
      return wrapText(ctx, text, maxWidth);
    }
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        // Try to balance lines better for names
        if (words.length === 2) {
          // For 2 words, check if first word alone is too long
          const firstWordMetrics = ctx.measureText(words[0]);
          if (firstWordMetrics.width < maxWidth * 0.7) {
            // First word is reasonable, put each word on its own line
            lines.push(words[0]);
            lines.push(words[1]);
            return lines;
          }
        }
        
        lines.push(currentLine);
        currentLine = word;
        
        // Handle overly long single words
        const singleWordMetrics = ctx.measureText(word);
        if (singleWordMetrics.width > maxWidth) {
          const brokenWord = breakLongWord(ctx, word, maxWidth);
          if (brokenWord.length > 1) {
            lines.push(...brokenWord.slice(0, -1));
            currentLine = brokenWord[brokenWord.length - 1];
          }
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

  // Helper function to break long words
  const breakLongWord = (ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] => {
    const pieces: string[] = [];
    let currentPiece = '';
    
    for (let i = 0; i < word.length; i++) {
      const testPiece = currentPiece + word[i];
      const metrics = ctx.measureText(testPiece);
      
      if (metrics.width > maxWidth && currentPiece) {
        pieces.push(currentPiece);
        currentPiece = word[i];
      } else {
        currentPiece = testPiece;
      }
    }
    
    if (currentPiece) {
      pieces.push(currentPiece);
    }
    
    return pieces;
  };

  // Regular text wrapping for titles and other text
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
        
        // Check if single word is too long, break it
        const singleWordMetrics = ctx.measureText(word);
        if (singleWordMetrics.width > maxWidth) {
          const brokenWord = breakLongWord(ctx, word, maxWidth);
          if (brokenWord.length > 1) {
            lines.push(...brokenWord.slice(0, -1));
            currentLine = brokenWord[brokenWord.length - 1];
          }
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
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="aspect-square bg-[#262626] rounded-xl flex items-center justify-center">
          <p className="text-[#A3A3A3] text-sm">Select a template to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      <div className="aspect-square bg-[#262626] rounded-xl overflow-hidden border border-[#404040]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      {showControls && onGenerate && (
        <div className="mt-3 sm:mt-4">
          <button
            onClick={onGenerate}
            disabled={!name || !title || !photo.url}
            className="w-full py-3 bg-[#FAFAFA] text-[#0A0A0A] rounded-xl hover:bg-[#E5E5E5] disabled:bg-[#404040] disabled:text-[#737373] disabled:cursor-not-allowed transition-colors font-medium min-h-[44px]"
          >
            Generate Final Poster
          </button>
        </div>
      )}
    </div>
  );
}