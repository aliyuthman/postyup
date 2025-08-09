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
    console.log('Starting template seeding...');
    
    // Clear all existing templates first
    console.log('Clearing all existing templates...');
    await db.delete(templates);
    console.log('All templates cleared successfully');
    
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
              x: 282.07,
              y: 893.34,
              width: 370.69,
              height: 120,
              fontSize: 0.0292, // 2.92% - converted from 14pt at 300 DPI (31.5/1080)
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#000000',
              textAlign: 'left',
              textTransform: 'uppercase',
            },
            {
              type: 'title',
              x: 284.23,
              y: 967.97,
              width: 368.53,
              height: 100,
              fontSize: 0.025, // 2.5% - converted from 12pt at 300 DPI (27/1080)
              fontFamily: 'Inter',
              fontWeight: 'normal',
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

    try {
      // Insert fresh templates
      for (const template of sampleTemplates) {
        console.log(`Inserting template: ${template.name}`);
        await db.insert(templates).values(template);
        console.log(`Successfully inserted template: ${template.name}`);
      }
      console.log('Template seeding completed successfully');
    } catch (error) {
      console.error('Error during template seeding:', error);
      throw error;
    }
  }
}