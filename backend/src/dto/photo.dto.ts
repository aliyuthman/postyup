import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({ description: 'Session ID for tracking the user session' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  sessionId: string;
}

export class CropPhotoDto {
  @ApiProperty({ description: 'URL of the uploaded photo' })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;

  @ApiProperty({ description: 'Crop parameters' })
  @IsNotEmpty()
  cropParams: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @ApiProperty({ description: 'Session ID' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  sessionId: string;
}