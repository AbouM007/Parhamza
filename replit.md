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
  - Root cause: `damageDetails` transformation in storage.ts used `||` operator which incorrectly treated Supabase native JSON objects as falsy
  - Solution: Changed transformation from `damage_details || undefined` to `damage_details ?? undefined` in all 5 transformation methods (getVehicle, getVehicleWithUser, getAllVehicles, getVehiclesByUser, getUserVehicles)
  - This follows the working pattern used for the `features` field and preserves Supabase JSON payloads even when empty objects are returned
  - Added missing TypeScript properties to client-side Vehicle type: listingType, contactPhone, contactEmail, contactWhatsapp, hidePhone, deletedAt, deletionReason, deletionComment
  - Added `isServiceCategory()` helper function in VehicleDetail.tsx to properly check if a subcategory is a service (fixes TypeScript comparison warnings)
  - Reduced TypeScript errors from 13 to 0 in VehicleDetail.tsx
  - Created dedicated damage information section in VehicleDetail.tsx with French translations
  - Section displays: damage types (list), mechanical state (with wrench icon), and severity (color-coded badges: yellow=léger, orange=moyen, red=grave)
  - Fixed condition check to accept both "accidente" (frontend value) and "damaged" (backend cast) for compatibility
  - Complete round-trip persistence now working: form → database → detail view
  - **Additional Fix**: Added `validateDamageDetails()` helper function to filter empty objects `{}` that Supabase can return for JSONB fields
    - Problem: Empty objects pass `?? undefined` check but have no valid properties, causing nothing to display
    - Solution: Validates that damageDetails contains at least one valid property (damageTypes, mechanicalState, severity) before accepting
    - Applied to all 5 transformation methods (getVehicle, getAllVehicles, getVehiclesByUser, getDeletedVehiclesByUser, createVehicle)
    - Verified with API tests: annonces 127, 128, 129 all correctly return valid damageDetails
  - **Critical Fix**: Added missing `/vehicle/:id` route in App.tsx for direct vehicle access via URL
    - Problem: App had no route defined for `/vehicle/:id`, causing blank pages when accessing vehicles directly
    - Solution: Added route that fetches vehicle from API and sets selectedVehicle state
    - Impact: Users can now share and access vehicle listings via direct URLs (e.g., `/vehicle/127`)
    - Complete fix validated: All damaged vehicle listings now display damage details correctly (screenshots + API + browser logs confirmed)
  - **UX Enhancement**: Refactored damage details section to always display for damaged vehicles
    - Problem: Section was hidden when damageDetails was empty/undefined, creating inconsistent UI
    - Solution: Extracted safe variables (damageTypes, mechanicalState, severity) with optional chaining before JSX render
    - Added `hasDamageInfo` flag to conditionally display either detailed info or "Aucune information disponible" message
    - Impact: Orange damage section now ALWAYS visible for all damaged vehicles, with graceful fallback when data is missing
    - Code quality: Eliminated TypeScript errors, removed redundant fallback block, improved maintainability
- **Major Refactoring**: Eliminated code duplication in storage.ts data transformations (October 2025)
  - **Problem**: 225+ lines of duplicate transformation code across 5 methods (getAllVehicles, getVehiclesByUser, getDeletedVehiclesByUser, getVehicle, getVehicleWithUser)
  - **Solution**: Created reusable helper functions
    - `transformUserFromSupabase()`: Transforms Supabase user data to User type (handles snake_case → camelCase conversion, date parsing, type safety)
    - `transformVehicleFromSupabase()`: Transforms Supabase vehicle data to Vehicle type (includes damageDetails validation, user transformation, all 34 vehicle properties)
  - **TypeScript Fixes**: Resolved all 34 TypeScript errors in storage.ts
    - Added explicit type annotations for arrays (never[] errors): `favorites: Vehicle[]`, `transactions: any[]`, `subscriptionHistory: any[]`
    - Added missing properties: priorityScore, professionalAccountId, damageDetails to all vehicle transformations
    - Used double type assertions (`as unknown as Vehicle[]`) for complex type conversions where needed
    - Fixed getUserFavorites return type and getAllVehiclesAdmin transformation
  - **Code Quality Impact**:
    - Reduced storage.ts from ~225 lines of duplicate code to 2 concise helper functions
    - Improved maintainability: Changes to transformation logic now only need to be made in one place
    - Enhanced type safety: All transformations now consistently handle all required properties
    - Zero TypeScript errors: Verified with LSP diagnostics
  - **Testing**: Confirmed all vehicle listings display correctly, including damage details for damaged vehicles

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