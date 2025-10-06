# PassionAuto2Roues - Marketplace Automobile

## Overview
PassionAuto2Roues is an online marketplace for buying and selling used vehicles, damaged vehicles, and automotive spare parts. It aims to connect individual users and professional sellers, offering a subscription-based monetization model, premium listing options, and a verification system. The platform includes integrated messaging, secure payment processing, and comprehensive user management. The project's ambition is to become a leading platform in the used vehicle and spare parts market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **2025-10-06**: Implemented real-time phone number validation with visual feedback (green checkmark for available, red X for taken)
- **2025-10-06**: Created /api/users/check-phone/:phone endpoint for instant duplicate phone detection with 800ms debounce
- **2025-10-06**: Added live validation indicators in PersonalStep and ProfessionalStep onboarding forms (Loader2, CheckCircle2, XCircle icons)
- **2025-10-06**: Fixed duplicate phone validation - users now see clear error message when phone number is already used by another account
- **2025-10-06**: Backend now returns specific error codes (PHONE_ALREADY_EXISTS, WHATSAPP_ALREADY_EXISTS) with 409 status instead of generic 500 error
- **2025-10-06**: ProfessionalStep now displays user-friendly toast notification for duplicate phone/WhatsApp numbers (matching PersonalStep behavior)
- **2025-10-06**: CRITICAL FIX - Fixed mobile crash during image upload by implementing proper memory management (CreateListingForm, CreateProAccount)
- **2025-10-06**: Eliminated memory leak: preview URLs now use useMemo/useEffect with proper cleanup (URL.revokeObjectURL on unmount)
- **2025-10-06**: Optimized image compression: lightweight canvas-based compression for files > 500KB, converts to JPEG at 85% quality
- **2025-10-06**: Fixed white screen crash on mobile when uploading images (listing photos, KBIS/CIN documents)
- **2025-10-06**: Images are now compressed to max 1920x1920px at 85% quality before processing, reducing memory usage by 60-80%
- **2025-10-06**: Made OnboardingModal fully scrollable on mobile with responsive padding (p-4 on mobile, p-8 on desktop)
- **2025-10-06**: Fixed issue where "Suivant" button was not visible on mobile in onboarding forms
- **2025-10-06**: Updated ProfileSection WhatsApp field to use PhoneInputComponent for international format consistency across the platform
- **2025-10-06**: Fixed phone number format issue - PhoneInputComponent now automatically adds "+" prefix for international E.164 format
- **2025-10-06**: Fixed form submission issue in onboarding - changed StepButtons to use type="submit" instead of onClick handler
- **2025-10-06**: Updated StepButtons component to accept optional continueType prop (button/submit) for proper form handling
- **2025-10-06**: Implemented unified international phone system with E.164 format (+33612345678) for multi-country expansion
- **2025-10-06**: Created reusable PhoneInputComponent with react-phone-input-2 (200+ countries supported)
- **2025-10-06**: Added UNIQUE constraints on phone/whatsapp fields in database schema (one number = one account)
- **2025-10-06**: Updated PersonalStep, ProfessionalStep, and ProfessionalProfileForm with international phone inputs
- **2025-10-06**: Implemented optional WhatsApp field with "use same number" checkbox (unchecked by default)
- **2025-10-06**: Added comprehensive data-testid attributes for all interactive elements (buttons, inputs, checkboxes)
- **2025-10-06**: Added postal code and city fields to ProfessionalStep (onboarding professionnel) matching PersonalStep layout
- **2025-10-05**: Implemented complete contact privacy system with hide_whatsapp and hide_messages fields (schema, backend, frontend)
- **2025-10-05**: Updated VehicleDetail to conditionally display WhatsApp button and Message button based on privacy preferences
- **2025-10-05**: Added hideWhatsapp and hideMessages to Vehicle type in types/index.ts for full type safety
- **2025-10-05**: Modified CreateListingForm to send privacy preferences (inverted logic: unchecked = hide true)
- **2025-10-05**: Cleaned up mockData.ts by removing empty `brands` export and updated SearchFilters.tsx to use dynamic brand extraction from vehicle data
- **2025-10-05**: Completed implementation of adaptive search filters in both SearchFilters.tsx (sidebar) and SearchPage.tsx ("Filtres avancés" section) with full filtering logic
- **2025-10-05**: Added 7 new optional fields to Vehicle type: transmission, engineSize, vehicleType, length, serviceType, serviceZone, partCategory
- **2025-10-05**: Implemented comprehensive adaptive search filter system with proper category-specific visibility and numeric value normalization
- **2025-10-05**: Fixed filter visibility logic to check parent category when no subcategory is selected, ensuring service and spare parts filters remain visible in "Tous types" mode
- **2025-10-05**: Added vehicle type filter support for caravane/remorque categories with proper mapping to VEHICLE_TYPES taxonomy
- **2025-10-05**: Fixed compatibility brand filtering for spare parts (piece-jetski-bateau, piece-caravane-remorque, piece-aerien) in CreateListingForm
- **2025-10-05**: Unified all tab colors to use primary-bolt-500 for consistency with site color scheme
- **2025-10-05**: Harmonized tab design across all categorized views (DamagedVehiclesTabs, SparePartsTabs, ServicesTabs)
- **2025-10-05**: Updated tabs to use modern rounded button style with consistent active/inactive states
- **2025-10-05**: Standardized counter display in separate spans with consistent styling across all tab components
- **2025-10-05**: Created ServicesTabs component with 4 service categories (réparation, remorquage, entretien, autre-service)
- **2025-10-05**: Removed Services dropdown menu and added dedicated "Services" button in Header (desktop and mobile)
- **2025-10-05**: Integrated ServicesTabs in VehicleListings with viewMode='categorized-services'
- **2025-10-05**: Added "categorized-services" to viewMode type definition in types/index.ts
- **2025-10-05**: Navigation flow: "Services" button → viewMode="categorized-services" → ServicesTabs displays services by category
- **2025-10-05**: Added "Pièces détachées" navigation button to Header (desktop and mobile menus)
- **2025-10-05**: Integrated SparePartsTabs component with VehicleListings for categorized spare parts view
- **2025-10-05**: Fixed SparePartsTabs to filter only spare parts (categories starting with "piece-" or "autre-piece")
- **2025-10-05**: Added "categorized-parts" to viewMode type definition in types/index.ts
- **2025-10-05**: Fixed database error by changing `.order("is_boosted")` to `.order("boosted_until")` in storage.ts

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