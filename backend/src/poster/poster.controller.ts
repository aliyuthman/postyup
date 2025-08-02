import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PosterService } from './poster.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api/poster')
export class PosterController {
  constructor(private readonly posterService: PosterService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate poster with supporter data' })
  @ApiResponse({ status: 200, description: 'Poster generated successfully' })
  async generatePoster(
    @Body()
    generateData: {
      templateId: string;
      supporterData: { name: string; title: string };
      photoUrl: string;
      sessionId: string;
    }
  ) {
    const { templateId, supporterData, photoUrl, sessionId } = generateData;

    // Validate required fields
    if (!templateId || !supporterData?.name || !supporterData?.title || !photoUrl || !sessionId) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.posterService.generatePoster(
        templateId,
        supporterData,
        photoUrl,
        sessionId
      );

      return {
        previewUrl: result.previewUrl,
        finalUrl: result.finalUrl,
        message: 'Poster generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Poster generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}