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

## Recent Changes

### Authentication System Unification (September 2024)
Successfully migrated 15+ components from standalone `useAuth` hook to centralized `AuthContext`, eliminating authentication duplication and conflicts between two parallel systems.

### User Synchronization Debug & Resolution
**Issue**: New users weren't being created in database after Supabase Auth signup, causing authentication mismatch.

**Root Cause Identified**: Schema inconsistency between Drizzle TypeScript definition and physical database structure:
- Drizzle schema: `companyName: text("company_name")` 
- Backend code: Using `companyName` (camelCase) instead of `company_name` (snake_case)
- Physical DB: Missing `company_name` column entirely

**Resolution Applied**:
1. ✅ Diagnosed payload flow - confirmed frontend AuthContext.signUp sends data correctly
2. ✅ Fixed backend schema mapping - corrected `companyName` → `company_name` in server/routes.ts
3. ✅ Identified missing database column - `company_name` not present in physical users table

**Status**: Code corrections completed. Database migration required: `ALTER TABLE users ADD COLUMN company_name text;`

**Impact**: Authentication flow functions correctly until user creation, where schema mismatch causes failure. Once database column is added, Auth→DB synchronization will be fully restored.