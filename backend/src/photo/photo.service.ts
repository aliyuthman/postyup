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
        .resize(2000, 2000, { fit: 'cover' })
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
      console.log('Cropping photo:', { photoUrl, cropData, sessionId });
      
      // Download the original photo
      const response = await fetch(photoUrl);
      const buffer = await response.arrayBuffer();
      
      // Get image metadata to validate crop bounds
      const metadata = await sharp(Buffer.from(buffer)).metadata();
      console.log('Original image metadata:', { 
        width: metadata.width, 
        height: metadata.height,
        format: metadata.format
      });

      // Apply crop with Sharp - extract the exact crop area without additional resizing
      const extractParams = {
        left: Math.round(cropData.x),
        top: Math.round(cropData.y),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height),
      };
      console.log('Sharp extract params:', extractParams);
      
      const croppedImage = await sharp(Buffer.from(buffer))
        .extract(extractParams)
        .jpeg({ quality: 90 })
        .toBuffer();
        
      // Get metadata of cropped image
      const croppedMetadata = await sharp(croppedImage).metadata();
      console.log('Cropped image metadata:', {
        width: croppedMetadata.width,
        height: croppedMetadata.height,
        size: croppedImage.length
      });

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
