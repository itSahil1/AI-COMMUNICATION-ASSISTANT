import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default('support'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const priorityEnum = pgEnum("priority", ["urgent", "normal", "low"]);
export const statusEnum = pgEnum("status", ["pending", "resolved", "draft"]);

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: text("message_id").notNull().unique(),
  subject: text("subject").notNull(),
  sender: text("sender").notNull(),
  senderName: text("sender_name"),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  receivedAt: timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  sentiment: sentimentEnum("sentiment").notNull().default("neutral"),
  priority: priorityEnum("priority").notNull().default("normal"),
  status: statusEnum("status").notNull().default("pending"),
  extractedInfo: jsonb("extracted_info").$type<{
    phone?: string;
    alternateEmail?: string;
    category?: string;
    keywords?: string[];
    urgencyIndicators?: string[];
    customerType?: string;
  }>(),
  sentimentScore: integer("sentiment_score").default(0), // -100 to 100
  confidenceScore: integer("confidence_score").default(0), // 0 to 100
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id),
  userId: varchar("user_id").references(() => users.id),
  content: text("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull().default(true),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailAnalytics = pgTable("email_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  totalEmails: integer("total_emails").notNull().default(0),
  urgentEmails: integer("urgent_emails").notNull().default(0),
  resolvedEmails: integer("resolved_emails").notNull().default(0),
  pendingEmails: integer("pending_emails").notNull().default(0),
  positiveEmails: integer("positive_emails").notNull().default(0),
  neutralEmails: integer("neutral_emails").notNull().default(0),
  negativeEmails: integer("negative_emails").notNull().default(0),
  avgResponseTimeMinutes: integer("avg_response_time_minutes").default(0),
});

export const emailRelations = relations(emails, ({ one, many }) => ({
  responses: many(responses),
}));

export const responseRelations = relations(responses, ({ one }) => ({
  email: one(emails, {
    fields: [responses.emailId],
    references: [emails.id],
  }),
  user: one(users, {
    fields: [responses.userId],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  responses: many(responses),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  processedAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(emailAnalytics).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Analytics = typeof emailAnalytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
