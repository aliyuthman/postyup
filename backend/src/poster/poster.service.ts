import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { TemplateService } from '../template/template.service';
import * as sharp from 'sharp';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

@Injectable()
export class PosterService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor(private templateService: TemplateService) {}

  async generatePoster(
    templateId: string,
    supporterData: { name: string; title: string },
    photoUrl: string,
    sessionId: string
  ): Promise<{ previewUrl: string; finalUrl: string }> {
    try {
      const template = await this.templateService.getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Generate both preview (540px) and final (2000px) versions
      const previewBuffer = await this.composePoster(
        template,
        supporterData,
        photoUrl,
        540
      );
      const finalBuffer = await this.composePoster(
        template,
        supporterData,
        photoUrl,
        2000
      );

      // Upload preview version
      const previewFilename = `${sessionId}_preview_${Date.now()}.png`;
      const previewPath = `posters/preview/${previewFilename}`;

      const { error: previewError } = await this.supabase.storage
        .from('generated-posters')
        .upload(previewPath, previewBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (previewError) {
        throw new Error(`Preview upload failed: ${previewError.message}`);
      }

      // Upload final version
      const finalFilename = `${sessionId}_final_${Date.now()}.png`;
      const finalPath = `posters/final/${finalFilename}`;

      const { error: finalError } = await this.supabase.storage
        .from('generated-posters')
        .upload(finalPath, finalBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (finalError) {
        throw new Error(`Final upload failed: ${finalError.message}`);
      }

      // Get public URLs
      const { data: previewUrlData } = this.supabase.storage
        .from('generated-posters')
        .getPublicUrl(previewPath);

      const { data: finalUrlData } = this.supabase.storage
        .from('generated-posters')
        .getPublicUrl(finalPath);

      return {
        previewUrl: previewUrlData.publicUrl,
        finalUrl: finalUrlData.publicUrl,
      };
    } catch (error) {
      throw new Error(`Poster generation failed: ${error.message}`);
    }
  }

  private async composePoster(
    template: any,
    supporterData: { name: string; title: string },
    photoUrl: string,
    size: number
  ): Promise<Buffer> {
    try {
      // Download template image
      const templateResponse = await fetch(template.imageUrls.full);
      const templateBuffer = await templateResponse.arrayBuffer();

      // Create base image from template
      let composite = sharp(Buffer.from(templateBuffer))
        .resize(size, size, { fit: 'cover' });

      const overlays: any[] = [];

      // Add photo overlay if photo zones exist
      if (template.layoutConfig.photoZones?.length > 0 && photoUrl) {
        const photoZone = template.layoutConfig.photoZones[0];
        
        // Download user photo
        const photoResponse = await fetch(photoUrl);
        const photoBuffer = await photoResponse.arrayBuffer();

        // Calculate scaled dimensions
        const photoX = Math.round((photoZone.x / 2000) * size);
        const photoY = Math.round((photoZone.y / 2000) * size);
        const photoWidth = Math.round((photoZone.width / 2000) * size);
        const photoHeight = Math.round((photoZone.height / 2000) * size);

        // Process photo
        let processedPhoto = sharp(Buffer.from(photoBuffer))
          .resize(photoWidth, photoHeight, { fit: 'cover' });

        // Apply border radius if specified
        if (photoZone.borderRadius) {
          const radius = Math.round((photoZone.borderRadius / 2000) * size);
          processedPhoto = processedPhoto.png().composite([{
            input: Buffer.from(
              `<svg><rect x="0" y="0" width="${photoWidth}" height="${photoHeight}" rx="${radius}" ry="${radius}"/></svg>`
            ),
            blend: 'dest-in'
          }]);
        }

        overlays.push({
          input: await processedPhoto.png().toBuffer(),
          top: photoY,
          left: photoX,
        });
      }

      // Add text overlays using database textZones
      if (supporterData.name && supporterData.title && template.layoutConfig.textZones?.length >= 2) {
        console.log('Rendering text with database textZones coordinates');
        
        const textOverlay = await this.createTextOverlayFromTextZones(
          supporterData,
          template.layoutConfig.textZones,
          size
        );
        
        if (textOverlay) {
          overlays.push(...textOverlay);
          console.log(`Added text overlays for name and title using textZones`);
        }
      }

      // Apply all overlays
      if (overlays.length > 0) {
        composite = composite.composite(overlays);
      }

      return await composite.png().toBuffer();
    } catch (error) {
      throw new Error(`Poster composition failed: ${error.message}`);
    }
  }

  // Create text overlay with exact Photoshop specifications
  private async createTextOverlayWithPhotoshopSpecs(
    content: { name: string; title: string },
    photoZone: { x: number; y: number; width: number; height: number },
    canvasSize: number
  ): Promise<Array<{ input: Buffer; top: number; left: number }> | null> {
    if (!content.name || !content.title) return null;
    
    try {
      // Scale photo zone to canvas size
      const scaledPhotoZone = {
        x: (photoZone.x / 2000) * canvasSize,
        y: (photoZone.y / 2000) * canvasSize,
        width: (photoZone.width / 2000) * canvasSize,
        height: (photoZone.height / 2000) * canvasSize,
      };
      
      // Define text area above the photo
      const textAreaLeft = (100 / 2000) * canvasSize;
      const textAreaRight = (1900 / 2000) * canvasSize;
      const textAreaWidth = textAreaRight - textAreaLeft;
      
      // Name text specifications (14pt at 300 DPI = 58.33px)
      const nameFontSize = (58.33 / 2000) * canvasSize;
      const nameLineHeight = (66.67 / 2000) * canvasSize; // 16pt at 300 DPI
      
      // Title text specifications (12pt at 300 DPI = 50px)
      const titleFontSize = (50 / 2000) * canvasSize;
      const titleLineHeight = (58.33 / 2000) * canvasSize; // 14pt at 300 DPI
      
      // Create temporary canvas for text measurement
      const tempCanvas = createCanvas(textAreaWidth, 200);
      const tempCtx = tempCanvas.getContext('2d');
      
      // Measure name text
      tempCtx.font = `700 ${nameFontSize}px 'Inter', Arial, sans-serif`;
      const nameLines = this.intelligentWrapText(tempCtx, content.name, textAreaWidth);
      const nameTotalHeight = nameLines.length * nameLineHeight;
      
      // Measure title text  
      tempCtx.font = `400 ${titleFontSize}px 'Inter', Arial, sans-serif`;
      const titleLines = this.intelligentWrapText(tempCtx, content.title, textAreaWidth);
      const titleTotalHeight = titleLines.length * titleLineHeight;
      
      // Position text above photo with spacing
      const textSpacing = (20 / 2000) * canvasSize; // 20px spacing
      const nameY = scaledPhotoZone.y - nameTotalHeight - titleTotalHeight - textSpacing * 2;
      const titleY = scaledPhotoZone.y - titleTotalHeight - textSpacing;
      
      const overlays = [];
      
      // Create name text overlay
      const nameCanvas = createCanvas(textAreaWidth, nameTotalHeight);
      const nameCtx = nameCanvas.getContext('2d');
      nameCtx.font = `700 ${nameFontSize}px 'Inter', Arial, sans-serif`;
      nameCtx.fillStyle = '#1a1a1a';
      nameCtx.textAlign = 'left';
      nameCtx.textBaseline = 'top';
      
      let currentY = 0;
      nameLines.forEach(line => {
        nameCtx.fillText(line, 0, currentY);
        currentY += nameLineHeight;
      });
      
      overlays.push({
        input: nameCanvas.toBuffer('image/png'),
        top: Math.round(nameY),
        left: Math.round(textAreaLeft)
      });
      
      // Create title text overlay
      const titleCanvas = createCanvas(textAreaWidth, titleTotalHeight);
      const titleCtx = titleCanvas.getContext('2d');
      titleCtx.font = `400 ${titleFontSize}px 'Inter', Arial, sans-serif`;
      titleCtx.fillStyle = '#605e5e';
      titleCtx.textAlign = 'left';
      titleCtx.textBaseline = 'top';
      
      currentY = 0;
      titleLines.forEach(line => {
        titleCtx.fillText(line, 0, currentY);
        currentY += titleLineHeight;
      });
      
      overlays.push({
        input: titleCanvas.toBuffer('image/png'),
        top: Math.round(titleY),
        left: Math.round(textAreaLeft)
      });
      
      return overlays;
      
    } catch (error) {
      console.error('Error creating text overlay with Photoshop specs:', error);
      return null;
    }
  }

  // Enhanced text layout calculation matching frontend logic
  private calculateTextLayout(
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
      coordinates?: {
        topLeft: { x: number; y: number };
        topRight: { x: number; y: number };
        bottomRight: { x: number; y: number };
        bottomLeft: { x: number; y: number };
      };
    }>,
    photoZone: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    content: { name: string; title: string },
    canvasSize: number
  ) {
    const nameZone = textZones.find(zone => zone.type === 'name');
    const titleZone = textZones.find(zone => zone.type === 'title');
    
    if (!nameZone || !titleZone || !content.name || !content.title) {
      return [];
    }

    // Scale photo zone to canvas size
    const scaledPhotoZone = {
      x: (photoZone.x / 2000) * canvasSize,
      y: (photoZone.y / 2000) * canvasSize,
      width: (photoZone.width / 2000) * canvasSize,
      height: (photoZone.height / 2000) * canvasSize,
      centerY: ((photoZone.y + photoZone.height / 2) / 2000) * canvasSize
    };
    
    // Define text area coordinates (above photo layout)
    // With photo at bottom left (88, 1607), position text above it
    const textAreaLeft = (100 / 2000) * canvasSize; // Left margin 
    const textAreaRight = (1900 / 2000) * canvasSize; // Right margin
    const textAreaWidth = textAreaRight - textAreaLeft;
    
    // Calculate name text properties using exact Photoshop specifications
    const nameContent = nameZone.textTransform === 'uppercase' ? content.name.toUpperCase() : content.name;
    // 14pt at 300 DPI = 58.33px, scaled for canvas size
    const nameFontSize = (58.33 / 2000) * canvasSize;
    // 16pt line height at 300 DPI = 66.67px, scaled for canvas size
    const nameLineHeight = (66.67 / 2000) * canvasSize;
    const nameWeight = '700'; // Font weight 700 (bold)
    
    // Create temporary canvas to measure name text
    const tempCanvas = createCanvas(textAreaWidth, 200);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${nameWeight} ${nameFontSize}px 'Inter', Arial, sans-serif`;
    
    const nameLines = this.intelligentWrapText(tempCtx, nameContent, textAreaWidth);
    const nameTotalHeight = nameLines.length * nameLineHeight;
    
    // Calculate title text properties using exact Photoshop specifications
    const titleContent = content.title;
    // 12pt at 300 DPI = 50px, scaled for canvas size
    const titleFontSize = (50 / 2000) * canvasSize;
    // 14pt line height at 300 DPI = 58.33px, scaled for canvas size
    const titleLineHeight = (58.33 / 2000) * canvasSize;
    const titleWeight = '400'; // Font weight 400 (normal)
    
    // Measure title text
    tempCtx.font = `${titleWeight} ${titleFontSize}px 'Inter', Arial, sans-serif`;
    const titleLines = this.intelligentWrapText(tempCtx, titleContent, textAreaWidth);
    const titleTotalHeight = titleLines.length * titleLineHeight;
    
    // Return the calculated layout data
    return [
      {
        type: 'name',
        textContent: nameContent,
        coordinates: {
          topLeft: { x: textAreaLeft, y: scaledPhotoZone.y - nameTotalHeight - 40 },
          topRight: { x: textAreaLeft + textAreaWidth, y: scaledPhotoZone.y - nameTotalHeight - 40 },
          bottomRight: { x: textAreaLeft + textAreaWidth, y: scaledPhotoZone.y - 40 },
          bottomLeft: { x: textAreaLeft, y: scaledPhotoZone.y - 40 }
        },
        width: textAreaWidth,
        height: nameTotalHeight,
        fontSize: nameFontSize,
        fontWeight: nameWeight,
        color: nameZone.color,
        lines: nameLines,
        lineHeight: nameLineHeight
      },
      {
        type: 'title',
        textContent: titleContent,
        coordinates: {
          topLeft: { x: textAreaLeft, y: scaledPhotoZone.y - 20 },
          topRight: { x: textAreaLeft + textAreaWidth, y: scaledPhotoZone.y - 20 },
          bottomRight: { x: textAreaLeft + textAreaWidth, y: scaledPhotoZone.y - 20 + titleTotalHeight },
          bottomLeft: { x: textAreaLeft, y: scaledPhotoZone.y - 20 + titleTotalHeight }
        },
        width: textAreaWidth,
        height: titleTotalHeight,
        fontSize: titleFontSize,
        fontWeight: titleWeight,
        color: '#605e5e', // Exact color from Photoshop specifications
        lines: titleLines,
        lineHeight: titleLineHeight
      }
    ];
  }

  // Intelligent text wrapping with visual balance (backend version)
  private intelligentWrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    
    if (words.length === 1) {
      const wordWidth = ctx.measureText(text).width;
      if (wordWidth <= maxWidth) return [text];
      return this.breakLongWord(ctx, text, maxWidth);
    }
    
    // For names, try to balance line lengths
    if (words.length === 2) {
      const fullWidth = ctx.measureText(text).width;
      const firstWord = ctx.measureText(words[0]).width;
      const secondWord = ctx.measureText(words[1]).width;
      
      if (fullWidth <= maxWidth) {
        return [text];
      }
      
      if (firstWord <= maxWidth && secondWord <= maxWidth) {
        const ratio = Math.max(firstWord, secondWord) / Math.min(firstWord, secondWord);
        if (ratio < 3) {
          return [words[0], words[1]];
        }
      }
    }
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        if (ctx.measureText(word).width > maxWidth) {
          const brokenParts = this.breakLongWord(ctx, word, maxWidth);
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
  }

  // Helper function to break long words
  private breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
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
  }

  // Create text overlay using database textZones coordinates
  private async createTextOverlayFromTextZones(
    content: { name: string; title: string },
    textZones: any[],
    canvasSize: number
  ): Promise<Array<{ input: Buffer; top: number; left: number }> | null> {
    if (!content.name || !content.title || textZones.length < 2) return null;
    
    try {
      const nameZone = textZones.find(zone => zone.type === 'name');
      const titleZone = textZones.find(zone => zone.type === 'title');
      
      if (!nameZone || !titleZone) return null;
      
      console.log('Creating text overlays with textZones:', { nameZone, titleZone, canvasSize });
      
      const overlays = [];
      
      // Create name text overlay
      const nameOverlay = await this.createSingleTextOverlay(
        content.name,
        nameZone,
        canvasSize
      );
      if (nameOverlay) overlays.push(nameOverlay);
      
      // Create title text overlay
      const titleOverlay = await this.createSingleTextOverlay(
        content.title,
        titleZone,
        canvasSize
      );
      if (titleOverlay) overlays.push(titleOverlay);
      
      return overlays;
    } catch (error) {
      console.error('Error creating text overlays from textZones:', error);
      return null;
    }
  }

  // Smart font sizing based on name structure (same logic as frontend)
  private calculateOptimalFontSize(
    ctx: CanvasRenderingContext2D,
    name: string,
    baseFontSize: number,
    maxWidth: number
  ): number {
    const words = name.trim().split(' ');
    const spaceCount = words.length - 1;
    
    let optimalSize = baseFontSize;
    const maxIncrease = baseFontSize * 1.0; // Max 100% size increase (doubled scaling)
    
    if (spaceCount === 0) {
      // Single name: increase until it fits width nicely
      for (let size = baseFontSize; size <= baseFontSize + maxIncrease; size += 2) {
        ctx.font = `700 ${size}px 'Inter', Arial, sans-serif`;
        if (ctx.measureText(name).width <= maxWidth * 0.9) { // Leave 10% margin
          optimalSize = size;
        } else {
          break;
        }
      }
    } else if (spaceCount === 1) {
      // First Last: increase until Last breaks to second line
      const [first] = words;
      for (let size = baseFontSize; size <= baseFontSize + maxIncrease; size += 2) {
        ctx.font = `700 ${size}px 'Inter', Arial, sans-serif`;
        const fullWidth = ctx.measureText(name).width;
        const firstWidth = ctx.measureText(first).width;
        
        if (fullWidth > maxWidth && firstWidth <= maxWidth * 0.8) {
          // Perfect: first name fits, full name doesn't
          optimalSize = size;
          break;
        } else if (fullWidth <= maxWidth) {
          optimalSize = size;
        } else {
          break;
        }
      }
    } else if (spaceCount >= 2) {
      // First Middle+ Last: increase until only Last breaks
      const beforeLast = words.slice(0, -1).join(' ');
      
      for (let size = baseFontSize; size <= baseFontSize + maxIncrease; size += 2) {
        ctx.font = `700 ${size}px 'Inter', Arial, sans-serif`;
        const beforeLastWidth = ctx.measureText(beforeLast).width;
        const fullWidth = ctx.measureText(name).width;
        
        if (fullWidth > maxWidth && beforeLastWidth <= maxWidth * 0.8) {
          // Perfect: "First Middle" fits, full name doesn't
          optimalSize = size;
          break;
        } else if (fullWidth <= maxWidth) {
          optimalSize = size;
        } else {
          break;
        }
      }
    }
    
    return optimalSize;
  }

  // Create single text overlay from textZone
  private async createSingleTextOverlay(
    text: string,
    textZone: any,
    canvasSize: number
  ): Promise<{ input: Buffer; top: number; left: number } | null> {
    try {
      // Calculate scaled dimensions
      const x = Math.round((textZone.x / 2000) * canvasSize);
      const y = Math.round((textZone.y / 2000) * canvasSize);
      const width = Math.round((textZone.width / 2000) * canvasSize);
      const height = Math.round((textZone.height / 2000) * canvasSize);
      const baseFontSize = Math.round((textZone.fontSize / 2000) * canvasSize);
      
      // Force uppercase for names (same as frontend)
      const displayText = textZone.type === 'name' ? text.toUpperCase() : text;
      
      // Calculate optimal font size for names (same as frontend)
      let optimalFontSize = baseFontSize;
      if (textZone.type === 'name') {
        // Create a temporary canvas to measure text for font scaling
        const tempCanvas = createCanvas(width, height);
        const tempCtx = tempCanvas.getContext('2d');
        optimalFontSize = this.calculateOptimalFontSize(tempCtx, displayText, baseFontSize, width);
      }
      
      console.log(`Creating ${textZone.type} text overlay:`, {
        text: displayText,
        coordinates: { x, y, width, height },
        baseFontSize,
        optimalFontSize,
        original: textZone,
        calculatedTop: y - height
      });
      
      // Create canvas for text
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Set text properties with optimal font size (match frontend exactly)
      ctx.font = `${textZone.fontWeight || '400'} ${optimalFontSize}px '${textZone.fontFamily || 'Inter'}', Arial, sans-serif`;
      ctx.fillStyle = textZone.color || '#000000';
      ctx.textAlign = textZone.textAlign || 'left';
      
      // Note: letterSpacing is not supported in Node.js canvas, but the font scaling will compensate
      
      // Use intelligent text wrapping (same as frontend)
      const lines = this.intelligentWrapText(ctx, displayText, width);
      
      // Render text lines with optimal font size (same as frontend logic)
      const lineHeight = optimalFontSize * 1.2;
      lines.forEach((line, index) => {
        const lineY = height - (lines.length * lineHeight) + (index * lineHeight) + optimalFontSize;
        if (lineY >= optimalFontSize && lineY <= height) {
          ctx.fillText(line, 0, lineY);
        }
      });
      
      const buffer = canvas.toBuffer('image/png');
      
      // For title text, move it closer to name by reducing the gap
      const adjustedTop = textZone.type === 'title' ? y - height - 6 : y - height;
      
      return {
        input: buffer,
        top: adjustedTop,
        left: x,
      };
    } catch (error) {
      console.error(`Error creating ${textZone.type} text overlay:`, error);
      return null;
    }
  }

}