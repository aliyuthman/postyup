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
          // Photo zone with exact Photoshop specifications (2000x2000 canvas)
          photoZones: [
            {
              x: 88,      // Exact X position from Photoshop
              y: 1607,    // Exact Y position from Photoshop  
              width: 368, // Exact width from Photoshop
              height: 368, // Exact height from Photoshop
              borderRadius: 184, // Circular photo (368/2)
            },
          ],
        },
      },
      {
        name: 'Modern Campaign',
        category: 'Campaign',
        imageUrls: {
          thumbnail: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/modern-campaign-thumb.png',
          preview: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/modern-campaign-preview.png',
          full: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/modern-campaign-full.png',
        },
        layoutConfig: {
          photoZones: [
            {
              x: 88,      // Consistent positioning across templates
              y: 1607,    // Consistent positioning across templates
              width: 368, // Consistent sizing across templates
              height: 368,
              borderRadius: 184, // Circular photo
            },
          ],
        },
      },
      {
        name: 'Bold Statement',
        category: 'Event',
        imageUrls: {
          thumbnail: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/bold-statement-thumb.png',
          preview: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/bold-statement-preview.png',
          full: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/bold-statement-full.png',
        },
        layoutConfig: {
          photoZones: [
            {
              x: 88,      // Consistent positioning across templates
              y: 1607,    // Consistent positioning across templates
              width: 368, // Consistent sizing across templates
              height: 368,
              borderRadius: 184, // Circular photo
            },
          ],
        },
      },
      {
        name: 'Professional Announcement',
        category: 'Announcement',
        imageUrls: {
          thumbnail: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/professional-announcement-thumb.png',
          preview: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/professional-announcement-preview.png',
          full: 'https://avaysnbvpbdpjdprxubu.supabase.co/storage/v1/object/public/template-assets/professional-announcement-full.png',
        },
        layoutConfig: {
          photoZones: [
            {
              x: 88,      // Consistent positioning across templates
              y: 1607,    // Consistent positioning across templates
              width: 368, // Consistent sizing across templates
              height: 368,
              borderRadius: 184, // Circular photo
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