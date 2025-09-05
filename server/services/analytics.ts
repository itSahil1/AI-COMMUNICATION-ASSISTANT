import { storage } from '../storage';
import type { InsertAnalytics } from '@shared/schema';

export class AnalyticsService {
  async updateDailyAnalytics(date: Date = new Date()): Promise<void> {
    try {
      // Normalize date to start of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get emails for the day
      const dayEmails = await storage.getEmails({});
      
      const emailsForDay = dayEmails.filter(email => {
        const emailDate = new Date(email.receivedAt);
        return emailDate >= startOfDay && emailDate <= endOfDay;
      });

      // Calculate statistics
      const totalEmails = emailsForDay.length;
      const urgentEmails = emailsForDay.filter(e => e.priority === 'urgent').length;
      const resolvedEmails = emailsForDay.filter(e => e.status === 'resolved').length;
      const pendingEmails = emailsForDay.filter(e => e.status === 'pending').length;
      const positiveEmails = emailsForDay.filter(e => e.sentiment === 'positive').length;
      const neutralEmails = emailsForDay.filter(e => e.sentiment === 'neutral').length;
      const negativeEmails = emailsForDay.filter(e => e.sentiment === 'negative').length;

      // Calculate average response time (simplified)
      const resolvedEmailsWithResponses = await Promise.all(
        emailsForDay
          .filter(e => e.status === 'resolved')
          .map(async (email) => {
            const responses = await storage.getResponsesByEmailId(email.id);
            return {
              email,
              firstResponse: responses.length > 0 ? responses[responses.length - 1] : null
            };
          })
      );

      const responseTimes = resolvedEmailsWithResponses
        .filter(item => item.firstResponse)
        .map(item => {
          const emailTime = new Date(item.email.receivedAt).getTime();
          const responseTime = new Date(item.firstResponse!.createdAt).getTime();
          return (responseTime - emailTime) / (1000 * 60); // Convert to minutes
        });

      const avgResponseTimeMinutes = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      // Create analytics record
      const analyticsData: InsertAnalytics = {
        date: startOfDay,
        totalEmails,
        urgentEmails,
        resolvedEmails,
        pendingEmails,
        positiveEmails,
        neutralEmails,
        negativeEmails,
        avgResponseTimeMinutes,
      };

      await storage.createAnalytics(analyticsData);
      
      console.log(`Updated analytics for ${startOfDay.toDateString()}: ${totalEmails} emails processed`);
    } catch (error) {
      console.error('Error updating daily analytics:', error);
    }
  }

  async getWeeklyAnalytics(): Promise<{
    volumeData: Array<{ day: string; count: number }>;
    sentimentData: { positive: number; neutral: number; negative: number };
    responseTimeData: Array<{ day: string; avgTime: number }>;
    categoryData: Array<{ category: string; count: number }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const analytics = await storage.getAnalytics(startDate, endDate);
      
      const volumeData = analytics.map(a => ({
        day: a.date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: a.totalEmails
      }));

      const sentimentData = analytics.reduce(
        (acc, a) => ({
          positive: acc.positive + a.positiveEmails,
          neutral: acc.neutral + a.neutralEmails,
          negative: acc.negative + a.negativeEmails,
        }),
        { positive: 0, neutral: 0, negative: 0 }
      );

      const responseTimeData = analytics.map(a => ({
        day: a.date.toLocaleDateString('en-US', { weekday: 'short' }),
        avgTime: a.avgResponseTimeMinutes || 0
      }));

      const categoryData = await storage.getCategoryDistribution();

      return {
        volumeData,
        sentimentData,
        responseTimeData,
        categoryData: categoryData.slice(0, 10) // Top 10 categories
      };
    } catch (error) {
      console.error('Error getting weekly analytics:', error);
      return {
        volumeData: [],
        sentimentData: { positive: 0, neutral: 0, negative: 0 },
        responseTimeData: [],
        categoryData: []
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
