import { Injectable } from '@nestjs/common';
import { db } from '../db/connection';
import { templates, type Template } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TemplateService {
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.category, category));
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const result = await db.select().from(templates).where(eq(templates.id, id));
    return result[0] || null;
  }

  async createTemplate(templateData: {
    name: string;
    category: string;
    imageUrls: { thumbnail: string; preview: string; full: string };
    layoutConfig: any;
  }): Promise<Template> {
    const result = await db.insert(templates).values(templateData).returning();
    return result[0];
  }

  async updateTemplate(id: string, templateData: {
    name?: string;
    category?: string;
    imageUrls?: { thumbnail: string; preview: string; full: string };
    layoutConfig?: any;
  }): Promise<Template | null> {
    const result = await db.update(templates).set(templateData).where(eq(templates.id, id)).returning();
    return result[0] || null;
  }

  async seedSampleTemplates(): Promise<void> {
    const sampleTemplates = [
      {
        name: 'Classic Endorsement',
        category: 'Endorsement',
        imageUrls: {
          thumbnail: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/classic-endorsement-thumb.png',
          preview: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/classic-endorsement-preview.png',
          full: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/classic-endorsement-full.png',
        },
        layoutConfig: {
          textZones: [
            {
              type: 'name',
              x: 282.27,
              y: 895.34,
              width: 371.29,
              height: 78.43,
              fontSize: 18,
              fontFamily: 'Inter',
              color: '#000000',
              textAlign: 'left',
            },
            {
              type: 'title',
              x: 284.43,
              y: 969.57,
              width: 369.13,
              height: 63.45,
              fontSize: 16,
              fontFamily: 'Inter',
              color: '#666666',
              textAlign: 'left',
            },
          ],
          photoZones: [
            {
              x: 52.8,
              y: 872.96,
              width: 179.84,
              height: 179.84,
              borderRadius: 89.92,
            },
          ],
        },
      },
    ];

    for (const template of sampleTemplates) {
      // Try to update existing template first
      const existingTemplate = await db.select().from(templates).where(eq(templates.name, template.name));
      if (existingTemplate.length > 0) {
        // Update existing template
        await db.update(templates).set(template).where(eq(templates.name, template.name));
      } else {
        // Insert new template
        await db.insert(templates).values(template);
      }
    }
  }
}