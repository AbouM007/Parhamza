# PassionAuto2Roues - Marketplace Automobile

## Overview
PassionAuto2Roues is an online marketplace for buying and selling used vehicles, damaged vehicles, and automotive spare parts. It connects individual users and professional sellers through a subscription-based monetization model, premium listing options, and a verification system. The platform includes integrated messaging, secure payment processing, and comprehensive user management, aiming to become a leading platform in the used vehicle and spare parts market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a consistent design language with intuitive user flows, utilizing Radix UI, TailwindCSS, and shadcn/ui for a responsive and modern interface. Specific UI/UX enhancements include dynamic dashboard activity displays, optimized vehicle detail views for different listing types (e.g., spare parts vs. damaged vehicles), and a responsive home page with tailored layouts for mobile and desktop. Contact information is protected based on user authentication status and listing ownership, preventing unauthorized access.

**Mobile Navigation Architecture (October 2025)**: The mobile hamburger menu uses a hierarchical 2-level accordion system inspired by leading marketplaces (Leboncoin, eBay). The structure includes:
- **Top Level**: Home link followed by "Toutes les catégories" main accordion
- **Second Level**: 6 category groups (Voitures-Utilitaires, Motos-Scooters-Quads, Nautisme, Accidentés, Pièces détachées, Services), each expandable to show subcategories
- **User Section**: Quick access to "Mes annonces", "Messages" (with unread count badge), "Notifications", separated by a divider from "Mon profil" and "Aide"
- **UX Features**: Smooth animations (200ms transitions), chevron icons that rotate on expansion (► → ▼), visual indentation for hierarchy, minimum 48px touch targets, responsive scrolling with max-height constraints, and emoji icons for visual categorization
- **Behavior**: Only one sub-accordion can be open at a time to prevent menu overflow, and the entire menu closes automatically after navigation selection.

**Mobile Page Header Architecture (October 2025)**: The mobile experience uses a dual-header pattern optimized for user pages:
- **User Pages** (/account, /dashboard, /notifications, etc.): Display a minimal `MobilePageHeader` component with back arrow and page title. The classic header is hidden on mobile (< lg breakpoint) to maximize screen space and provide clean navigation.
- **Public Pages** (home, search, listings): Retain the full classic header with logo, search, and navigation for optimal discovery.
- **Component Structure**: The `MobilePageHeader` is a reusable component located at `client/src/components/MobilePageHeader.tsx` with sticky positioning, back navigation via `onBack` callback, and responsive display (visible on mobile, hidden on desktop with `lg:hidden`).
- **Visual Design**: White background with shadow, 56px height, centered title, and back arrow on the left for intuitive navigation.

**Dashboard Menu Architecture (October 2025)**: The dashboard navigation uses a single-pattern approach optimized for all device sizes:
- **Desktop View (≥ lg breakpoint)**: Traditional vertical sidebar navigation on the left side with full-width buttons showing icons, labels, and badges. The sidebar is sticky-positioned and features the user profile card at the top. Active tabs have gradient backgrounds with shadow and scale effects.
- **Mobile View (< lg breakpoint)**: Uses the bottom navigation bar for primary actions. Dashboard content is accessed through the mobile page header with back navigation.
- **Visual Design**: Gradient primary colors for active states, badges positioned on the right for desktop, smooth transitions (200ms), and touch-friendly minimum sizes for mobile interaction.

**Subscription & Account Page Enhancements (October 2025)**:
- **Account Page**: Added "Historique des achats" section with direct link to purchase history (accessible via Dashboard tab). Mobile-optimized card layout with consistent styling.
- **Subscription Settings** (/subscription-settings): Complete mobile redesign matching desktop aesthetics with:
  - **Active Subscription Alert**: Orange/beige banner (#FEF3C7 background, #D97706 border) displaying current plan status
  - **Plan Cards**: Color-coded with thick left borders (border-l-4):
    - Starter: Blue (#3b82f6)
    - Standard: Violet (#a855f7) with orange "⭐ Populaire" badge
    - Business: Orange (#f97316)
  - **Visual Badges**: "Plan actuel" (gray) for active plan, "Populaire" (orange) for recommended plans
  - **Checkmarks**: Color-matched to plan theme for feature lists
  - **Performance**: React Query caching with 5min staleTime for plans, 1min for current subscription
- **Mobile Header**: /subscription-settings added to `isUserPage` pattern for consistent mobile navigation with MobilePageHeader

### Technical Implementations
**Frontend**: Built with React 18 and TypeScript, using Vite for tooling, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for form handling.
**Backend**: Developed with Node.js and Express in TypeScript, utilizing Supabase client for database interactions and Supabase Auth for authentication. Key features include:
- **Listing Management**: Comprehensive tools for vehicle and spare parts listings, including an optional plate search for auto-filling vehicle data from an external API.
- **Compatibility Tags**: An intelligent system for spare parts listings that allows for dynamic filtering and searching by vehicle brands and models.
- **Subscription & Professional Features**: Management of user subscriptions, professional account verification, and premium listing options.
- **Messaging & Notifications**: An integrated messaging system complemented by a centralized, event-driven multi-channel notification system with user-configurable preferences. The notification system uses Supabase for data storage and supports in-app notifications, email notifications (via Nodemailer with professional SMTP), and push notifications (Phase 7). All 11 notification types are integrated with automatic triggers across the platform (messages, follows, favorites, listings, payments, subscriptions).
  - **Email System (October 2025)**: Implemented with Nodemailer and professional SMTP (configurable via environment variables). Features 9 responsive HTML templates with brand-consistent styling (#067D92 primary color):
    - Account: welcome, pro_account_activated
    - Listings: listing_validated, listing_rejected, listing_favorited
    - Messaging: new_message, message_reply
    - Payments: payment_success, payment_failed
  - **Architecture**: The emailService.ts handles template loading, variable substitution, and graceful error handling. Email failures don't block in-app notification creation. Templates are organized in server/templates/ by category.
- **Followers System**: Allows users to follow professional sellers, with dashboard integration showing seller details and active listings.
- **Search & Filters**: Advanced, adaptive search capabilities with category-specific visibility.
- **Data Persistence**: A hybrid storage system (localStorage and IndexedDB) for create listing forms to prevent data loss, especially for large image uploads.

### System Design Choices
- **Database**: PostgreSQL hosted on Supabase, managed with Drizzle migrations, featuring Row Level Security (RLS) and robust entity relationships.
- **Image Handling**: Supabase Storage for media, with Sharp for server-side optimization and client-side canvas-based compression for efficient image uploads.
- **Authentication**: Supabase Auth handles user registration, login, session management, and social logins (Google OAuth). The system supports different user roles (Individual, Professional, Admin) and manual verification for professional accounts.
- **Monetization**: Implements subscription plans and premium listing features.
- **Security**: Ensures data integrity and user privacy through RLS, unique constraints, and controlled access to contact information.
- **Counters**: Atomic RPC functions in PostgreSQL manage vehicle views and favorites for thread-safe updates.
- **Demo Listings**: A system to mark and visually distinguish demonstration listings for testing or showcasing purposes.

## External Dependencies

### Payment Processing
- **Stripe**: For subscriptions and premium features.
- **PayPal SDK**: For alternative payment options.

### Authentication Services
- **Supabase**: Primary provider for authentication, database, and storage.
- **Google Cloud Console**: Used for Google OAuth 2.0 integration.

### Development & Deployment
- **Replit**: Hosting and deployment environment.
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database migration and schema management.
- **TypeScript**: Ensures type safety across the application.

### Image & Media Processing
- **Sharp**: Server-side image manipulation and optimization.
- **Multer**: Handles multipart/form-data for file uploads.
- **Fabric.js**: Client-side canvas manipulation for image masking.

### Utilities & Libraries
- **React Query**: Manages server state and caching.
- **Zod**: Schema validation for data integrity.
- **date-fns**: For date manipulation.
- **uuid**: Generates unique identifiers.
- **class-variance-authority**: For conditional CSS class management.
- **API Plaque Immatriculation (apiplaqueimmatriculation.com)**: Used for vehicle data auto-fill.
- **react-phone-input-2**: Provides international phone number input functionality.