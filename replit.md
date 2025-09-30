# PassionAuto2Roues - Marketplace Automobile

## Overview

PassionAuto2Roues is a comprehensive online marketplace specialized in buying/selling used vehicles, damaged vehicles, and automotive spare parts. The platform targets both individual users and professional sellers, featuring a subscription-based monetization model with premium listings and verification systems. The application serves as a complete automotive marketplace with integrated messaging, payment processing, and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript** with Vite as the build tool and development server
- **Component Library**: Radix UI primitives with TailwindCSS for styling, following the shadcn/ui design system
- **State Management**: TanStack Query for server state management and API caching
- **Routing**: Wouter for client-side routing (lightweight React router alternative)
- **Form Handling**: React Hook Form with Zod validation schemas
- **Path Aliases**: Configured with TypeScript path mapping for clean imports (@/components, @/lib, etc.)

### Backend Architecture
- **Node.js + Express** server with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database queries and migrations
- **API Design**: RESTful API structure with modular route organization
- **File Upload**: Multer middleware for handling multipart/form-data with Sharp for image optimization
- **Authentication Middleware**: Integration with Supabase Auth for session management

### Database Design
- **Primary Database**: PostgreSQL hosted on Supabase
- **Schema Management**: Drizzle migrations with schema definitions in TypeScript
- **Key Tables**:
  - `users` - Unified user profiles (individuals and professionals)
  - `annonces` - Vehicle listings with comprehensive metadata
  - `messages` - Direct messaging between buyers/sellers
  - `wishlist` - User favorites system
  - `subscription_plans` - Premium subscription tiers
- **Relations**: Foreign key constraints with proper cascade deletes

### Authentication & Authorization
- **Supabase Auth**: Handles user registration, login, and session management
- **OAuth Integration**: Google OAuth configured for social login
- **User Types**: Three-tier system (individual, professional, admin)
- **Account Verification**: Manual verification process for professional accounts
- **Row Level Security**: Supabase RLS policies for data access control

### Storage & Media
- **Supabase Storage**: File storage for vehicle images and user avatars
- **Image Processing**: Sharp library for image optimization and resizing
- **CDN**: Supabase CDN for global image delivery
- **Upload Constraints**: 5MB file size limit with MIME type validation

### Business Logic Features
- **Listing Quotas**: Usage-based restrictions (5 free listings for individuals, subscription-based for professionals)
- **Premium Listings**: Boost system with weekly/monthly premium placements
- **Messaging System**: Real-time messaging between users with vehicle context
- **Search & Filters**: Advanced filtering by category, price, location, and specifications

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure for subscriptions and premium features
- **PayPal SDK**: Alternative payment method integration
- **Webhook Handling**: Stripe webhook processing for payment events

### Authentication Services
- **Supabase**: Full backend-as-a-service for authentication, database, and storage
- **Google Cloud Console**: OAuth 2.0 client configuration for Google Sign-In

### Development & Deployment
- **Replit**: Primary hosting and deployment platform
- **Vite**: Frontend build tool with hot reload and optimization
- **Drizzle Kit**: Database migration and schema management
- **TypeScript**: End-to-end type safety across frontend and backend

### Image & Media Processing
- **Sharp**: High-performance image processing library
- **Multer**: Express middleware for handling file uploads
- **External CDN**: Pexels and other image services for demo content

### Utilities & Libraries
- **React Query**: Server state management and caching
- **Zod**: Schema validation for forms and API requests
- **date-fns**: Date manipulation utilities
- **uuid**: Unique identifier generation
- **class-variance-authority**: Utility for conditional CSS classes

## Replit Environment Setup

### Environment Variables (Required)
The following environment variables must be configured in Replit Secrets:
- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server operations
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for event validation
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (optional, for frontend)

### Development Workflow
- **Start Development**: `npm run dev` - Runs Express server on port 5000 with Vite middleware
- **Build for Production**: `npm run build` - Builds frontend and bundles backend
- **Start Production**: `npm run start` - Runs production build
- **Database Sync**: `npm run db:push` - Syncs Drizzle schema to Supabase database

### Server Configuration
- **Port**: Application runs on port 5000 (both development and production)
- **Host**: Binds to 0.0.0.0 for Replit proxy compatibility
- **Vite Proxy**: Configured with `allowedHosts: ["*"]` for Replit iframe preview
- **Hot Reload**: Vite HMR enabled in development mode

### Deployment Configuration
- **Type**: Autoscale deployment (stateless web application)
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Environment**: Production uses compiled JavaScript from dist/

### Recent Changes
- **2025-09-30**: Configured Replit environment setup, workflow, and deployment settings
- Application successfully running on Replit with Supabase backend integration