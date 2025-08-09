import { Controller, Get, Param, Post, Put, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TemplateService } from './template.service';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('api/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getAllTemplates() {
    console.log('Get all templates endpoint called');
    try {
      console.log('About to call getAllTemplates service');
      const templates = await this.templateService.getAllTemplates();
      console.log('Get all templates service completed, found:', templates.length);
      return { templates };
    } catch (error) {
      console.error('Error in getAllTemplates controller:', error);
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

  @Put(':id')
  @ApiOperation({ summary: 'Update template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(@Param('id') id: string, @Body() updateData: any) {
    try {
      const template = await this.templateService.updateTemplate(id, updateData);
      if (!template) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }
      return { template };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample templates' })
  @ApiResponse({ status: 200, description: 'Templates seeded successfully' })
  async seedTemplates() {
    console.log('Seed endpoint called');
    try {
      console.log('About to call seedSampleTemplates service');
      await this.templateService.seedSampleTemplates();
      console.log('Seed service completed successfully');
      return { message: 'Sample templates seeded successfully' };
    } catch (error) {
      console.error('Error in seed controller:', error);
      throw new HttpException(
        'Failed to seed templates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}