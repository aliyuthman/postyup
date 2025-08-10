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

      // Generate both preview (540px) and final (1080px) versions
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
        1080
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
        const photoX = Math.round((photoZone.x / 1080) * size);
        const photoY = Math.round((photoZone.y / 1080) * size);
        const photoWidth = Math.round((photoZone.width / 1080) * size);
        const photoHeight = Math.round((photoZone.height / 1080) * size);

        // Process photo
        let processedPhoto = sharp(Buffer.from(photoBuffer))
          .resize(photoWidth, photoHeight, { fit: 'cover' });

        // Apply border radius if specified
        if (photoZone.borderRadius) {
          const radius = Math.round((photoZone.borderRadius / 1080) * size);
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

      // Add text overlays with enhanced dynamic vertical spacing
      if (template.layoutConfig.textZones?.length > 0) {
        console.log(`Processing ${template.layoutConfig.textZones.length} text zones with enhanced dynamic spacing`);
        
        // Enhanced text layout calculation system
        const textLayoutData = this.calculateTextLayout(
          template.layoutConfig.textZones,
          template.layoutConfig.photoZones?.[0],
          supporterData,
          size
        );
        
        for (const layoutData of textLayoutData) {
          console.log(`Processing enhanced text layout: "${layoutData.textContent}" of type: ${layoutData.type}`);
          console.log(`Text position: x=${layoutData.coordinates.topLeft.x}, y=${layoutData.coordinates.topLeft.y}, width=${layoutData.width}, fontSize=${layoutData.fontSize}`);

          try {
            // Use enhanced layout coordinates
            const canvas = createCanvas(layoutData.width, layoutData.height);
            const ctx = canvas.getContext('2d');

            // Set font properties
            ctx.font = `${layoutData.fontWeight} ${layoutData.fontSize}px Arial, sans-serif`;
            ctx.fillStyle = layoutData.color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Render pre-calculated lines with precise spacing
            let currentY = 0;
            for (const line of layoutData.lines) {
              ctx.fillText(line, 0, currentY);
              currentY += layoutData.lineHeight;
            }

            const textImageBuffer = canvas.toBuffer('image/png');
            const overlayPosition = {
              input: textImageBuffer,
              top: layoutData.coordinates.topLeft.y,
              left: layoutData.coordinates.topLeft.x,
            };
            
            console.log(`Added enhanced text overlay at position ${layoutData.coordinates.topLeft.x}, ${layoutData.coordinates.topLeft.y}`);
            overlays.push(overlayPosition);
            
          } catch (textError) {
            console.error('Error creating Canvas text overlay:', textError);
            
            // Fallback: create a colored rectangle to show positioning works
            const fallbackRect = await sharp({
              create: {
                width: layoutData.width,
                height: layoutData.height,
                channels: 4,
                background: { r: 0, g: 255, b: 0, alpha: 0.8 } // Green rectangle as fallback
              }
            }).png().toBuffer();

            overlays.push({
              input: fallbackRect,
              top: layoutData.coordinates.topLeft.y,
              left: layoutData.coordinates.topLeft.x,
            });
            
            console.log(`Added fallback rectangle at position ${layoutData.coordinates.topLeft.x}, ${layoutData.coordinates.topLeft.y}`);
          }
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
      x: (photoZone.x / 1080) * canvasSize,
      y: (photoZone.y / 1080) * canvasSize,
      width: (photoZone.width / 1080) * canvasSize,
      height: (photoZone.height / 1080) * canvasSize,
      centerY: ((photoZone.y + photoZone.height / 2) / 1080) * canvasSize
    };
    
    // Define text area coordinates (left side layout)
    const textAreaLeft = (50 / 1080) * canvasSize; // Left margin
    const textAreaRight = scaledPhotoZone.x - (30 / 1080) * canvasSize; // 30px gap before photo
    const textAreaWidth = textAreaRight - textAreaLeft;
    
    // Calculate name text properties
    const nameContent = nameZone.textTransform === 'uppercase' ? content.name.toUpperCase() : content.name;
    const nameBaseFontSize = nameZone.fontSize * canvasSize * 1.4; // 1.4x larger
    const nameFontSize = Math.max(nameBaseFontSize, 18);
    const nameWeight = nameZone.fontWeight === 'bold' ? 'bold' : (nameZone.fontWeight || 'normal');
    
    // Create temporary canvas to measure name text
    const tempCanvas = createCanvas(textAreaWidth, 200);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${nameWeight} ${nameFontSize}px Arial, sans-serif`;
    
    const nameLines = this.smartWrapText(tempCtx, nameContent, textAreaWidth);
    const nameLineHeight = nameFontSize * 1.25;
    const nameTotalHeight = nameLines.length * nameLineHeight;
    
    // Calculate title text properties
    const titleContent = content.title;
    const titleBaseFontSize = titleZone.fontSize * canvasSize * 1.2; // 1.2x larger
    const titleFontSize = Math.max(titleBaseFontSize, 16);
    const titleWeight = titleZone.fontWeight === 'bold' ? 'bold' : (titleZone.fontWeight || 'normal');
    
    // Measure title text
    tempCtx.font = `${titleWeight} ${titleFontSize}px Arial, sans-serif`;
    const titleLines = this.wrapText(tempCtx, titleContent, textAreaWidth);
    const titleLineHeight = titleFontSize * 1.3;
    const titleTotalHeight = titleLines.length * titleLineHeight;
    
    // Dynamic spacing between name and title based on name line count
    let nameToTitleSpacing: number;
    if (nameLines.length === 1) {
      nameToTitleSpacing = (15 / 1080) * canvasSize; // Tight spacing for single-line names
    } else if (nameLines.length === 2) {
      nameToTitleSpacing = (25 / 1080) * canvasSize; // Medium spacing for two-line names
    } else {
      nameToTitleSpacing = (35 / 1080) * canvasSize; // Generous spacing for multi-line names
    }
    
    console.log(`Dynamic spacing calculation: name has ${nameLines.length} lines, using ${nameToTitleSpacing}px spacing`);
    
    // Calculate total text block height
    const totalTextHeight = nameTotalHeight + nameToTitleSpacing + titleTotalHeight;
    
    // Center the text block vertically with the photo zone
    const textBlockStartY = scaledPhotoZone.centerY - (totalTextHeight / 2);
    
    // Name layout data
    const nameTopY = textBlockStartY;
    const nameBottomY = nameTopY + nameTotalHeight;
    const nameLayoutData = {
      type: 'name' as const,
      textContent: nameContent,
      coordinates: {
        topLeft: { x: Math.round(textAreaLeft), y: Math.round(nameTopY) },
        topRight: { x: Math.round(textAreaRight), y: Math.round(nameTopY) },
        bottomRight: { x: Math.round(textAreaRight), y: Math.round(nameBottomY) },
        bottomLeft: { x: Math.round(textAreaLeft), y: Math.round(nameBottomY) }
      },
      width: Math.round(textAreaWidth),
      height: Math.round(nameTotalHeight),
      fontSize: Math.round(nameFontSize),
      fontWeight: nameWeight,
      fontFamily: nameZone.fontFamily,
      color: nameZone.color,
      textAlign: 'left',
      lines: nameLines,
      lineHeight: nameLineHeight
    };
    
    // Title layout data
    const titleTopY = nameBottomY + nameToTitleSpacing;
    const titleBottomY = titleTopY + titleTotalHeight;
    const titleLayoutData = {
      type: 'title' as const,
      textContent: titleContent,
      coordinates: {
        topLeft: { x: Math.round(textAreaLeft), y: Math.round(titleTopY) },
        topRight: { x: Math.round(textAreaRight), y: Math.round(titleTopY) },
        bottomRight: { x: Math.round(textAreaRight), y: Math.round(titleBottomY) },
        bottomLeft: { x: Math.round(textAreaLeft), y: Math.round(titleBottomY) }
      },
      width: Math.round(textAreaWidth),
      height: Math.round(titleTotalHeight),
      fontSize: Math.round(titleFontSize),
      fontWeight: titleWeight,
      fontFamily: titleZone.fontFamily,
      color: titleZone.color,
      textAlign: 'left',
      lines: titleLines,
      lineHeight: titleLineHeight
    };
    
    return [nameLayoutData, titleLayoutData];
  }

  // Smart text wrapping for names - tries to break at better points
  private smartWrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    if (words.length === 1) {
      // Single word - use regular wrapping
      return this.wrapText(ctx, text, maxWidth);
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
          const brokenWord = this.breakLongWord(ctx, word, maxWidth);
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

  // Regular text wrapping for titles and other text
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
          const brokenWord = this.breakLongWord(ctx, word, maxWidth);
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
  }
}