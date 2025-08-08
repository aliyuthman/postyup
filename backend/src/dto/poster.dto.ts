import { IsNotEmpty, IsString, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SupporterDataDto {
  @ApiProperty({ description: 'Supporter name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Supporter title/position' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class GeneratePosterDto {
  @ApiProperty({ description: 'Template ID' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Supporter information' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SupporterDataDto)
  supporterData: SupporterDataDto;

  @ApiProperty({ description: 'URL of the user photo' })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;

  @ApiProperty({ description: 'Session ID' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  sessionId: string;
}