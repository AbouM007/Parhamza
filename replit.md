# PassionAuto2Roues - Marketplace Automobile

## Overview
PassionAuto2Roues is an online marketplace for buying and selling used vehicles, damaged vehicles, and automotive spare parts. It caters to both individual users and professional sellers, featuring a subscription-based monetization model, premium listings, and a verification system. The platform offers integrated messaging, payment processing, and user management.

## Recent Changes
**October 2025**
- Implemented subscription management with cancel/reactivate functionality
- Added PremiumSection component to dashboard displaying subscription plans
- Integrated PlanSelector component in compact mode for Premium tab
- Fixed component export patterns (named exports) to match app architecture
- Enhanced Premium dashboard with subscription plans and boost options display
- **Bug Fix**: Fixed subscription status detection for all user types - PlanSelector now correctly retrieves and displays current subscription for both "individual" and "professional" users (previously only worked for professionals)
- **Feature**: Added purchase restriction when user has active subscription - displays alert message and disables all plan purchase buttons until current subscription is cancelled
- **Bug Fix**: Fixed blank page after Stripe payment - payment success routes (`/success`, `/success-boost`, `/auth/callback`) now bypass profile completion check, allowing proper redirect after professional account creation
- **Bug Fix**: Corrected Stripe cancel URL from non-existent `/plans` to `/dashboard`
- **Bug Fix**: Fixed damaged vehicle details display - `damageDetails` now properly retrieved and displayed in vehicle detail view
  - Added `damageDetails` transformation in `getVehicle()` method (previously missing)
  - Created dedicated damage information section in VehicleDetail.tsx with French translations
  - Section displays: damage types (list), mechanical state (with wrench icon), and severity (color-coded badges: yellow=léger, orange=moyen, red=grave)
  - Fixed condition check to accept both "accidente" (frontend value) and "damaged" (backend cast) for compatibility
  - Complete round-trip persistence now working: form → database → detail view

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript with Vite.
- **UI/Styling**: Radix UI primitives, TailwindCSS, shadcn/ui design system.
- **State Management**: TanStack Query for server state and caching.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Framework**: Node.js + Express with TypeScript.
- **ORM**: Drizzle ORM for type-safe database queries and migrations.
- **API**: RESTful API.
- **File Upload**: Multer for multipart/form-data, Sharp for image optimization.
- **Authentication**: Supabase Auth for session management.

### Database
- **Type**: PostgreSQL hosted on Supabase.
- **Schema Management**: Drizzle migrations.
- **Key Entities**: Users, Vehicle Listings (`annonces`), Messages, Wishlists, Subscription Plans.
- **Relationships**: Foreign key constraints with cascade deletes.

### Authentication & Authorization
- **Provider**: Supabase Auth (registration, login, session management).
- **Social Login**: Google OAuth.
- **User Roles**: Individual, Professional, Admin.
- **Verification**: Manual verification for professional accounts.
- **Security**: Supabase Row Level Security (RLS).

### Storage & Media
- **Storage**: Supabase Storage for images and avatars.
- **Image Processing**: Sharp for optimization and resizing.
- **CDN**: Supabase CDN.
- **Constraints**: 5MB file size limit, MIME type validation.

### Business Logic
- **Listing Quotas**: Free listings for individuals, subscription-based for professionals.
- **Premium Listings**: Boost system for enhanced visibility.
- **Messaging**: Real-time messaging with vehicle context.
- **Search & Filters**: Advanced search capabilities.

### UI/UX Decisions
- Consistent design language using shadcn/ui.
- Responsive layouts for various devices.
- Clear and intuitive user flows for listing creation, messaging, and subscription management.

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

### Utilities & Libraries
- **React Query**: Server state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **uuid**: Unique identifier generation.
- **class-variance-authority**: Conditional CSS classes.
- **Fabric.js**: Client-side canvas manipulation for image masking.