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
- **UI/UX Decisions**: Consistent design language, intuitive user flows for listing creation, messaging, and subscription management, unified tab colors and designs, international phone input formatting.
  - **VehicleDetail Display Optimization (Oct 2025)**:
    - Spare parts (categories starting with "piece-") display only essential info: Location, Brand, Year (if exists)
    - Mileage hidden for spare parts listings to reduce clutter
    - Compatibility section positioned FIRST (before technical characteristics) with primary-bolt color scheme (#067D92)
    - Technical characteristics block conditionally hidden when empty
    - Damage section for damaged vehicles uses primary-bolt colors and appears first
    - Contextual icons throughout with white card backgrounds for better visual hierarchy
  - **Responsive Home Page Optimization (Oct 2025)**:
    - **Mobile**: 
      - **Progressive category display**: Shows 6 main subcategories by default (Voiture, Moto, Bateau, Pièces auto, Réparation, Accidentés)
      - **Expandable grid**: "Voir toutes les catégories" button reveals 9 additional subcategories (Utilitaire, Caravane, Remorque, Scooter, Quad, Jetski, Aérien, Entretien, Pièces moto)
      - Animated chevron icon rotates on expand/collapse
      - Each subcategory uses its dedicated icon from categories.ts
      - 3 columns grid on mobile for easy navigation
      - Simplified professional space banner with key statistics
      - Full-width "Voir plus d'annonces" buttons at section end
    - **Desktop**: 
      - Original 4 main category cards preserved (Voitures-Utilitaires, Motos-Scooters, Nautisme, Services)
      - Full professional space section with complete benefits list and detailed information
      - Inline "Voir plus" links at section titles
    - Dual layouts ensure optimal UX for each device type while maintaining consistency and reducing mobile screen clutter

### Backend
- **Framework**: Node.js + Express with TypeScript.
- **ORM**: Drizzle ORM for type-safe database queries and migrations.
- **API**: RESTful API.
- **File Upload**: Multer for multipart/form-data, Sharp for image optimization.
- **Authentication**: Supabase Auth for session management.
- **Core Features**:
    - **Listing Management**: Creation, display, and deletion of vehicle and spare parts listings.
    - **Auto-Fill Vehicle Data**: 
      - **Unified Flow (Oct 2025)**: Optional plate search integrated within listing creation workflow
        - Plate search field appears in Step 5 (Title/Description) for used vehicles only
        - API retrieves data from API Plaque Immatriculation (apiplaqueimmatriculation.com)
        - Retrieved data pre-fills formData.specificDetails directly
        - Step 6 (Specific Details) displays pre-filled fields from API
        - Field mapping: bodyType → vehicleType, fiscalHorsepower → fiscalPower
        - In-memory caching (12h TTL) for cost optimization
        - Single unified flow without branching - plate search is fully optional
    - **Compatibility Tags**: System for spare parts listings with intelligent matching.
      - **Category Separation (Oct 2025)**: Spare parts categories separated for better targeting
        - "Pièces voiture / utilitaire" split into "Pièces voiture" and "Pièces utilitaire"
        - piece-voiture: Shows car brands + models from carModelsByBrand
        - piece-utilitaire: Shows utility vehicle brands (IVECO, MAN, DAF, etc.) without models
      - **Tags UI (Oct 2025)**: Full interface in Step 6 (Specific Details) for spare parts
        - Smart search field with auto-suggestions based on vehicle brands/models
        - Dynamic filtering by spare part subcategory (piece-voiture → car brands, piece-utilitaire → utility brands)
        - Visual tag display with primary-bolt color scheme and easy removal
        - Click-outside handler for better UX
        - Helps buyers find compatible parts through targeted search
      - **Spare Parts Fields (Oct 2025)**: Enhanced information for spare parts listings
        - État (Condition): "Neuf" or "Occasion" - mandatory field
        - Type de pièce (Part Type): Moteur, Transmission, Freinage, Suspension, Électronique, Carrosserie, Intérieur, Éclairage, Pneumatiques, Autre - mandatory field
        - Year field hidden in display for spare parts (auto-filled with current year in DB)
        - Dedicated "Informations sur la pièce" section in VehicleDetail for part-specific data
    - **Subscription Management**: User subscriptions, professional account verification, and premium features (listing boosts).
    - **Messaging**: Integrated messaging system.
    - **Search & Filters**: Advanced, adaptive search capabilities with category-specific visibility.
    - **Data Transformation**: Reusable helper functions for Supabase data.
    - **Category Restructuring**: Specific categories for spare parts.
    - **User Privacy**: Contact privacy system for WhatsApp and messages.
    - **Phone Validation**: Real-time duplicate phone number validation with E.164 international format.

### Database
- **Type**: PostgreSQL hosted on Supabase.
- **Schema Management**: Drizzle migrations.
- **Key Entities**: Users, Vehicle Listings (`annonces`), Messages, Wishlists, Subscription Plans.
- **Relationships**: Foreign key constraints with cascade deletes.
- **Security**: Supabase Row Level Security (RLS).
- **Constraints**: UNIQUE constraints on phone/whatsapp fields.
- **Demo Listings (Oct 2025)**: 
  - Added `is_demo` boolean field to `annonces` table for marking demonstration listings
  - Demo listings display a yellow "DEMO" badge in top-left corner
  - Semi-transparent watermark "DEMO" overlays images at -20° rotation
  - Applies to both VehicleCard (listings grid) and VehicleDetail (detail page)
  - Existing listings marked as demo via SQL; new listings default to `false`
- **Views and Favorites Counters (Oct 2025)**:
  - `vehicle_views` table tracks unique views per vehicle by userId or IP address
  - Generated column `viewer_identity` replaces partial unique indexes for PostgreSQL compatibility:
    - Formula: `CASE WHEN user_id IS NOT NULL THEN 'user:'||user_id ELSE 'ip:'||ip_address END`
    - Single UNIQUE constraint on (vehicle_id, viewer_identity)
  - Atomic RPC functions for thread-safe counter updates:
    - `increment_vehicle_views(p_vehicle_id)`: Atomic view counter increment
    - `increment_vehicle_favorites(p_vehicle_id)`: Atomic favorite counter increment
    - `decrement_vehicle_favorites(p_vehicle_id)`: Atomic favorite counter decrement (min 0)
  - VehicleDetail component automatically records view on page load
  - Favorites routes call increment/decrement when adding/removing from wishlist
  - Migration scripts: `migrations/001_create_vehicle_views_table.sql`, `migrations/002_add_viewer_identity.sql`
- **Form Persistence System (Oct 2025)**:
  - Hybrid storage for create listing form to prevent data loss
  - **Storage Strategy**:
    - Text data (form fields) → localStorage (lightweight, no size limit issues)
    - Photo Files (local images) → IndexedDB (supports large binary data, no 5MB limit)
    - Photo URLs (uploaded) → localStorage (just strings)
  - **Photo Order Preservation**: PhotoEntry structure maintains exact order with type and reference
  - **Atomic Writes**: IndexedDB writes complete before localStorage commit to prevent inconsistency
  - Utility functions in `client/src/utils/formPersistence.ts`:
    - `saveFormDraft()`: Async function that saves to both stores atomically
    - `loadFormDraft()`: Async function that restores data in original order
    - `clearFormDraft()`: Cleans up both localStorage and IndexedDB
    - `hasDraft()`: Checks if draft exists
  - Auto-save triggers on every form field change (1 second debounce)
  - Auto-restore on form mount with toast notification showing photo count
  - Cleanup after successful listing publication
  - Confirmation dialog before closing form if unsaved data exists
  - Mobile-friendly to prevent data loss on app switching or browser refresh
  - Handles large photo sets without quota errors

### Authentication & Authorization
- **Provider**: Supabase Auth (registration, login, session management).
- **Social Login**: Google OAuth.
- **User Roles**: Individual, Professional, Admin.
- **Verification**: Manual verification for professional accounts.
- **Public Display Names**: System for individual users to use a pseudo (display_name).

### Storage & Media
- **Storage**: Supabase Storage for images and avatars.
- **Image Processing**: Sharp for optimization and resizing, client-side canvas-based compression for large images, proper memory management for image uploads.
- **CDN**: Supabase CDN.
- **Constraints**: 5MB file size limit, MIME type validation, max 1920x1920px resolution.

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
- **API Plaque Immatriculation (apiplaqueimmatriculation.com)**: Vehicle data auto-fill.
- **react-phone-input-2**: International phone number input.