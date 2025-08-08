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
              x: 100,
              y: 800,
              width: 880,
              height: 100,
              fontSize: 48,
              fontFamily: 'Arial',
              color: '#000000',
              textAlign: 'center',
            },
            {
              type: 'title',
              x: 100,
              y: 900,
              width: 880,
              height: 60,
              fontSize: 32,
              fontFamily: 'Arial',
              color: '#666666',
              textAlign: 'center',
            },
          ],
          photoZones: [
            {
              x: 390,
              y: 200,
              width: 300,
              height: 300,
              borderRadius: 150,
            },
          ],
        },
      },
      {
        name: 'Professional Blue',
        category: 'Professional',
        imageUrls: {
          thumbnail: '/templates/professional-blue-thumb.png',
          preview: '/templates/professional-blue-preview.png',
          full: '/templates/professional-blue-full.png',
        },
        layoutConfig: {
          textZones: [
            {
              type: 'name',
              x: 450,
              y: 400,
              width: 580,
              height: 80,
              fontSize: 42,
              fontFamily: 'Arial',
              color: '#FFFFFF',
              textAlign: 'left',
            },
            {
              type: 'title',
              x: 450,
              y: 480,
              width: 580,
              height: 50,
              fontSize: 28,
              fontFamily: 'Arial',
              color: '#E6F3FF',
              textAlign: 'left',
            },
          ],
          photoZones: [
            {
              x: 50,
              y: 250,
              width: 350,
              height: 350,
              borderRadius: 0,
            },
          ],
        },
      },
      {
        name: 'Community Support',
        category: 'Issue-based',
        imageUrls: {
          thumbnail: '/templates/community-support-thumb.png',
          preview: '/templates/community-support-preview.png',
          full: '/templates/community-support-full.png',
        },
        layoutConfig: {
          textZones: [
            {
              type: 'name',
              x: 100,
              y: 750,
              width: 880,
              height: 80,
              fontSize: 40,
              fontFamily: 'Arial',
              color: '#2D5A27',
              textAlign: 'center',
            },
            {
              type: 'title',
              x: 100,
              y: 830,
              width: 880,
              height: 50,
              fontSize: 26,
              fontFamily: 'Arial',
              color: '#4A7C59',
              textAlign: 'center',
            },
          ],
          photoZones: [
            {
              x: 340,
              y: 300,
              width: 400,
              height: 400,
              borderRadius: 20,
            },
          ],
        },
      },
      {
        name: 'Rally Ready',
        category: 'Event-specific',
        imageUrls: {
          thumbnail: '/templates/rally-ready-thumb.png',
          preview: '/templates/rally-ready-preview.png',
          full: '/templates/rally-ready-full.png',
        },
        layoutConfig: {
          textZones: [
            {
              type: 'name',
              x: 100,
              y: 850,
              width: 880,
              height: 70,
              fontSize: 38,
              fontFamily: 'Arial',
              color: '#FFFFFF',
              textAlign: 'center',
            },
            {
              type: 'title',
              x: 100,
              y: 920,
              width: 880,
              height: 45,
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#FFE6E6',
              textAlign: 'center',
            },
          ],
          photoZones: [
            {
              x: 290,
              y: 180,
              width: 500,
              height: 500,
              borderRadius: 250,
            },
          ],
        },
      },
      {
        name: 'Casual Supporter',
        category: 'Casual',
        imageUrls: {
          thumbnail: '/templates/casual-supporter-thumb.png',
          preview: '/templates/casual-supporter-preview.png',
          full: '/templates/casual-supporter-full.png',
        },
        layoutConfig: {
          textZones: [
            {
              type: 'name',
              x: 400,
              y: 200,
              width: 600,
              height: 60,
              fontSize: 36,
              fontFamily: 'Arial',
              color: '#333333',
              textAlign: 'left',
            },
            {
              type: 'title',
              x: 400,
              y: 260,
              width: 600,
              height: 40,
              fontSize: 22,
              fontFamily: 'Arial',
              color: '#666666',
              textAlign: 'left',
            },
          ],
          photoZones: [
            {
              x: 80,
              y: 150,
              width: 280,
              height: 280,
              borderRadius: 140,
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