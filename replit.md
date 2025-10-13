# PassionAuto2Roues - Marketplace Automobile

## Overview
PassionAuto2Roues is an online marketplace for buying and selling used vehicles, damaged vehicles, and automotive spare parts. It connects individual users and professional sellers through a subscription-based monetization model, premium listing options, and a verification system. The platform aims to become a leading platform in the used vehicle and spare parts market, offering integrated messaging, secure payment processing, and comprehensive user management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a consistent design language with intuitive user flows, utilizing Radix UI, TailwindCSS, and shadcn/ui for a responsive and modern interface. This includes dynamic dashboard activity displays, optimized vehicle detail views, and a responsive home page. Contact information is protected based on user authentication status and listing ownership.

**Mobile Navigation Architecture**: A hierarchical 2-level accordion system for mobile menus, with smooth animations, visual indentation, and touch-friendly targets. Only one sub-accordion can be open at a time, and the menu closes automatically on navigation.

**Mobile Page Header Architecture**: A dual-header pattern optimized for mobile. User-specific pages display a minimal `MobilePageHeader` with a back arrow and page title, while public pages retain the full classic header.

**Dashboard Menu Architecture**: A single-pattern approach for all device sizes, featuring a vertical sidebar for desktop with full-width buttons, and a bottom navigation bar for mobile. Active tabs have gradient backgrounds and scale effects.

**Subscription & Account Page Enhancements**:
- **Account Page**: Includes an "Historique des achats" section.
- **Subscription Settings**: A mobile-optimized redesign featuring an active subscription alert, color-coded plan cards (Starter: Blue, Standard: Violet, Business: Orange) with visual badges for "Populaire" and "Plan actuel", and checkmarks matching plan themes for feature lists. React Query caching is used for performance.

### Technical Implementations
**Frontend**: Built with React 18 and TypeScript, using Vite, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for form handling.
**Backend**: Developed with Node.js and Express in TypeScript, utilizing Supabase client for database interactions and Supabase Auth for authentication. Key features include:
- **Listing Management**: Tools for vehicle and spare parts listings, including optional plate search for data auto-fill.
- **Compatibility Tags**: Intelligent system for spare parts filtering by vehicle brands and models.
- **Subscription & Professional Features**: Management of user subscriptions, professional account verification, and premium listing options.
- **Messaging & Notifications**: Integrated messaging and an event-driven multi-channel notification system (in-app, email, push - Phase 7). Email notifications are implemented with Nodemailer and 15 responsive HTML templates triggered automatically at key business events.
  - **Notification Preferences UI**: A comprehensive user interface at `/notification-settings` for managing preferences across all 16 notification types and 3 channels, using an accordion system with optimistic updates and toggle protection.
- **Followers System**: Allows users to follow professional sellers.
- **Listing Report & Moderation System**: Comprehensive reporting for listing moderation with both authenticated and anonymous reporting capabilities, including IP-based rate limiting (1 report/hour per IP for anonymous users). Admin report management is integrated as a dedicated "Signalements" tab in the admin dashboard, visible only to users with type="admin".
- **Search & Filters**: Advanced, adaptive search with category-specific visibility.
- **Data Persistence**: Hybrid storage (localStorage and IndexedDB) for create listing forms.

### System Design Choices
- **Database**: PostgreSQL hosted on Supabase, managed with Drizzle migrations, featuring Row Level Security (RLS) and robust entity relationships.
- **Image Handling**: Supabase Storage for media, with Sharp for server-side optimization and client-side canvas-based compression.
- **Authentication**: Supabase Auth for user registration, login, session management, and social logins (Google OAuth), supporting Individual, Professional, and Admin roles. JWT token management includes an interceptor-based solution for automatic retry with refresh on 401 errors, preventing race conditions.
- **Monetization**: Subscription plans and premium listing features.
- **Security**: Data integrity and user privacy through RLS, unique constraints, and controlled access.
- **Counters**: Atomic RPC functions in PostgreSQL for thread-safe updates of vehicle views and favorites.
- **Demo Listings**: System to mark and visually distinguish demonstration listings.

## External Dependencies

### Payment Processing
- **Stripe**: Subscriptions and premium features.
- **PayPal SDK**: Alternative payment options.

### Authentication Services
- **Supabase**: Authentication, database, and storage.
- **Google Cloud Console**: Google OAuth 2.0 integration.

### Development & Deployment
- **Replit**: Hosting and deployment.
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database migration and schema management.
- **TypeScript**: Type safety.

### Image & Media Processing
- **Sharp**: Server-side image manipulation.
- **Multer**: Multipart/form-data file uploads.
- **Fabric.js**: Client-side canvas manipulation.

### Utilities & Libraries
- **React Query**: Server state and caching.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **uuid**: Unique identifiers.
- **class-variance-authority**: Conditional CSS class management.
- **API Plaque Immatriculation (apiplaqueimmatriculation.com)**: Vehicle data auto-fill.
- **react-phone-input-2**: International phone number input.