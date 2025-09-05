import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { emailService } from "./services/email";
import { analyticsService } from "./services/analytics";
import { generateResponse } from "./services/openai";
import { insertResponseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Email endpoints
  app.get("/api/emails", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        sentiment: req.query.sentiment as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      
      const emails = await storage.getEmails(filters);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get("/api/emails/:id", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      console.error("Error fetching email:", error);
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  app.patch("/api/emails/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "resolved", "draft"]).optional(),
        priority: z.enum(["urgent", "normal", "low"]).optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const email = await storage.updateEmail(req.params.id, updates);
      res.json(email);
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  // Response endpoints
  app.get("/api/emails/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getResponsesByEmailId(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.post("/api/emails/:id/responses", async (req, res) => {
    try {
      const responseData = insertResponseSchema.parse({
        ...req.body,
        emailId: req.params.id,
      });
      
      const response = await storage.createResponse(responseData);
      
      // Mark email as resolved if this is a sent response
      if (responseData.sentAt) {
        await storage.updateEmail(req.params.id, { status: "resolved" });
      }
      
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  app.patch("/api/responses/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        content: z.string().optional(),
        sentAt: z.string().transform(str => str ? new Date(str) : undefined).optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const response = await storage.updateResponse(req.params.id, updates);
      res.json(response);
    } catch (error) {
      console.error("Error updating response:", error);
      res.status(500).json({ message: "Failed to update response" });
    }
  });

  // AI Response generation
  app.post("/api/emails/:id/generate-response", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const analysis = {
        sentiment: {
          sentiment: email.sentiment,
          score: email.sentimentScore || 0,
          confidence: (email.confidenceScore || 0) / 100,
        },
        priority: email.priority,
        category: email.extractedInfo?.category || "General Inquiry",
        extractedInfo: {
          phone: email.extractedInfo?.phone,
          alternateEmail: email.extractedInfo?.alternateEmail,
          keywords: email.extractedInfo?.keywords || [],
          urgencyIndicators: email.extractedInfo?.urgencyIndicators || [],
          customerType: email.extractedInfo?.customerType,
        }
      };

      const responseData = await generateResponse(
        email.subject,
        email.body,
        email.sender,
        analysis
      );

      // Create draft response
      const draftResponse = await storage.createResponse({
        emailId: email.id,
        content: responseData.content,
        isAiGenerated: true,
      });

      res.json(draftResponse);
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/weekly", async (req, res) => {
    try {
      const analytics = await analyticsService.getWeeklyAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching weekly analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/sentiment", async (req, res) => {
    try {
      const sentimentData = await storage.getSentimentDistribution();
      res.json(sentimentData);
    } catch (error) {
      console.error("Error fetching sentiment data:", error);
      res.status(500).json({ message: "Failed to fetch sentiment data" });
    }
  });

  app.get("/api/analytics/categories", async (req, res) => {
    try {
      const categoryData = await storage.getCategoryDistribution();
      res.json(categoryData);
    } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(500).json({ message: "Failed to fetch category data" });
    }
  });

  // Email fetching endpoint
  app.post("/api/emails/refresh", async (req, res) => {
    try {
      await emailService.fetchEmails();
      
      // Update analytics after fetching emails
      await analyticsService.updateDailyAnalytics();
      
      res.json({ message: "Emails refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing emails:", error);
      res.status(500).json({ message: "Failed to refresh emails" });
    }
  });

  // Auto-refresh emails every 5 minutes
  setInterval(async () => {
    try {
      await emailService.fetchEmails();
      await analyticsService.updateDailyAnalytics();
    } catch (error) {
      console.error("Error in auto-refresh:", error);
    }
  }, 5 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}
