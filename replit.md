# AI-Powered Communication Assistant

## Overview

This is an AI-powered email management system designed to automatically process support emails, analyze their sentiment and priority, and generate context-aware responses. The application serves as a comprehensive dashboard for managing customer communications, featuring real-time analytics, automated categorization, and intelligent response generation.

The system processes incoming emails by filtering support-related messages, analyzing them for sentiment and urgency, extracting key information, and generating appropriate AI responses. It provides a clean dashboard interface for support teams to review, edit, and send responses efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Data fetching, caching, and synchronization with the backend
- **Shadcn/ui + Radix UI**: Component library built on Radix primitives with Tailwind CSS styling
- **Recharts**: Data visualization for analytics dashboards and charts
- **Vite**: Modern build tool for fast development and optimized production builds

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Service Layer Pattern**: Separated concerns with dedicated services for email processing, analytics, and AI operations
- **Middleware**: Custom logging, error handling, and request processing

### Database Design
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Schema Structure**:
  - `users`: User management and authentication
  - `emails`: Core email storage with metadata, sentiment, priority, and extracted information
  - `responses`: AI-generated and manual responses linked to emails
  - `emailAnalytics`: Aggregated statistics for dashboard reporting
- **Enums**: Typed enums for sentiment (positive/neutral/negative), priority (urgent/normal/low), and status (pending/resolved/draft)

### AI Integration
- **OpenAI GPT Integration**: Uses GPT-5 model for sentiment analysis, priority classification, and response generation
- **Context-Aware Processing**: Analyzes email content for urgency indicators, customer sentiment, and relevant business context
- **Information Extraction**: Automatically extracts contact details, keywords, and categorizes customer requirements

### Email Processing Pipeline
- **Multi-Provider Support**: Configurable to work with Gmail API, IMAP, or Outlook Graph API
- **Automated Filtering**: Identifies support-related emails using keyword matching
- **Priority Queue**: Urgent emails are processed first with automatic escalation
- **Real-time Updates**: WebSocket-ready architecture for live dashboard updates

### Analytics System
- **Real-time Dashboard**: Live statistics showing daily volumes, urgent emails, resolution rates
- **Sentiment Tracking**: Distribution of positive, neutral, and negative customer communications
- **Performance Metrics**: Response times, resolution rates, and category-based analytics
- **Interactive Charts**: Weekly trends, sentiment distribution, and category breakdowns

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **OpenAI API**: GPT-5 model for natural language processing, sentiment analysis, and response generation

### Email Services (Configurable)
- **Gmail API**: Google OAuth2 integration for Gmail inbox access
- **IMAP Protocol**: Generic email server connectivity
- **Microsoft Graph API**: Outlook/Office 365 email integration

### Development Tools
- **Replit Integration**: Development environment with hot reload and debugging support
- **Vite Plugins**: Runtime error overlay and cartographer for enhanced development experience

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide Icons**: Consistent iconography throughout the application

### Data Visualization
- **Recharts**: React-based charting library for analytics dashboards
- **Date-fns**: Date manipulation and formatting utilities

The system is designed with scalability in mind, using modern TypeScript throughout the stack, proper separation of concerns, and a modular architecture that allows for easy extension and maintenance.