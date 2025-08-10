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
          // Simplified configuration - text positioning is now handled adaptively
          photoZones: [
            {
              x: 720,     // Photo positioned on the right side
              y: 400,     // Vertically centered
              width: 280, // Square photo
              height: 280,
              borderRadius: 140, // Circular photo (280/2)
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
              x: 740,
              y: 380,
              width: 260,
              height: 260,
              borderRadius: 20, // Rounded square
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
              x: 720,
              y: 360,
              width: 300,
              height: 300,
              borderRadius: 150, // Circular
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
              x: 730,
              y: 400,
              width: 240,
              height: 240,
              borderRadius: 12, // Slightly rounded
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