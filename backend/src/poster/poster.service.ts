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
    
    const nameLines = this.intelligentWrapText(tempCtx, nameContent, textAreaWidth);
    const nameLineHeight = nameFontSize * 1.25;
    const nameTotalHeight = nameLines.length * nameLineHeight;
    
    // Calculate title text properties
    const titleContent = content.title;
    const titleBaseFontSize = titleZone.fontSize * canvasSize * 1.2; // 1.2x larger
    const titleFontSize = Math.max(titleBaseFontSize, 16);
    const titleWeight = titleZone.fontWeight === 'bold' ? 'bold' : (titleZone.fontWeight || 'normal');
    
    // Measure title text
    tempCtx.font = `${titleWeight} ${titleFontSize}px Arial, sans-serif`;
    const titleLines = this.intelligentWrapText(tempCtx, titleContent, textAreaWidth);
    const titleLineHeight = titleFontSize * 1.3;
    const titleTotalHeight = titleLines.length * titleLineHeight;
    

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

}