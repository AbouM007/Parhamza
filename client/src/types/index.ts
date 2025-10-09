export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
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
  profileCompleted?: boolean;
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
  fuelType?: string;
  transmission?: string; // Boîte de vitesses (voiture/utilitaire)
  color?: string; // Couleur
  power?: number; // Puissance en CH
  emissionClass?: string; // Classe d'émissions
  engineSize?: number; // Cylindrée (moto/scooter)
  vehicleType?: string; // Type de véhicule (voiture, moto, bateau, etc.)
  length?: number; // Longueur en mètres (bateau)
  serviceType?: string; // Type de service
  serviceZone?: string; // Zone d'intervention (services)
  partCategory?: string; // Type de pièce (pièces détachées)
  condition: string;
  price: number;
  location: string;
  images: string[];
  features: string[];
  damageDetails?: {
    damageTypes?: string[];
    mechanicalState?: string;
    severity?: string;
  };
  compatibilityTags?: string[];
  vehicleSpecifications?: {
    doors?: number | null;
    seats?: number | null;
    volume?: number | null;
    payload?: number | null;
    version?: string | null;
    equipment?: string[];
    maxWeight?: number | null;
    dimensions?: string | null;
    jetskiType?: string | null;
    upholstery?: string | null;
    usageHours?: number | null;
    emptyWeight?: number | null;
    licenseType?: string | null;
    trailerType?: string | null;
    utilityType?: string | null;
    vehicleType?: string | null;
    displacement?: number | null;
    motorcycleType?: string | null;
    fiscalHorsepower?: number | null;
  };
  isPremium: boolean;
  premiumType?: "daily" | "weekly" | "monthly";
  premiumExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  favorites: number;
  status: "draft" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isActive?: boolean;
  // Champs boost (viennent de la vue annonces_with_boost)
  isBoosted?: boolean;
  boostedUntil?: Date;
  // Informations de contact spécifiques à l'annonce
  listingType?: "sale" | "search";
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWhatsapp?: string | null;
  hidePhone?: boolean;
  hideWhatsapp?: boolean;
  hideMessages?: boolean;
  // Informations de suppression
  deletedAt?: Date | null;
  deletionReason?: string | null;
  deletionComment?: string | null;
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
  viewMode?: "categorized" | "categorized-parts" | "categorized-services" | "standard";
  listing_type?: "sale" | "search";
  sortBy?: "date" | "price_asc" | "price_desc" | "mileage";
  // Nouveaux filtres adaptatifs
  transmission?: string; // Boîte de vitesses (voiture/utilitaire)
  engineSize?: number; // Cylindrée (moto/scooter)
  vehicleType?: string; // Type de véhicule (voiture, moto, bateau, jetski, etc.)
  length?: number; // Longueur en mètres (bateau)
  serviceType?: string; // Type de service
  serviceZone?: string; // Zone d'intervention (services)
  partCategory?: string; // Type de pièce (pièces détachées)
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
