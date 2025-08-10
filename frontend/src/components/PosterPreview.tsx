'use client';

import { useRef, useEffect } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';
import { useTemplateStore, TextCoordinates } from '@/stores/templateStore';

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

      // Get photo zone for vertical alignment reference
      const photoZone = selectedTemplate.layoutConfig.photoZones[0];
      if (!photoZone) return;
      
      // Calculate text positioning with four-coordinate system
      const textLayout = calculateTextLayout(
        selectedTemplate.layoutConfig.textZones, 
        photoZone, 
        { name, title }, 
        { width, height }, 
        ctx
      );

      // Render text using calculated layout with four-coordinate system
      renderTextWithCoordinates(ctx, textLayout, { name, title });

    } catch (error) {
      console.error('Error rendering preview:', error);
    }
  };

  // Four-coordinate text layout calculation system
  interface TextLayoutData {
    type: 'name' | 'title';
    coordinates: TextCoordinates;
    fontSize: number;
    fontWeight: string;
    fontFamily: string;
    color: string;
    textAlign: string;
    textTransform?: string;
    lines: string[];
    lineHeight: number;
  }

  const calculateTextLayout = (
    textZones: Array<{
      type: 'name' | 'title';
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      fontFamily: string;
      fontWeight?: string;
      color: string;
      textAlign: string;
      textTransform?: string;
    }>, 
    photoZone: {
      x: number;
      y: number;
      width: number;
      height: number;
      borderRadius?: number;
    }, 
    content: {name: string, title: string}, 
    canvasSize: {width: number, height: number}, 
    ctx: CanvasRenderingContext2D
  ): TextLayoutData[] => {
    
    // Scale photoZone to canvas size
    const scaledPhotoZone = {
      x: (photoZone.x / 1080) * canvasSize.width,
      y: (photoZone.y / 1080) * canvasSize.height,
      width: (photoZone.width / 1080) * canvasSize.width,
      height: (photoZone.height / 1080) * canvasSize.height,
      centerY: ((photoZone.y + photoZone.height / 2) / 1080) * canvasSize.height
    };
    
    const nameZone = textZones.find(zone => zone.type === 'name');
    const titleZone = textZones.find(zone => zone.type === 'title');
    
    if (!nameZone || !titleZone || !content.name || !content.title) {
      return [];
    }
    
    // Define text area coordinates (left side layout)
    const textAreaLeft = 50; // Left margin
    const textAreaRight = scaledPhotoZone.x - 30; // 30px gap before photo
    const textAreaWidth = textAreaRight - textAreaLeft;
    
    // Calculate name text properties
    const nameContent = nameZone.textTransform === 'uppercase' ? content.name.toUpperCase() : content.name;
    const nameBaseFontSize = nameZone.fontSize * canvasSize.width * 1.4; // 1.4x larger
    const nameFontSize = Math.max(nameBaseFontSize, 18);
    const nameWeight = nameZone.fontWeight || 'normal';
    
    // Measure name text
    ctx.save();
    ctx.font = `${nameWeight} ${nameFontSize}px ${nameZone.fontFamily}`;
    const nameLines = smartWrapText(ctx, nameContent, textAreaWidth);
    const nameLineHeight = nameFontSize * 1.25;
    const nameTotalHeight = nameLines.length * nameLineHeight;
    ctx.restore();
    
    // Calculate title text properties  
    const titleContent = content.title;
    const titleBaseFontSize = titleZone.fontSize * canvasSize.width * 1.2; // 1.2x larger
    const titleFontSize = Math.max(titleBaseFontSize, 16);
    const titleWeight = titleZone.fontWeight || 'normal';
    
    // Measure title text
    ctx.save();
    ctx.font = `${titleWeight} ${titleFontSize}px ${titleZone.fontFamily}`;
    const titleLines = wrapText(ctx, titleContent, textAreaWidth);
    const titleLineHeight = titleFontSize * 1.3;
    const titleTotalHeight = titleLines.length * titleLineHeight;
    ctx.restore();
    
    // Dynamic spacing between name and title based on name line count
    let nameToTitleSpacing: number;
    if (nameLines.length === 1) {
      nameToTitleSpacing = (15 / 1080) * canvasSize.width; // Tight spacing for single-line names
    } else if (nameLines.length === 2) {
      nameToTitleSpacing = (25 / 1080) * canvasSize.width; // Medium spacing for two-line names
    } else {
      nameToTitleSpacing = (35 / 1080) * canvasSize.width; // Generous spacing for multi-line names
    }
    
    console.log(`Enhanced frontend spacing: name has ${nameLines.length} lines, using ${nameToTitleSpacing}px spacing`);
    
    // Calculate total text block height
    const totalTextHeight = nameTotalHeight + nameToTitleSpacing + titleTotalHeight;
    
    // Center the text block vertically with the photo zone
    const textBlockStartY = scaledPhotoZone.centerY - (totalTextHeight / 2);
    
    // Name coordinates (four-point system)
    const nameTopY = textBlockStartY;
    const nameBottomY = nameTopY + nameTotalHeight;
    const nameCoordinates: TextCoordinates = {
      topLeft: { x: textAreaLeft, y: nameTopY },
      topRight: { x: textAreaRight, y: nameTopY },
      bottomRight: { x: textAreaRight, y: nameBottomY },
      bottomLeft: { x: textAreaLeft, y: nameBottomY }
    };
    
    // Title coordinates (four-point system)
    const titleTopY = nameBottomY + nameToTitleSpacing;
    const titleBottomY = titleTopY + titleTotalHeight;
    const titleCoordinates: TextCoordinates = {
      topLeft: { x: textAreaLeft, y: titleTopY },
      topRight: { x: textAreaRight, y: titleTopY },
      bottomRight: { x: textAreaRight, y: titleBottomY },
      bottomLeft: { x: textAreaLeft, y: titleBottomY }
    };
    
    return [
      {
        type: 'name',
        coordinates: nameCoordinates,
        fontSize: nameFontSize,
        fontWeight: nameWeight,
        fontFamily: nameZone.fontFamily,
        color: nameZone.color,
        textAlign: 'left', // Force left alignment for left-side layout
        textTransform: nameZone.textTransform,
        lines: nameLines,
        lineHeight: nameLineHeight
      },
      {
        type: 'title',
        coordinates: titleCoordinates,
        fontSize: titleFontSize,
        fontWeight: titleWeight,
        fontFamily: titleZone.fontFamily,
        color: titleZone.color,
        textAlign: 'left', // Force left alignment for left-side layout
        lines: titleLines,
        lineHeight: titleLineHeight
      }
    ];
  };
  
  const renderTextWithCoordinates = (
    ctx: CanvasRenderingContext2D, 
    textLayout: TextLayoutData[], 
    content: {name: string, title: string}
  ) => {
    textLayout.forEach(layout => {
      const textContent = layout.type === 'name' ? content.name : content.title;
      if (!textContent) return;
      
      // Set font properties
      ctx.font = `${layout.fontWeight} ${layout.fontSize}px ${layout.fontFamily}`;
      ctx.fillStyle = layout.color;
      ctx.textAlign = layout.textAlign as CanvasTextAlign;
      
      // Render each line at calculated position
      const startX = layout.coordinates.topLeft.x;
      let currentY = layout.coordinates.topLeft.y + layout.fontSize; // Add fontSize for baseline
      
      layout.lines.forEach(line => {
        ctx.fillText(line, startX, currentY);
        currentY += layout.lineHeight;
      });
    });
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