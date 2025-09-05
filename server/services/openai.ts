import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "your-api-key"
});

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  score: number; // -100 to 100
  confidence: number; // 0 to 1
}

export interface EmailAnalysis {
  sentiment: SentimentAnalysis;
  priority: "urgent" | "normal" | "low";
  category: string;
  extractedInfo: {
    phone?: string;
    alternateEmail?: string;
    keywords: string[];
    urgencyIndicators: string[];
    customerType?: string;
  };
}

export interface ResponseGeneration {
  content: string;
  tone: string;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of customer emails and provide a rating from -100 to 100 (negative to positive) and a confidence score between 0 and 1. Respond with JSON in this format: { 'sentiment': 'positive'|'neutral'|'negative', 'score': number, 'confidence': number }"
        },
        {
          role: "user",
          content: `Please analyze the sentiment of this email: ${text}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || "neutral",
      score: Math.max(-100, Math.min(100, result.score || 0)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0))
    };
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    return {
      sentiment: "neutral",
      score: 0,
      confidence: 0
    };
  }
}

export async function analyzeEmail(subject: string, body: string, sender: string): Promise<EmailAnalysis> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert email analyzer for customer support. Analyze emails and extract:
          1. Sentiment (positive/neutral/negative) and score (-100 to 100)
          2. Priority (urgent/normal/low) based on keywords like "urgent", "immediately", "critical", "asap", "emergency"
          3. Category (Account Issues, Technical Support, Product Inquiry, Billing, Feedback, etc.)
          4. Extracted information: phone numbers, alternate emails, keywords, urgency indicators, customer type
          
          Respond with JSON in this exact format:
          {
            "sentiment": {"sentiment": "positive|neutral|negative", "score": number, "confidence": number},
            "priority": "urgent|normal|low",
            "category": "string",
            "extractedInfo": {
              "phone": "string or null",
              "alternateEmail": "string or null", 
              "keywords": ["array", "of", "strings"],
              "urgencyIndicators": ["array", "of", "urgency", "words"],
              "customerType": "string or null"
            }
          }`
        },
        {
          role: "user",
          content: `Subject: ${subject}\nFrom: ${sender}\nBody: ${body}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: {
        sentiment: result.sentiment?.sentiment || "neutral",
        score: Math.max(-100, Math.min(100, result.sentiment?.score || 0)),
        confidence: Math.max(0, Math.min(1, result.sentiment?.confidence || 0))
      },
      priority: result.priority || "normal",
      category: result.category || "General Inquiry",
      extractedInfo: {
        phone: result.extractedInfo?.phone || undefined,
        alternateEmail: result.extractedInfo?.alternateEmail || undefined,
        keywords: result.extractedInfo?.keywords || [],
        urgencyIndicators: result.extractedInfo?.urgencyIndicators || [],
        customerType: result.extractedInfo?.customerType || undefined
      }
    };
  } catch (error) {
    console.error("Failed to analyze email:", error);
    // Return default analysis
    const sentiment = await analyzeSentiment(body);
    return {
      sentiment,
      priority: "normal",
      category: "General Inquiry",
      extractedInfo: {
        keywords: [],
        urgencyIndicators: []
      }
    };
  }
}

export async function generateResponse(
  emailSubject: string,
  emailBody: string,
  senderEmail: string,
  analysis: EmailAnalysis,
  knowledgeBase?: string
): Promise<ResponseGeneration> {
  try {
    const contextualInfo = analysis.extractedInfo;
    const isUrgent = analysis.priority === "urgent";
    const sentimentContext = analysis.sentiment.sentiment === "negative" ? 
      "The customer appears frustrated or upset. Acknowledge their concerns empathetically." :
      analysis.sentiment.sentiment === "positive" ? 
      "The customer seems satisfied. Maintain the positive tone." :
      "The customer has a neutral tone. Be professional and helpful.";

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert customer support representative. Generate professional, empathetic, and helpful email responses. 

          Guidelines:
          - Always maintain a professional and friendly tone
          - Address the customer's specific concerns
          - Be empathetic, especially with frustrated customers
          - Provide actionable solutions when possible
          - Include contact information for urgent issues
          - Reference the customer's details when appropriate
          - Keep responses concise but thorough
          - End with a professional signature
          
          Context about this email:
          - Priority: ${analysis.priority}
          - Sentiment: ${analysis.sentiment.sentiment}
          - Category: ${analysis.category}
          - ${sentimentContext}
          ${isUrgent ? "- This is URGENT - prioritize immediate assistance" : ""}
          ${contextualInfo.phone ? `- Customer phone: ${contextualInfo.phone}` : ""}
          ${contextualInfo.customerType ? `- Customer type: ${contextualInfo.customerType}` : ""}
          ${knowledgeBase ? `- Knowledge base info: ${knowledgeBase}` : ""}
          
          Generate a complete email response that addresses their concerns professionally.`
        },
        {
          role: "user",
          content: `Customer Email:
          Subject: ${emailSubject}
          From: ${senderEmail}
          Message: ${emailBody}
          
          Please generate an appropriate response.`
        }
      ]
    });

    const content = response.choices[0].message.content || "";
    
    return {
      content,
      tone: analysis.sentiment.sentiment === "negative" ? "empathetic" : "professional",
      confidence: 0.85 // Default confidence for generated responses
    };
  } catch (error) {
    console.error("Failed to generate response:", error);
    
    // Fallback response
    return {
      content: `Dear Customer,

Thank you for contacting us regarding "${emailSubject}". We have received your message and understand your concern.

Our support team is reviewing your request and will provide a detailed response shortly. ${analysis.priority === "urgent" ? "Given the urgent nature of your request, we are prioritizing this case." : ""}

If you need immediate assistance, please don't hesitate to contact our support line.

Best regards,
Customer Support Team`,
      tone: "professional",
      confidence: 0.3
    };
  }
}
