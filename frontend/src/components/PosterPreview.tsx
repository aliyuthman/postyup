'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useSupporterStore } from '@/stores/supporterStore';
import { useTemplateStore } from '@/stores/templateStore';

interface PosterPreviewProps {
  width?: number;
  height?: number;
  showControls?: boolean;
  onGenerate?: () => void;
  debugMode?: boolean;
}

export default function PosterPreview({ 
  width = 400, 
  height = 400, 
  showControls = true,
  onGenerate,
  debugMode = false 
}: PosterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { name, title, photo } = useSupporterStore();
  const { selectedTemplate } = useTemplateStore();
  
  // Debug state for positioning
  const [debugCoords, setDebugCoords] = useState({
    photoX: 88,
    photoY: 1607,
    photoWidth: 305,
    photoHeight: 305,
    // Name text positioning and dimensions
    nameX: 100,
    nameY: 1400,
    nameWidth: 1800, // Text box width
    nameHeight: 100, // Text box height
    nameFontSize: 58.33,
    // Title text positioning and dimensions
    titleX: 100,
    titleY: 1500,
    titleWidth: 1800, // Text box width
    titleHeight: 80, // Text box height
    titleFontSize: 50,
    // General spacing
    textSpacing: 20
  });

  // Debug overlay drawing function
  const drawDebugOverlays = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasSize: { width: number; height: number }
  ) => {
    ctx.save();
    
    // Draw photo zone outline
    const photoX = (debugCoords.photoX / 2000) * canvasSize.width;
    const photoY = (debugCoords.photoY / 2000) * canvasSize.height;
    const photoWidth = (debugCoords.photoWidth / 2000) * canvasSize.width;
    const photoHeight = (debugCoords.photoHeight / 2000) * canvasSize.height;
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);
    
    // Draw name text area outline
    const nameX = (debugCoords.nameX / 2000) * canvasSize.width;
    const nameY = (debugCoords.nameY / 2000) * canvasSize.height;
    const nameWidth = (debugCoords.nameWidth / 2000) * canvasSize.width;
    const nameHeight = (debugCoords.nameHeight / 2000) * canvasSize.height;
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(nameX, nameY - nameHeight, nameWidth, nameHeight);
    
    // Draw title text area outline
    const titleX = (debugCoords.titleX / 2000) * canvasSize.width;
    const titleY = (debugCoords.titleY / 2000) * canvasSize.height;
    const titleWidth = (debugCoords.titleWidth / 2000) * canvasSize.width;
    const titleHeight = (debugCoords.titleHeight / 2000) * canvasSize.height;
    
    ctx.strokeStyle = '#0080ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(titleX, titleY - titleHeight, titleWidth, titleHeight);
    
    // Draw coordinate labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    
    // Photo label
    ctx.fillRect(photoX, photoY - 20, 120, 16);
    ctx.fillStyle = '#000000';
    ctx.fillText(`Photo: ${debugCoords.photoX}, ${debugCoords.photoY}`, photoX + 2, photoY - 7);
    
    // Name label
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(nameX, nameY - nameHeight - 35, 150, 16);
    ctx.fillStyle = '#000000';
    ctx.fillText(`Name: ${debugCoords.nameX},${debugCoords.nameY} ${debugCoords.nameWidth}x${debugCoords.nameHeight}`, nameX + 2, nameY - nameHeight - 22);
    
    // Title label
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(titleX, titleY - titleHeight - 35, 150, 16);
    ctx.fillStyle = '#000000';
    ctx.fillText(`Title: ${debugCoords.titleX},${debugCoords.titleY} ${debugCoords.titleWidth}x${debugCoords.titleHeight}`, titleX + 2, titleY - titleHeight - 22);
    
    ctx.restore();
  }, [debugCoords]);

  // Adaptive text rendering system
  const renderAdaptiveText = useCallback((
    ctx: CanvasRenderingContext2D,
    content: { name: string; title: string },
    canvasSize: { width: number; height: number }
  ) => {
    if (!content.name || !content.title) return;
    
    if (debugMode) {
      // Debug mode: Use separate positioning for name and title
      
      // RENDER NAME
      const nameX = (debugCoords.nameX / 2000) * canvasSize.width;
      const nameY = (debugCoords.nameY / 2000) * canvasSize.height;
      const nameWidth = (debugCoords.nameWidth / 2000) * canvasSize.width;
      const nameHeight = (debugCoords.nameHeight / 2000) * canvasSize.height;
      const nameFontSize = (debugCoords.nameFontSize / 2000) * canvasSize.width;
      
      ctx.font = `700 ${nameFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'left';
      ctx.letterSpacing = `${-0.05 * nameFontSize}px`;
      
      const nameLines = intelligentWrapText(ctx, content.name, nameWidth);
      nameLines.forEach((line, index) => {
        const lineY = nameY - nameHeight + (index * nameFontSize * 1.2) + nameFontSize;
        if (lineY <= nameY) { // Only render if within the text box
          ctx.fillText(line, nameX, lineY);
        }
      });
      
      // RENDER TITLE
      const titleX = (debugCoords.titleX / 2000) * canvasSize.width;
      const titleY = (debugCoords.titleY / 2000) * canvasSize.height;
      const titleWidth = (debugCoords.titleWidth / 2000) * canvasSize.width;
      const titleHeight = (debugCoords.titleHeight / 2000) * canvasSize.height;
      const titleFontSize = (debugCoords.titleFontSize / 2000) * canvasSize.width;
      
      ctx.font = `400 ${titleFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#605e5e';
      ctx.letterSpacing = `${-0.025 * titleFontSize}px`;
      
      const titleLines = intelligentWrapText(ctx, content.title, titleWidth);
      titleLines.forEach((line, index) => {
        const lineY = titleY - titleHeight + (index * titleFontSize * 1.2) + titleFontSize;
        if (lineY <= titleY) { // Only render if within the text box
          ctx.fillText(line, titleX, lineY);
        }
      });
      
    } else {
      // Normal mode: Use original positioning logic
      const textAreaMargin = (100 / 2000) * canvasSize.width;
      const textAreaWidth = canvasSize.width - (textAreaMargin * 2);
      const photoY = (1607 / 2000) * canvasSize.height;
      const textAreaBottom = photoY - (40 / 2000) * canvasSize.height;
      
      const nameFontSize = (58.33 / 2000) * canvasSize.width;
      const nameLineHeight = (66.67 / 2000) * canvasSize.width;
      const roleFontSize = (50 / 2000) * canvasSize.width;
      const roleLineHeight = (58.33 / 2000) * canvasSize.width;
      
      // Name styling
      ctx.font = `700 ${nameFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'left';
      ctx.letterSpacing = `${-0.05 * nameFontSize}px`;
      
      const nameLines = intelligentWrapText(ctx, content.name, textAreaWidth);
      const nameTotalHeight = nameLines.length * nameLineHeight;
      
      // Role styling
      ctx.font = `400 ${roleFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#605e5e';
      ctx.letterSpacing = `${-0.025 * roleFontSize}px`;
      
      const roleLines = intelligentWrapText(ctx, content.title, textAreaWidth);
      const roleTotalHeight = roleLines.length * roleLineHeight;
      
      const nameToRoleSpacing = calculateDynamicSpacing(nameLines.length, canvasSize.width);
      const totalTextHeight = nameTotalHeight + nameToRoleSpacing + roleTotalHeight;
      const textStartY = textAreaBottom - totalTextHeight;
      
      // Render name
      ctx.font = `700 ${nameFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#1a1a1a';
      ctx.letterSpacing = `${-0.05 * nameFontSize}px`;
      let currentY = textStartY;
      
      nameLines.forEach(line => {
        ctx.fillText(line, textAreaMargin, currentY);
        currentY += nameLineHeight;
      });
      
      currentY += nameToRoleSpacing;
      
      // Render role
      ctx.font = `400 ${roleFontSize}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#605e5e';
      ctx.letterSpacing = `${-0.025 * roleFontSize}px`;
      
      roleLines.forEach(line => {
        ctx.fillText(line, textAreaMargin, currentY);
        currentY += roleLineHeight;
      });
    }
  }, [debugMode, debugCoords]);

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

        // Calculate photo position and size (based on 2000x2000 final size)
        const photoX = debugMode ? (debugCoords.photoX / 2000) * width : (photoZone.x / 2000) * width;
        const photoY = debugMode ? (debugCoords.photoY / 2000) * height : (photoZone.y / 2000) * height;
        const photoWidth = debugMode ? (debugCoords.photoWidth / 2000) * width : (photoZone.width / 2000) * width;
        const photoHeight = debugMode ? (debugCoords.photoHeight / 2000) * height : (photoZone.height / 2000) * height;

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
      
      // Draw debug overlays if in debug mode
      if (debugMode) {
        drawDebugOverlays(ctx, { width, height });
      }

    } catch (error) {
      console.error('Error rendering preview:', error);
    }
  }, [selectedTemplate, name, title, photo, width, height, debugMode, debugCoords, drawDebugOverlays, renderAdaptiveText]);

  useEffect(() => {
    if (selectedTemplate && canvasRef.current) {
      renderPreview();
    }
  }, [renderPreview, debugCoords, debugMode, selectedTemplate]);


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
      
      {debugMode && (
        <div className="mt-4 p-4 bg-[#1a1a1a] rounded-xl space-y-6">
          <h3 className="text-sm font-medium text-[#FAFAFA]">Debug Controls</h3>
          
          {/* Photo Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-[#ff6b6b]">📸 Photo Position (Red Box)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Photo X</label>
                <input
                  type="number"
                  value={debugCoords.photoX}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, photoX: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Photo Y</label>
                <input
                  type="number"
                  value={debugCoords.photoY}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, photoY: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Photo Width</label>
                <input
                  type="number"
                  value={debugCoords.photoWidth}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, photoWidth: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Photo Height</label>
                <input
                  type="number"
                  value={debugCoords.photoHeight}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, photoHeight: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
            </div>
          </div>
          
          {/* Name Text Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-[#51cf66]">👤 Name Text Frame (Green Box)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Name X</label>
                <input
                  type="number"
                  value={debugCoords.nameX}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, nameX: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Name Y</label>
                <input
                  type="number"
                  value={debugCoords.nameY}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, nameY: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Name Font Size</label>
                <input
                  type="number"
                  step="0.1"
                  value={debugCoords.nameFontSize}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, nameFontSize: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Name Width</label>
                <input
                  type="number"
                  value={debugCoords.nameWidth}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, nameWidth: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Name Height</label>
                <input
                  type="number"
                  value={debugCoords.nameHeight}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, nameHeight: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
            </div>
          </div>
          
          {/* Title Text Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-[#4dabf7]">💼 Title Text Frame (Blue Box)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Title X</label>
                <input
                  type="number"
                  value={debugCoords.titleX}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, titleX: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Title Y</label>
                <input
                  type="number"
                  value={debugCoords.titleY}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, titleY: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Title Font Size</label>
                <input
                  type="number"
                  step="0.1"
                  value={debugCoords.titleFontSize}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, titleFontSize: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Title Width</label>
                <input
                  type="number"
                  value={debugCoords.titleWidth}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, titleWidth: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3]">Title Height</label>
                <input
                  type="number"
                  value={debugCoords.titleHeight}
                  onChange={(e) => setDebugCoords(prev => ({ ...prev, titleHeight: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-xs bg-[#262626] text-[#FAFAFA] rounded border border-[#404040]"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => console.log('Current coordinates:', debugCoords)}
              className="px-3 py-1 text-xs bg-[#404040] text-[#FAFAFA] rounded hover:bg-[#505050]"
            >
              Log Coordinates
            </button>
            <button
              onClick={() => setDebugCoords({
                photoX: 88, photoY: 1607, photoWidth: 305, photoHeight: 305,
                nameX: 100, nameY: 1400, nameWidth: 1800, nameHeight: 100, nameFontSize: 58.33,
                titleX: 100, titleY: 1500, titleWidth: 1800, titleHeight: 80, titleFontSize: 50, 
                textSpacing: 20
              })}
              className="px-3 py-1 text-xs bg-[#404040] text-[#FAFAFA] rounded hover:bg-[#505050]"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}