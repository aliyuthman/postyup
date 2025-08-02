import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload user photo' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (!sessionId) {
      throw new HttpException('Session ID required', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new HttpException('Only image files allowed', HttpStatus.BAD_REQUEST);
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new HttpException('File too large (max 5MB)', HttpStatus.BAD_REQUEST);
    }

    try {
      const photoUrl = await this.photoService.uploadPhoto(file, sessionId);
      return { photoUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Upload failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('crop')
  @ApiOperation({ summary: 'Crop uploaded photo' })
  @ApiResponse({ status: 200, description: 'Photo cropped successfully' })
  async cropPhoto(
    @Body()
    cropData: {
      photoUrl: string;
      cropParams: { x: number; y: number; width: number; height: number };
      sessionId: string;
    }
  ) {
    const { photoUrl, cropParams, sessionId } = cropData;

    if (!photoUrl || !cropParams || !sessionId) {
      throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST);
    }

    try {
      const croppedPhotoUrl = await this.photoService.cropPhoto(
        photoUrl,
        cropParams,
        sessionId
      );
      return { croppedPhotoUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Crop failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}