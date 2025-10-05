# PassionAuto2Roues - Marketplace Automobile

## Overview
PassionAuto2Roues is an online marketplace for buying and selling used vehicles, damaged vehicles, and automotive spare parts. It aims to connect individual users and professional sellers, offering a subscription-based monetization model, premium listing options, and a verification system. The platform includes integrated messaging, secure payment processing, and comprehensive user management. The project's ambition is to become a leading platform in the used vehicle and spare parts market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript with Vite.
- **UI/Styling**: Radix UI primitives, TailwindCSS, shadcn/ui design system, responsive layouts.
- **State Management**: TanStack Query for server state and caching.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Consistent design language, intuitive user flows for listing creation, messaging, and subscription management.

### Backend
- **Framework**: Node.js + Express with TypeScript.
- **ORM**: Drizzle ORM for type-safe database queries and migrations.
- **API**: RESTful API.
- **File Upload**: Multer for multipart/form-data, Sharp for image optimization.
- **Authentication**: Supabase Auth for session management.
- **Core Features**:
    - **Listing Management**: Creation, display, and deletion of vehicle and spare parts listings.
    - **Compatibility Tags**: System for spare parts listings with auto-suggestions and intelligent matching for damaged vehicles based on a scoring system.
    - **Subscription Management**: Handling of user subscriptions (cancel/reactivate), professional account verification, and premium features (listing boosts).
    - **Messaging**: Integrated messaging system.
    - **Search & Filters**: Advanced search capabilities for listings.
    - **Data Transformation**: Reusable helper functions for transforming Supabase data (e.g., `transformVehicleFromSupabase`) to ensure type safety and reduce duplication.
    - **Category Restructuring**: Specific categories for spare parts to ensure precise vehicle-to-parts matching.

### Database
- **Type**: PostgreSQL hosted on Supabase.
- **Schema Management**: Drizzle migrations.
- **Key Entities**: Users, Vehicle Listings (`annonces`), Messages, Wishlists, Subscription Plans.
- **Relationships**: Foreign key constraints with cascade deletes.
- **Security**: Supabase Row Level Security (RLS).

### Authentication & Authorization
- **Provider**: Supabase Auth (registration, login, session management).
- **Social Login**: Google OAuth.
- **User Roles**: Individual, Professional, Admin.
- **Verification**: Manual verification for professional accounts.

### Storage & Media
- **Storage**: Supabase Storage for images and avatars.
- **Image Processing**: Sharp for optimization and resizing.
- **CDN**: Supabase CDN.
- **Constraints**: 5MB file size limit, MIME type validation.

## External Dependencies

### Payment Processing
- **Stripe**: Subscriptions and premium features, webhook processing.
- **PayPal SDK**: Alternative payment method.

### Authentication Services
- **Supabase**: Auth, Database, Storage.
- **Google Cloud Console**: OAuth 2.0 client for Google Sign-In.

### Development & Deployment
- **Replit**: Hosting and deployment.
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database migration and schema management.
- **TypeScript**: End-to-end type safety.

### Image & Media Processing
- **Sharp**: Server-side image manipulation.
- **Multer**: File upload handling.
- **Fabric.js**: Client-side canvas manipulation for image masking.

### Utilities & Libraries
- **React Query**: Server state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **uuid**: Unique identifier generation.
- **class-variance-authority**: Conditional CSS classes.