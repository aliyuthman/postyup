import { pgTable, uuid, varchar, text, timestamp, json, serial } from 'drizzle-orm/pg-core';

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  imageUrls: json('image_urls').notNull(), // { thumbnail: string, preview: string, full: string }
  layoutConfig: json('layout_config').notNull(), // text zones, photo zones, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(), // 'poster_generated', 'template_selected', 'photo_uploaded', 'poster_shared', 'poster_downloaded'
  templateId: uuid('template_id').references(() => templates.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  supporterData: json('supporter_data'), // { name: string, title: string }
  photoData: json('photo_data'), // { url: string, cropData: object }
  selectedTemplate: uuid('selected_template').references(() => templates.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;