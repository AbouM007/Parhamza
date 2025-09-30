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

### Professional Onboarding Flow Refactoring (September 30, 2025)
**Critical Fixes**: Resolved document upload and flow progression issues in professional account onboarding.

**Problems Identified**:
1. Debug popup displaying raw JSON data before Stripe payment redirect
2. Documents selected in DocsStep never uploaded to server (stored only in browser memory)
3. ValidationStep intended to upload documents POST-payment, but users never returned from Stripe
4. Standalone /professional-verification page worked correctly with immediate upload

**Solutions Implemented**:
1. **DocsStep Refactored** (`client/src/features/onboardingV2/components/steps/DocsStep.tsx`):
   - Documents now upload IMMEDIATELY to `/api/professional-accounts/verify` endpoint
   - Uses Bearer token authentication with company info from ProfessionalStep
   - Shows loading state during upload with disabled submit button
   - Matches behavior of standalone ProfessionalVerificationForm component

2. **State Machine Simplified** (`client/src/features/onboardingV2/utils/stateMachine.ts`):
   - Removed obsolete transition: payment → validation → completed
   - New direct transition: payment → completed
   - ValidationStep no longer needed since documents upload in DocsStep

3. **ValidationStep Removed** (`client/src/features/onboardingV2/OnboardingEntry.tsx`):
   - Deleted debug JSON display step
   - Updated onboarding state whitelist to exclude "validation"
   - Prevents legacy users from being stuck in removed state

4. **TypeScript Fixes**:
   - Re-exported User type for module compatibility
   - Fixed onboardingState access with proper type casting

**New Professional Onboarding Flow**: 
Choice → Professional (company info) → Docs (immediate upload) → Payment (Stripe redirect) → Completed

**Impact**: Professional users now have seamless onboarding with immediate document upload, no confusing debug popups, and proper flow completion after Stripe payment.

### License Plate Masking System (September 30, 2025)
**Feature**: Implemented privacy protection for vehicle listings with manual license plate masking using draggable white rectangles.

**Technical Implementation**:
1. **Frontend Canvas Editor** (`client/src/components/PlateBlurModal.tsx`):
   - Fabric.js v6 integration with modern ES6 imports (Canvas, Rect, FabricImage)
   - Interactive 800x600 canvas with draggable/resizable white rectangle overlay
   - Coordinate transformation: Canvas space → Original image dimensions
   - Edge case handling: Automatic dimension adjustment for rectangles extending beyond image bounds
   - Memory management: Automatic blob URL revocation on cleanup

2. **Backend Image Processing** (`server/routes/images.ts - POST /api/images/apply-mask`):
   - Sharp.js composite operation to permanently apply white rectangle mask
   - WebP conversion with quality optimization (85%, effort 5)
   - Security: URL domain validation (Supabase, Replit domains only)
   - Coordinate validation and clamping to prevent out-of-bounds masks
   - Automatic upload to Supabase Storage with versioned filenames

3. **Integration Flow** (`client/src/components/CreateListingForm.tsx`):
   - "Flouter" button on each uploaded photo preview
   - Automatic upload of File objects before masking (resolves blob: URL issue)
   - State management: Tracks masked images and replaces with processed versions
   - User experience: Modal workflow → Canvas adjustment → Apply → Automatic replacement

**Technical Challenges Resolved**:
- ✅ Coordinate mismatch: Canvas display coordinates vs. original image pixels (fixed with scale/offset calculation)
- ✅ Blob URL limitation: Backend fetch() cannot access browser blob: URLs (fixed with pre-upload strategy)
- ✅ Format corruption: Sharp buffer uploaded as WebP without conversion (fixed with .webp() pipeline)
- ✅ Edge overflow: Rectangle dimensions not adjusted when crossing image boundaries (fixed with overflow compensation)

**Dependencies Added**:
- `fabric@6.x` - Canvas manipulation library with TypeScript support

**User Flow**:
1. User uploads vehicle photos in listing creation form
2. Clicks "Flouter" button on any photo showing license plate
3. Adjusts white rectangle position/size in modal editor
4. Confirms → Backend applies permanent white mask
5. Masked image replaces original in form (ready for final submission)

**Future Enhancement Possibility**: Logo overlay on white rectangle (mentioned by user)