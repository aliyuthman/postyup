import { Controller, Post, Body, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track user action' })
  @ApiResponse({ status: 200, description: 'Action tracked successfully' })
  async trackAction(
    @Body()
    trackData: {
      sessionId: string;
      actionType: string;
      templateId?: string;
    }
  ) {
    const { sessionId, actionType, templateId } = trackData;

    if (!sessionId || !actionType) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.analyticsService.trackAction(sessionId, actionType, templateId);
      return { message: 'Action tracked successfully' };
    } catch (error) {
      // Analytics failures shouldn't break user flow
      return { message: 'Action tracking failed, but continuing' };
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  async getAnalyticsSummary() {
    try {
      const summary = await this.analyticsService.getAnalyticsSummary();
      return { summary };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}