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
              // Text zone positioned to the right of photo zone with vertical centering
              coordinates: {
                topLeft: { x: 252.64, y: 902.88 }, // Photo right edge + spacing, vertically centered
                topRight: { x: 652.76, y: 902.88 }, // Right edge of poster
                bottomRight: { x: 652.76, y: 962.88 }, // 902.88 + 60 (name height)
                bottomLeft: { x: 252.64, y: 962.88 }
              },
              // Legacy support (will be deprecated)
              x: 252.64, // Photo right edge + spacing
              y: 902.88, // Vertically centered with photo zone center
              width: 400.12, // 652.76 - 252.64 = available width
              height: 60, // Reduced height for better spacing
              fontSize: 0.0278, // 30px at 1080px (30/1080)
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#000000',
              textAlign: 'left',
              textTransform: 'uppercase',
            },
            {
              type: 'title',
              // Title positioned directly below name in the text zone container
              coordinates: {
                topLeft: { x: 252.64, y: 972.88 }, // Same x as name, y = name bottom + 10px spacing
                topRight: { x: 652.76, y: 972.88 }, // Right edge of poster
                bottomRight: { x: 652.76, y: 1022.88 }, // 972.88 + 50 (title height)
                bottomLeft: { x: 252.64, y: 1022.88 }
              },
              // Legacy support (will be deprecated)
              x: 252.64, // Same x as name
              y: 972.88, // Below name with 10px spacing
              width: 400.12, // Same width as name
              height: 50, // Reduced height for better spacing
              fontSize: 0.0222, // 24px at 1080px (24/1080)
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