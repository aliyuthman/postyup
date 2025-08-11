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
          // Photo zone with optimized debug coordinates (2000x2000 canvas)
          photoZones: [
            {
              x: 102,     // Optimized X position from debug mode
              y: 1617,    // Optimized Y position from debug mode
              width: 330, // Optimized width from debug mode
              height: 330, // Optimized height from debug mode
              borderRadius: 165, // Circular photo (330/2)
            },
          ],
          // Text zones with optimized debug coordinates
          textZones: [
            {
              type: 'name',
              x: 500,     // Optimized name X position
              y: 1780,    // Optimized name Y position (bottom of text box)
              width: 843,  // Optimized name text box width
              height: 160, // Optimized name text box height
              fontSize: 58.33, // Optimized name font size
              fontFamily: 'Inter',
              fontWeight: '700',
              color: '#1a1a1a',
              textAlign: 'left',
              letterSpacing: -0.05
            },
            {
              type: 'title',
              x: 500,     // Optimized title X position
              y: 1950,    // Optimized title Y position (bottom of text box) - moved 6px up from original
              width: 660,  // Optimized title text box width
              height: 160, // Optimized title text box height
              fontSize: 50, // Optimized title font size
              fontFamily: 'Inter',
              fontWeight: '400',
              color: '#605e5e',
              textAlign: 'left',
              letterSpacing: -0.025
            }
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
              x: 102,     // Consistent optimized positioning
              y: 1617,    // Consistent optimized positioning
              width: 330, // Consistent optimized sizing
              height: 330,
              borderRadius: 165, // Circular photo (330/2)
            },
          ],
          textZones: [
            {
              type: 'name',
              x: 500, y: 1780, width: 843, height: 160,
              fontSize: 58.33, fontFamily: 'Inter', fontWeight: '700',
              color: '#1a1a1a', textAlign: 'left', letterSpacing: -0.05
            },
            {
              type: 'title',
              x: 500, y: 1950, width: 660, height: 160,
              fontSize: 50, fontFamily: 'Inter', fontWeight: '400',
              color: '#605e5e', textAlign: 'left', letterSpacing: -0.025
            }
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
              x: 102,     // Consistent optimized positioning
              y: 1617,    // Consistent optimized positioning
              width: 330, // Consistent optimized sizing
              height: 330,
              borderRadius: 165, // Circular photo (330/2)
            },
          ],
          textZones: [
            {
              type: 'name',
              x: 500, y: 1780, width: 843, height: 160,
              fontSize: 58.33, fontFamily: 'Inter', fontWeight: '700',
              color: '#1a1a1a', textAlign: 'left', letterSpacing: -0.05
            },
            {
              type: 'title',
              x: 500, y: 1950, width: 660, height: 160,
              fontSize: 50, fontFamily: 'Inter', fontWeight: '400',
              color: '#605e5e', textAlign: 'left', letterSpacing: -0.025
            }
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
              x: 102,     // Consistent optimized positioning
              y: 1617,    // Consistent optimized positioning
              width: 330, // Consistent optimized sizing
              height: 330,
              borderRadius: 165, // Circular photo (330/2)
            },
          ],
          textZones: [
            {
              type: 'name',
              x: 500, y: 1780, width: 843, height: 160,
              fontSize: 58.33, fontFamily: 'Inter', fontWeight: '700',
              color: '#1a1a1a', textAlign: 'left', letterSpacing: -0.05
            },
            {
              type: 'title',
              x: 500, y: 1950, width: 660, height: 160,
              fontSize: 50, fontFamily: 'Inter', fontWeight: '400',
              color: '#605e5e', textAlign: 'left', letterSpacing: -0.025
            }
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