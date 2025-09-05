import { Imap, ImapMessage } from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { gmail_v1, google } from 'googleapis';
import { storage } from '../storage';
import { analyzeEmail, generateResponse } from './openai';
import type { InsertEmail } from '@shared/schema';

export interface EmailConfig {
  provider: 'gmail' | 'imap';
  gmail?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  imap?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
}

export class EmailService {
  private config: EmailConfig;
  private gmail?: gmail_v1.Gmail;

  constructor(config: EmailConfig) {
    this.config = config;
    
    if (config.provider === 'gmail' && config.gmail) {
      const oauth2Client = new google.auth.OAuth2(
        config.gmail.clientId,
        config.gmail.clientSecret
      );
      
      oauth2Client.setCredentials({
        refresh_token: config.gmail.refreshToken,
      });
      
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    }
  }

  async fetchEmails(): Promise<void> {
    if (this.config.provider === 'gmail') {
      await this.fetchGmailEmails();
    } else {
      await this.fetchImapEmails();
    }
  }

  private async fetchGmailEmails(): Promise<void> {
    if (!this.gmail) throw new Error('Gmail not configured');

    try {
      // Search for support-related emails
      const searchQuery = 'subject:(support OR query OR request OR help) is:unread';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults: 50,
      });

      if (!response.data.messages) return;

      for (const message of response.data.messages) {
        if (!message.id) continue;

        const emailData = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        await this.processEmailMessage(emailData.data);
      }
    } catch (error) {
      console.error('Error fetching Gmail emails:', error);
      throw error;
    }
  }

  private async fetchImapEmails(): Promise<void> {
    if (!this.config.imap) throw new Error('IMAP not configured');

    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config.imap!);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Search for unread emails with support keywords
          const searchCriteria = [
            'UNSEEN',
            ['OR', 'SUBJECT', 'support'],
            ['OR', 'SUBJECT', 'query'],
            ['OR', 'SUBJECT', 'request'],
            ['OR', 'SUBJECT', 'help']
          ];

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results.length) {
              resolve();
              return;
            }

            const fetch = imap.fetch(results, { bodies: '' });

            fetch.on('message', (msg: ImapMessage) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }

                  await this.processImapMessage(parsed);
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve();
            });
          });
        });
      });

      imap.once('error', reject);
      imap.connect();
    });
  }

  private async processEmailMessage(gmailMessage: gmail_v1.Schema$Message): Promise<void> {
    try {
      const headers = gmailMessage.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const messageId = headers.find(h => h.name === 'Message-ID')?.value || gmailMessage.id || '';
      const date = headers.find(h => h.name === 'Date')?.value;

      // Extract sender email from "Name <email@domain.com>" format
      const senderMatch = from.match(/<(.+)>/) || from.match(/(\S+@\S+)/);
      const senderEmail = senderMatch ? senderMatch[1] : from;
      const senderName = from.replace(/<.*>/, '').trim();

      // Get email body
      let body = '';
      let htmlBody = '';

      if (gmailMessage.payload?.body?.data) {
        body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString();
      } else if (gmailMessage.payload?.parts) {
        for (const part of gmailMessage.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            htmlBody = Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }

      await this.processEmail({
        messageId,
        subject,
        sender: senderEmail,
        senderName: senderName || undefined,
        body,
        htmlBody: htmlBody || undefined,
        receivedAt: date ? new Date(date) : new Date(),
      });
    } catch (error) {
      console.error('Error processing Gmail message:', error);
    }
  }

  private async processImapMessage(parsed: ParsedMail): Promise<void> {
    try {
      await this.processEmail({
        messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
        subject: parsed.subject || '',
        sender: parsed.from?.value[0]?.address || '',
        senderName: parsed.from?.value[0]?.name || undefined,
        body: parsed.text || '',
        htmlBody: parsed.html || undefined,
        receivedAt: parsed.date || new Date(),
      });
    } catch (error) {
      console.error('Error processing IMAP message:', error);
    }
  }

  private async processEmail(emailData: {
    messageId: string;
    subject: string;
    sender: string;
    senderName?: string;
    body: string;
    htmlBody?: string;
    receivedAt: Date;
  }): Promise<void> {
    try {
      // Check if email already exists
      const existingEmails = await storage.getEmails({ search: emailData.messageId });
      if (existingEmails.length > 0) {
        return; // Skip if already processed
      }

      // Analyze email using OpenAI
      const analysis = await analyzeEmail(emailData.subject, emailData.body, emailData.sender);

      // Create email record
      const emailRecord: InsertEmail = {
        messageId: emailData.messageId,
        subject: emailData.subject,
        sender: emailData.sender,
        senderName: emailData.senderName,
        body: emailData.body,
        htmlBody: emailData.htmlBody,
        receivedAt: emailData.receivedAt,
        sentiment: analysis.sentiment.sentiment,
        priority: analysis.priority,
        status: 'pending',
        extractedInfo: {
          phone: analysis.extractedInfo.phone,
          alternateEmail: analysis.extractedInfo.alternateEmail,
          category: analysis.category,
          keywords: analysis.extractedInfo.keywords,
          urgencyIndicators: analysis.extractedInfo.urgencyIndicators,
          customerType: analysis.extractedInfo.customerType,
        },
        sentimentScore: analysis.sentiment.score,
        confidenceScore: Math.round(analysis.sentiment.confidence * 100),
      };

      const savedEmail = await storage.createEmail(emailRecord);

      // Generate automatic response for urgent emails
      if (analysis.priority === 'urgent') {
        try {
          const responseData = await generateResponse(
            emailData.subject,
            emailData.body,
            emailData.sender,
            analysis
          );

          await storage.createResponse({
            emailId: savedEmail.id,
            content: responseData.content,
            isAiGenerated: true,
          });
        } catch (responseError) {
          console.error('Error generating automatic response:', responseError);
        }
      }

      console.log(`Processed email: ${emailData.subject} (${analysis.priority}/${analysis.sentiment.sentiment})`);
    } catch (error) {
      console.error('Error processing email:', error);
    }
  }

  static createFromEnv(): EmailService {
    const provider = process.env.EMAIL_PROVIDER as 'gmail' | 'imap' || 'imap';

    const config: EmailConfig = { provider };

    if (provider === 'gmail') {
      config.gmail = {
        clientId: process.env.GMAIL_CLIENT_ID || '',
        clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
      };
    } else {
      config.imap = {
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        secure: process.env.IMAP_SECURE !== 'false',
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASSWORD || '',
      };
    }

    return new EmailService(config);
  }
}

// Export singleton instance
export const emailService = EmailService.createFromEnv();
