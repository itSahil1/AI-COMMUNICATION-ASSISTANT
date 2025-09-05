import { 
  users, emails, responses, emailAnalytics,
  type User, type InsertUser,
  type Email, type InsertEmail,
  type Response, type InsertResponse,
  type Analytics, type InsertAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, count, avg, sum, gte, lte, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Email management
  createEmail(email: InsertEmail): Promise<Email>;
  getEmails(filters?: {
    status?: string;
    priority?: string;
    sentiment?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Email[]>;
  getEmailById(id: string): Promise<Email | undefined>;
  updateEmail(id: string, updates: Partial<Email>): Promise<Email>;
  getEmailsByPriority(priority: 'urgent' | 'normal' | 'low'): Promise<Email[]>;

  // Response management
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByEmailId(emailId: string): Promise<Response[]>;
  updateResponse(id: string, updates: Partial<Response>): Promise<Response>;

  // Analytics
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]>;
  getDashboardStats(): Promise<{
    totalToday: number;
    urgent: number;
    resolved: number;
    pending: number;
  }>;
  getSentimentDistribution(): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }>;
  getCategoryDistribution(): Promise<Array<{
    category: string;
    count: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [newEmail] = await db.insert(emails).values(email).returning();
    return newEmail;
  }

  async getEmails(filters?: {
    status?: string;
    priority?: string;
    sentiment?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Email[]> {
    let query = db.select().from(emails);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(emails.status, filters.status as any));
    }
    
    if (filters?.priority) {
      conditions.push(eq(emails.priority, filters.priority as any));
    }
    
    if (filters?.sentiment) {
      conditions.push(eq(emails.sentiment, filters.sentiment as any));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          like(emails.subject, `%${filters.search}%`),
          like(emails.body, `%${filters.search}%`),
          like(emails.sender, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Always order by priority (urgent first) then by received time (newest first)
    query = query
      .orderBy(
        sql`CASE WHEN ${emails.priority} = 'urgent' THEN 0 WHEN ${emails.priority} = 'normal' THEN 1 ELSE 2 END`,
        desc(emails.receivedAt)
      );
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return query;
  }

  async getEmailById(id: string): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email> {
    const [email] = await db
      .update(emails)
      .set(updates)
      .where(eq(emails.id, id))
      .returning();
    return email;
  }

  async getEmailsByPriority(priority: 'urgent' | 'normal' | 'low'): Promise<Email[]> {
    return db.select().from(emails)
      .where(eq(emails.priority, priority))
      .orderBy(desc(emails.receivedAt));
  }

  async createResponse(response: InsertResponse): Promise<Response> {
    const [newResponse] = await db.insert(responses).values(response).returning();
    return newResponse;
  }

  async getResponsesByEmailId(emailId: string): Promise<Response[]> {
    return db.select().from(responses)
      .where(eq(responses.emailId, emailId))
      .orderBy(desc(responses.createdAt));
  }

  async updateResponse(id: string, updates: Partial<Response>): Promise<Response> {
    const [response] = await db
      .update(responses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(responses.id, id))
      .returning();
    return response;
  }

  async createAnalytics(analytics: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db.insert(emailAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return db.select().from(emailAnalytics)
      .where(and(
        gte(emailAnalytics.date, startDate),
        lte(emailAnalytics.date, endDate)
      ))
      .orderBy(asc(emailAnalytics.date));
  }

  async getDashboardStats(): Promise<{
    totalToday: number;
    urgent: number;
    resolved: number;
    pending: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [stats] = await db
      .select({
        totalToday: count(),
        urgent: sum(sql`CASE WHEN ${emails.priority} = 'urgent' THEN 1 ELSE 0 END`).mapWith(Number),
        resolved: sum(sql`CASE WHEN ${emails.status} = 'resolved' THEN 1 ELSE 0 END`).mapWith(Number),
        pending: sum(sql`CASE WHEN ${emails.status} = 'pending' THEN 1 ELSE 0 END`).mapWith(Number),
      })
      .from(emails)
      .where(gte(emails.receivedAt, today));
    
    return {
      totalToday: Number(stats.totalToday),
      urgent: stats.urgent || 0,
      resolved: stats.resolved || 0,
      pending: stats.pending || 0,
    };
  }

  async getSentimentDistribution(): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    const [stats] = await db
      .select({
        positive: sum(sql`CASE WHEN ${emails.sentiment} = 'positive' THEN 1 ELSE 0 END`).mapWith(Number),
        neutral: sum(sql`CASE WHEN ${emails.sentiment} = 'neutral' THEN 1 ELSE 0 END`).mapWith(Number),
        negative: sum(sql`CASE WHEN ${emails.sentiment} = 'negative' THEN 1 ELSE 0 END`).mapWith(Number),
      })
      .from(emails);
    
    return {
      positive: stats.positive || 0,
      neutral: stats.neutral || 0,
      negative: stats.negative || 0,
    };
  }

  async getCategoryDistribution(): Promise<Array<{
    category: string;
    count: number;
  }>> {
    // This is a simplified version - in reality you'd extract categories from extractedInfo
    const results = await db
      .select({
        category: sql<string>`COALESCE(${emails.extractedInfo}->>'category', 'Uncategorized')`,
        count: count(),
      })
      .from(emails)
      .groupBy(sql`COALESCE(${emails.extractedInfo}->>'category', 'Uncategorized')`)
      .orderBy(desc(count()));
    
    return results.map(r => ({
      category: r.category,
      count: Number(r.count),
    }));
  }
}

export const storage = new DatabaseStorage();
