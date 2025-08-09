import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as sharp from 'sharp';

@Injectable()
export class PhotoService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async uploadPhoto(file: Express.Multer.File, sessionId: string): Promise<string> {
    try {
      // Process image with Sharp
      const processedImage = await sharp(file.buffer)
        .resize(1080, 1080, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Generate unique filename
      const filename = `${sessionId}_${Date.now()}.jpg`;
      const filePath = `photos/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('user-photos')
        .upload(filePath, processedImage, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      throw new Error(`Photo processing failed: ${error.message}`);
    }
  }

  async cropPhoto(
    photoUrl: string,
    cropData: { x: number; y: number; width: number; height: number },
    sessionId: string
  ): Promise<string> {
    try {
      // Download the original photo
      const response = await fetch(photoUrl);
      const buffer = await response.arrayBuffer();

      // Apply crop with Sharp
      const croppedImage = await sharp(Buffer.from(buffer))
        .extract({
          left: Math.round(cropData.x),
          top: Math.round(cropData.y),
          width: Math.round(cropData.width),
          height: Math.round(cropData.height),
        })
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Upload cropped image
      const filename = `${sessionId}_cropped_${Date.now()}.jpg`;
      const filePath = `photos/cropped/${filename}`;

      const { data, error } = await this.supabase.storage
        .from('user-photos')
        .upload(filePath, croppedImage, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Crop upload failed: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      throw new Error(`Photo cropping failed: ${error.message}`);
    }
  }
}