import { Controller, Get, Param, Post, HttpException, HttpStatus } from '@nestjs/common';
import { TemplateService } from './template.service';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('api/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAllTemplates() {
    try {
      const templates = await this.templateService.getAllTemplates();
      return { templates };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiParam({ name: 'category', description: 'Template category' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplatesByCategory(@Param('category') category: string) {
    try {
      const templates = await this.templateService.getTemplatesByCategory(category);
      return { templates };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplateById(@Param('id') id: string) {
    try {
      const template = await this.templateService.getTemplateById(id);
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      return { template };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample templates' })
  @ApiResponse({ status: 200, description: 'Templates seeded successfully' })
  async seedTemplates() {
    try {
      await this.templateService.seedSampleTemplates();
      return { message: 'Sample templates seeded successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to seed templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}