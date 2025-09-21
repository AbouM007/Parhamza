export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  type: "pending" | "individual" | "professional";
  companyName?: string;
  companyLogo?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  siret?: string;
  bio?: string;
  avatar?: string;
  specialties?: string[];
  verified: boolean;
  emailVerified?: boolean;
  contactPreferences?: ("whatsapp" | "phone" | "email")[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  category: SubcategoryId;
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: "gasoline" | "diesel" | "electric" | "hybrid";
  condition: "new" | "used" | "damaged";
  price: number;
  location: string;
  images: string[];
  features: string[];
  isPremium: boolean;
  premiumType?: "daily" | "weekly" | "monthly";
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  favorites: number;
  status: "draft" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isActive?: boolean; // Pour l'activation/désactivation des annonces
  // Champs boost (viennent de la vue annonces_with_boost)
  isBoosted?: boolean;
  boostedUntil?: Date;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  vehicleId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface SearchFilters {
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
  viewMode?: "categorized" | "standard";
  listing_type?: "sale" | "search";
  sortBy?: "date" | "price_asc" | "price_desc" | "mileage";
}

// Type pour les catégories principales
export type CategoryId =
  | "voiture-utilitaire"
  | "moto-scooter-quad"
  | "nautisme-sport-aerien"
  | "services"
  | "pieces";

// Type pour les sous-catégories
export type SubcategoryId =
  | "voiture"
  | "utilitaire"
  | "caravane"
  | "remorque"
  | "moto"
  | "scooter"
  | "quad"
  | "bateau"
  | "jetski"
  | "aerien"
  | "reparation"
  | "remorquage"
  | "entretien"
  | "autre-service"
  | "piece-voiture"
  | "piece-moto"
  | "autre-piece";

export interface PremiumOption {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
  features: string[];
}

export interface AccountSetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}
