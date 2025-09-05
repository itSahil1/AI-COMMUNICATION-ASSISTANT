export interface Email {
  id: string;
  messageId: string;
  subject: string;
  sender: string;
  senderName?: string;
  body: string;
  htmlBody?: string;
  receivedAt: string;
  processedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'resolved' | 'draft';
  extractedInfo?: {
    phone?: string;
    alternateEmail?: string;
    category?: string;
    keywords?: string[];
    urgencyIndicators?: string[];
    customerType?: string;
  };
  sentimentScore?: number;
  confidenceScore?: number;
}

export interface Response {
  id: string;
  emailId: string;
  userId?: string;
  content: string;
  isAiGenerated: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalToday: number;
  urgent: number;
  resolved: number;
  pending: number;
}

export interface WeeklyAnalytics {
  volumeData: Array<{ day: string; count: number }>;
  sentimentData: { positive: number; neutral: number; negative: number };
  responseTimeData: Array<{ day: string; avgTime: number }>;
  categoryData: Array<{ category: string; count: number }>;
}

export interface EmailFilters {
  status?: string;
  priority?: string;
  sentiment?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
