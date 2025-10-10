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

### Technical Implementations
**Frontend**: Built with React 18 and TypeScript, using Vite for tooling, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for form handling.
**Backend**: Developed with Node.js and Express in TypeScript, utilizing Supabase client for database interactions and Supabase Auth for authentication. Key features include:
- **Listing Management**: Comprehensive tools for vehicle and spare parts listings, including an optional plate search for auto-filling vehicle data from an external API.
- **Compatibility Tags**: An intelligent system for spare parts listings that allows for dynamic filtering and searching by vehicle brands and models.
- **Subscription & Professional Features**: Management of user subscriptions, professional account verification, and premium listing options.
- **Messaging & Notifications**: An integrated messaging system complemented by a centralized, event-driven multi-channel notification system with user-configurable preferences. The notification system uses Supabase for data storage and supports in-app notifications, email notifications (Phase 6), and push notifications (Phase 7). All 11 notification types are integrated with automatic triggers across the platform (messages, follows, favorites, listings, payments, subscriptions).
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