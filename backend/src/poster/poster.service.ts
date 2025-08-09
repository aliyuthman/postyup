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

      // Add text overlays using Fabric.js for professional text rendering
      if (template.layoutConfig.textZones?.length > 0) {
        console.log(`Processing ${template.layoutConfig.textZones.length} text zones with Fabric.js`);
        
        for (const textZone of template.layoutConfig.textZones) {
          let textContent = textZone.type === 'name' ? supporterData.name : supporterData.title;
          if (!textContent) continue;

          console.log(`Processing text: "${textContent}" of type: ${textZone.type}`);

          // Apply text transformations
          if (textZone.textTransform === 'uppercase') {
            textContent = textContent.toUpperCase();
          }

          const textX = Math.round((textZone.x / 1080) * size);
          const textY = Math.round((textZone.y / 1080) * size);
          const textWidth = Math.round((textZone.width / 1080) * size);
          const textHeight = Math.round((textZone.height / 1080) * size);
          const fontSize = Math.round(textZone.fontSize * size); // fontSize is now a percentage
          
          console.log(`Text position: x=${textX}, y=${textY}, width=${textWidth}, fontSize=${fontSize}`);

          try {
            // Create canvas for text rendering using native Canvas API
            const canvas = createCanvas(textWidth, textHeight);
            const ctx = canvas.getContext('2d');

            // Set font properties
            const fontWeight = textZone.fontWeight === 'bold' ? 'bold' : 'normal';
            ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
            ctx.fillStyle = textZone.color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Simple text wrapping
            const words = textContent.split(' ');
            let line = '';
            let y = 0;
            const lineHeight = fontSize * 1.2;

            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > textWidth && i > 0) {
                ctx.fillText(line, 0, y);
                line = words[i] + ' ';
                y += lineHeight;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, 0, y);

            // Get buffer
            const textImageBuffer = canvas.toBuffer('image/png');

            overlays.push({
              input: textImageBuffer,
              top: textY,
              left: textX,
            });
            
            console.log(`Added Canvas text overlay at position ${textX}, ${textY}`);
          } catch (textError) {
            console.error('Error creating Canvas text overlay:', textError);
            
            // Fallback: create a colored rectangle to show positioning works
            const fallbackRect = await sharp({
              create: {
                width: textWidth,
                height: textHeight,
                channels: 4,
                background: { r: 0, g: 255, b: 0, alpha: 0.8 } // Green rectangle as fallback
              }
            }).png().toBuffer();

            overlays.push({
              input: fallbackRect,
              top: textY,
              left: textX,
            });
            
            console.log(`Added fallback rectangle at position ${textX}, ${textY}`);
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
}