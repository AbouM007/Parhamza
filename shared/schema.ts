import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  json,
  uuid,
  pgEnum,
  numeric,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table users unifiée - tous les profils utilisateurs
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  phone: text("phone").unique(),
  whatsapp: text("whatsapp").unique(),
  type: text("type").notNull().default("pending"),
  companyName: text("company_name"),

  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  website: text("website"),
  siret: text("siret"),
  bio: text("bio"),
  avatar: text("avatar"),
  specialties: json("specialties").$type<string[]>(),
  verified: boolean("verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  contactPreferences: json("contact_preferences").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  profileCompleted: boolean("profile_completed").default(false),
  onboardingStatus: text("onboarding_status").notNull().default("incomplete_profile"),
});

export const annonces = pgTable("annonces", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage"),
  fuelType: text("fuel_type"),
  transmission: text("transmission"),
  color: text("color"),
  power: integer("power"),
  emissionClass: text("emission_class"),
  vehicleSpecifications: json("vehicle_specifications").$type<{
    // Voiture
    vehicleType?: string;
    doors?: number;
    fiscalHorsepower?: number;
    upholstery?: string;

    // Moto
    motorcycleType?: string;
    displacement?: number;
    licenseType?: string;
    version?: string;

    // Utilitaire
    utilityType?: string;
    payload?: number;
    volume?: number;
    seats?: number;

    // Remorque
    trailerType?: string;
    dimensions?: string;
    emptyWeight?: number;
    maxWeight?: number;

    // Jet Ski
    jetskiType?: string;
    usageHours?: number;

    // Équipements
    equipment?: string[];

    // Pièces détachées
    sparePartCondition?: string; // "neuf" | "occasion"
    sparePartType?: string; // "moteur" | "carrosserie" | "electrique" | "freinage" | "suspension" | "interieur" | "vitrage" | "autres"
  }>().default({}),
  condition: text("condition").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  location: text("location").notNull(),
  images: json("images").$type<string[]>().default([]),
  features: json("features").$type<string[]>().default([]),
  damageDetails: json("damage_details").$type<{
    damageTypes?: string[];
    mechanicalState?: string;
    severity?: string;
  }>(),
  compatibilityTags: text("compatibility_tags").array().$type<string[]>(),
  isPremium: boolean("is_premium").default(false),
  premiumType: text("premium_type"),
  premiumExpiresAt: timestamp("premium_expires_at"),
  views: integer("views").default(0),
  favorites: integer("favorites").default(0),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  listingType: text("listing_type").notNull().default("sale"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  contactWhatsapp: text("contact_whatsapp"),
  hidePhone: boolean("hide_phone").default(false),
  hideWhatsapp: boolean("hide_whatsapp").default(false),
  hideMessages: boolean("hide_messages").default(false),
  isActive: boolean("is_active").default(true),
  deletedAt: timestamp("deleted_at"),
  deletionReason: text("deletion_reason"),
  deletionComment: text("deletion_comment"),
  priorityScore: integer("priority_score").default(0),
  professionalAccountId: integer("professional_account_id").references(
    () => professionalAccounts.id,
  ),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: text("from_user_id")
    .references(() => users.id)
    .notNull(),
  toUserId: text("to_user_id")
    .references(() => users.id)
    .notNull(),
  vehicleId: text("vehicle_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  read: boolean("read").default(false),
});

// Wishlist table for favorite vehicles
export const wishlist = pgTable("wishlist", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  vehicleId: text("vehicle_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin tables
export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("moderator"), // 'super_admin' | 'admin' | 'moderator'
  permissions: json("permissions").$type<Record<string, boolean>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types pour la table users unifiée
export type UserProfile = typeof users.$inferSelect;
export type InsertUserProfile = typeof users.$inferInsert;

// Schémas Zod pour users (remplace les anciens schémas profiles)
export const insertUserProfileSchema = createInsertSchema(users);
export const updateUserProfileSchema = insertUserProfileSchema.partial();

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  annonceId: text("annonce_id"),
  reporterUserId: text("reporter_user_id"),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  adminResponse: text("admin_response"),
  adminUserId: text("admin_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  details: json("details").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved searches table for alerts
export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(), // User-given name for the search
  filters: json("filters")
    .$type<{
      category?: string;
      subcategory?: string;
      brand?: string;
      model?: string;
      yearFrom?: number;
      yearTo?: number;
      mileageFrom?: number;
      mileageTo?: number;
      priceFrom?: number;
      priceTo?: number;
      fuelType?: string;
      condition?: string;
      location?: string;
      searchTerm?: string;
    }>()
    .notNull(),
  alertsEnabled: boolean("alerts_enabled").default(false),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tables professionnelles
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceMonthly: real("price_monthly").notNull(),
  priceYearly: real("price_yearly"),
  maxListings: integer("max_listings"),
  features: json("features").$type<Record<string, boolean>>().default({}),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proStatusEnum = pgEnum("pro_status", [
  "pending_docs",
  "under_review",
  "verified",
  "rejected",
]);

export const professionalAccounts = pgTable("professional_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull()
    .unique(), // Contrainte unique : 1 compte pro par utilisateur
  companyName: text("company_name").notNull(),
  siret: text("siret").unique(),
  companyAddress: text("company_address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  membership: text("membership")
    .$type<"free" | "paid" | "canceled">()
    .default("free"),
  // ✅ Nouveau statut canonique
  status: proStatusEnum("status").default("pending_docs"),

  // ♻️ Legacy (on conserve pour compat)
  isVerified: boolean("is_verified").default(false),
  verificationStatus: text("verification_status"),
  verifiedAt: timestamp("verified_at"),
  rejectedReason: text("rejected_reason"),
  // Champs de personnalisation pour la boutique
  avatar: text("avatar"),
  bannerImage: text("banner_image"),
  brandColors: json("brand_colors").$type<{
    primary: string;
    secondary: string;
  }>(),
  description: text("description"),
  specialties: json("specialties").$type<string[]>().default([]),
  certifications: json("certifications").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  user_id: text("user_id") // ← AJOUTER cette ligne
    .references(() => users.id)
    .notNull(),
  professional_account_id: integer("professional_account_id"),
//  plan_id: text("plan_id").notNull(),
  plan_id: integer("plan_id")
  .notNull()
  .references(() => subscriptionPlans.id),


  stripe_subscription_id: text("stripe_subscription_id").unique(),
  status: text("status")
    .$type<"active" | "cancelled" | "expired" | "pending" | "trialing">()
    .default("pending"),
  current_period_start: timestamp("current_period_start"),
  current_period_end: timestamp("current_period_end"),
  cancel_at_period_end: boolean("cancel_at_period_end"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index unique : un seul abonnement actif par user
  uniqueActivePerUser: uniqueIndex("uniq_active_subscription_per_user")
    .on(table.user_id)
    .where(sql`status IN ('active', 'trialing')`),
  
  // Contrainte : au moins une référence (user_id ou professional_account_id)
  hasReference: check("subscriptions_has_ref_chk", 
    sql`user_id IS NOT NULL OR professional_account_id IS NOT NULL`
  ),
}));

// Table d'historique des abonnements pour garder trace des upgrades/downgrades
export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  user_id: text("user_id")
    .references(() => users.id)
    .notNull(),
  change_type: text("change_type")
    .$type<"upgrade" | "downgrade" | "new" | "cancelled">()
    .notNull(),
  old_plan_id: integer("old_plan_id")
    .references(() => subscriptionPlans.id),
  new_plan_id: integer("new_plan_id")
    .references(() => subscriptionPlans.id),
  old_stripe_subscription_id: text("old_stripe_subscription_id"),
  new_stripe_subscription_id: text("new_stripe_subscription_id"),
  changed_at: timestamp("changed_at").defaultNow().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(), // Infos supplémentaires si besoin
});

export const stripeEventsProcessed = pgTable("stripe_events_processed", {
  id: serial("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const verificationDocumentType = pgEnum("verification_document_type", [
  "kbis",
  "id_pdf",
  "id_front",
  "id_back",
  "other",
]);

export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  professionalAccountId: integer("professional_account_id")
    .references(() => professionalAccounts.id)
    .notNull(),
  documentType: verificationDocumentType("document_type").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  verificationStatus: text("verification_status")
    .$type<"pending" | "approved" | "rejected">()
    .default("pending"),
  adminNotes: text("admin_notes"),
});

export const professionalProfiles = pgTable("professional_profiles", {
  id: serial("id").primaryKey(),
  professionalAccountId: integer("professional_account_id")
    .references(() => professionalAccounts.id)
    .notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  openingHours: json("opening_hours")
    .$type<Record<string, string>>()
    .default({}),
  whatsappNumber: text("whatsapp_number"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  specialties: json("specialties").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tables pour le système de boost des annonces
export const boostPlans = pgTable("boost_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("eur"),
  stripePriceId: text("stripe_price_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annonceBoosts = pgTable("annonce_boosts", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id")
    .references(() => annonces.id)
    .notNull(),
  planId: integer("plan_id")
    .references(() => boostPlans.id)
    .notNull(),
  stripeSessionId: text("stripe_session_id").unique(),
  isActive: boolean("is_active").default(true),
  startAt: timestamp("start_at").defaultNow().notNull(),
  endAt: timestamp("end_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schémas d'insertion
export const insertUserSchema = createInsertSchema(users);
export const insertVehicleSchema = createInsertSchema(annonces).omit({
  id: true,
});
export const insertMessageSchema = createInsertSchema(messages);
export const insertWishlistSchema = createInsertSchema(wishlist);
export const insertSavedSearchSchema = createInsertSchema(savedSearches);
export const insertProfessionalAccountSchema = createInsertSchema(
  professionalAccounts,
).omit({ id: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});
export const insertVerificationDocumentSchema = createInsertSchema(
  verificationDocuments,
).omit({ id: true });
export const insertProfessionalProfileSchema = createInsertSchema(
  professionalProfiles,
).omit({ id: true });
export const insertBoostPlanSchema = createInsertSchema(boostPlans).omit({
  id: true,
});
export const insertAnnonceBoostSchema = createInsertSchema(annonceBoosts).omit({
  id: true,
});

// Types d'insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type InsertProfessionalAccount = z.infer<
  typeof insertProfessionalAccountSchema
>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertVerificationDocument = z.infer<
  typeof insertVerificationDocumentSchema
>;
export type InsertProfessionalProfile = z.infer<
  typeof insertProfessionalProfileSchema
>;
export type InsertBoostPlan = z.infer<typeof insertBoostPlanSchema>;
export type InsertAnnonceBoost = z.infer<typeof insertAnnonceBoostSchema>;

// Types de sélection
export type User = typeof users.$inferSelect;
export type Vehicle = typeof annonces.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Wishlist = typeof wishlist.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type ProfessionalAccount = typeof professionalAccounts.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type BoostPlan = typeof boostPlans.$inferSelect;
export type AnnonceBoost = typeof annonceBoosts.$inferSelect;
