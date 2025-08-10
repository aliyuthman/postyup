'use client';

import { useRef, useEffect, useCallback } from 'react';
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
  }, [selectedTemplate, name, title, photo, width, height, renderPreview]);

  const renderPreview = useCallback(async () => {
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

          // Render text using new adaptive system
      renderAdaptiveText(ctx, { name, title }, { width, height });

    } catch (error) {
      console.error('Error rendering preview:', error);
    }
  }, [selectedTemplate, name, title, photo, width, height]);

  // Adaptive text rendering system
  const renderAdaptiveText = (
    ctx: CanvasRenderingContext2D,
    content: { name: string; title: string },
    canvasSize: { width: number; height: number }
  ) => {
    if (!content.name || !content.title) return;
    
    // Define text area at bottom of poster (like in the reference image)
    const textAreaMargin = canvasSize.width * 0.05; // 5% margin
    const textAreaWidth = canvasSize.width - (textAreaMargin * 2);
    const textAreaBottom = canvasSize.height - (canvasSize.height * 0.15); // 15% from bottom
    
    // Smart font sizing based on text length and canvas size
    const nameFontSize = calculateSmartFontSize(content.name, textAreaWidth, canvasSize.width, 'name', ctx);
    const roleFontSize = calculateSmartFontSize(content.title, textAreaWidth, canvasSize.width, 'role', ctx);
    
    // Name styling (bold, prominent)
    ctx.font = `bold ${nameFontSize}px 'Inter', Arial, sans-serif`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'left';
    
    // Intelligent text wrapping for name
    const nameLines = intelligentWrapText(ctx, content.name, textAreaWidth);
    const nameLineHeight = nameFontSize * 1.2;
    const nameTotalHeight = nameLines.length * nameLineHeight;
    
    // Role styling (regular weight)
    ctx.font = `400 ${roleFontSize}px 'Inter', Arial, sans-serif`;
    const roleLines = intelligentWrapText(ctx, content.title, textAreaWidth);
    const roleLineHeight = roleFontSize * 1.3;
    const roleTotalHeight = roleLines.length * roleLineHeight;
    
    // Dynamic spacing between name and role
    const nameToRoleSpacing = calculateDynamicSpacing(nameLines.length, canvasSize.width);
    
    // Calculate total text block height
    const totalTextHeight = nameTotalHeight + nameToRoleSpacing + roleTotalHeight;
    
    // Position text block at bottom
    const textStartY = textAreaBottom - totalTextHeight;
    
    // Render name
    ctx.font = `bold ${nameFontSize}px 'Inter', Arial, sans-serif`;
    ctx.fillStyle = '#1a1a1a';
    let currentY = textStartY;
    
    nameLines.forEach(line => {
      ctx.fillText(line, textAreaMargin, currentY);
      currentY += nameLineHeight;
    });
    
    // Add spacing
    currentY += nameToRoleSpacing;
    
    // Render role
    ctx.font = `400 ${roleFontSize}px 'Inter', Arial, sans-serif`;
    ctx.fillStyle = '#4a4a4a';
    
    roleLines.forEach(line => {
      ctx.fillText(line, textAreaMargin, currentY);
      currentY += roleLineHeight;
    });
  };
  // Smart font size calculation
  const calculateSmartFontSize = (
    text: string,
    maxWidth: number,
    canvasWidth: number,
    type: 'name' | 'role',
    ctx: CanvasRenderingContext2D
  ): number => {
    const baseSizes = {
      name: Math.max(canvasWidth * 0.04, 24), // 4% of canvas width, min 24px
      role: Math.max(canvasWidth * 0.025, 16)  // 2.5% of canvas width, min 16px
    };
    
    let fontSize = baseSizes[type];
    const maxSize = baseSizes[type] * 1.5;
    const minSize = baseSizes[type] * 0.7;
    
    // Test if text fits at base size
    ctx.save();
    ctx.font = `${type === 'name' ? 'bold' : '400'} ${fontSize}px 'Inter', Arial, sans-serif`;
    
    const words = text.split(' ');
    const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
    
    // If longest word doesn't fit, reduce font size
    while (fontSize > minSize && ctx.measureText(longestWord).width > maxWidth) {
      fontSize *= 0.9;
      ctx.font = `${type === 'name' ? 'bold' : '400'} ${fontSize}px 'Inter', Arial, sans-serif`;
    }
    
    // If text is short, allow larger font up to max
    if (text.length < 20 && fontSize < maxSize) {
      fontSize = Math.min(maxSize, fontSize * 1.2);
    }
    
    ctx.restore();
    return Math.round(fontSize);
  };

  // Intelligent text wrapping with visual balance
  const intelligentWrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    
    // Single word - check if it needs breaking
    if (words.length === 1) {
      const wordWidth = ctx.measureText(text).width;
      if (wordWidth <= maxWidth) return [text];
      return breakLongWord(ctx, text, maxWidth);
    }
    
    // For names, try to balance line lengths for better visual appearance
    if (words.length === 2) {
      const fullWidth = ctx.measureText(text).width;
      const firstWord = ctx.measureText(words[0]).width;
      const secondWord = ctx.measureText(words[1]).width;
      
      // If full text fits, use single line
      if (fullWidth <= maxWidth) {
        return [text];
      }
      
      // If both words fit individually and aren't too unbalanced, split
      if (firstWord <= maxWidth && secondWord <= maxWidth) {
        const ratio = Math.max(firstWord, secondWord) / Math.min(firstWord, secondWord);
        if (ratio < 3) { // Don't split if one word is 3x longer
          return [words[0], words[1]];
        }
      }
    }
    
    // Standard wrapping with balance optimization
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        // Check if single word is too long
        if (ctx.measureText(word).width > maxWidth) {
          const brokenParts = breakLongWord(ctx, word, maxWidth);
          lines.push(...brokenParts.slice(0, -1));
          currentLine = brokenParts[brokenParts.length - 1] || '';
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

  // Dynamic spacing calculation
  const calculateDynamicSpacing = (nameLineCount: number, canvasWidth: number): number => {
    const baseSpacing = canvasWidth * 0.02; // 2% of canvas width
    
    // More spacing for multi-line names to avoid crowding
    const spacingMultiplier = {
      1: 1,     // Standard spacing for single-line names
      2: 1.3,   // 30% more spacing for two-line names
      3: 1.6,   // 60% more spacing for three-line names
    }[Math.min(nameLineCount, 3)] || 1.8; // 80% more for 4+ lines
    
    return Math.round(baseSpacing * spacingMultiplier);
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