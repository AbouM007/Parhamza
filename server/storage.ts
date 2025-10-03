import { supabaseServer } from "./supabase";
import {
  type User,
  type Vehicle,
  type Message,
  type Wishlist,
  type SavedSearch,
  type BoostPlan,
  type AnnonceBoost,
  type InsertUser,
  type InsertVehicle,
  type InsertMessage,
  type InsertWishlist,
  type InsertSavedSearch,
  type InsertBoostPlan,
  type InsertAnnonceBoost,
} from "../shared/schema";

console.log("🔗 Connexion Supabase initialisée avec le client officiel");

function safeJsonParse(value: any): any {
  if (!value) return [];

  try {
    // ✅ Si c'est déjà un objet (cas Supabase JSON natif)
    if (typeof value === "object") {
      return value;
    }

    // ✅ Si c'est une string, on parse
    if (typeof value === "string") {
      return JSON.parse(value);
    }

    // Cas non prévu → fallback
    return [];
  } catch {
    return [];
  }
}

// Helper function to validate damageDetails object
function validateDamageDetails(value: any): any {
  if (value == null) {
    return undefined;
  }

  let parsedValue = value;

  if (typeof parsedValue === "string") {
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch {
      return undefined;
    }
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    return undefined;
  }

  const damageTypesRaw =
    (parsedValue as any).damageTypes || (parsedValue as any).damage_types;
  const damageTypes = Array.isArray(damageTypesRaw)
    ? damageTypesRaw
    : typeof damageTypesRaw === "string"
      ? [damageTypesRaw]
      : undefined;
  const mechanicalState =
    (parsedValue as any).mechanicalState ||
    (parsedValue as any).mechanical_state;
  const severity = (parsedValue as any).severity;

  const hasValidData =
    (damageTypes && damageTypes.length > 0) || mechanicalState || severity;

  if (!hasValidData) {
    return undefined;
  }

  return {
    damageTypes,
    mechanicalState,
    severity,
  };
}

// Helper function to transform user data from Supabase
function transformUserFromSupabase(userRow: any): any {
  if (!userRow) return undefined;
  
  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    phone: userRow.phone,
    whatsapp: userRow.whatsapp,
    type: userRow.type,
    companyName: userRow.company_name,
    address: userRow.address,
    city: userRow.city,
    postalCode: userRow.postal_code,
    website: userRow.website,
    siret: userRow.siret,
    bio: userRow.bio,
    avatar: userRow.avatar,
    specialties: safeJsonParse(userRow.specialties),
    verified: userRow.verified,
    emailVerified: userRow.email_verified,
    contactPreferences: safeJsonParse(userRow.contact_preferences),
    createdAt: new Date(userRow.created_at),
    lastLoginAt: userRow.last_login_at
      ? new Date(userRow.last_login_at)
      : null,
    professionalAccount: userRow.professional_accounts?.[0]
      ? {
          companyName: userRow.professional_accounts[0].company_name,
          phone: userRow.professional_accounts[0].phone,
          email: userRow.professional_accounts[0].email,
          website: userRow.professional_accounts[0].website,
          description: userRow.professional_accounts[0].description,
          isVerified: userRow.professional_accounts[0].is_verified,
          verificationStatus: userRow.professional_accounts[0].verification_process_status,
          companyLogo: userRow.professional_accounts[0].avatar,
          bannerImage: userRow.professional_accounts[0].banner_image,
        }
      : undefined,
  };
}

// Helper function to transform vehicle data from Supabase
function transformVehicleFromSupabase(vehicleRow: any): any {
  return {
    id: vehicleRow.id.toString(),
    userId: vehicleRow.user_id,
    user: transformUserFromSupabase(vehicleRow.users),
    title: vehicleRow.title,
    description: vehicleRow.description,
    category: vehicleRow.category,
    brand: vehicleRow.brand,
    model: vehicleRow.model,
    year: vehicleRow.year,
    mileage: vehicleRow.mileage,
    fuelType: vehicleRow.fuel_type,
    condition: vehicleRow.condition,
    price: vehicleRow.price,
    location: vehicleRow.location,
    images: vehicleRow.images || [],
    features: vehicleRow.features || [],
    listingType: vehicleRow.listing_type || "sale",
    contactPhone: vehicleRow.contact_phone || null,
    contactEmail: vehicleRow.contact_email || null,
    contactWhatsapp: vehicleRow.contact_whatsapp || null,
    hidePhone: vehicleRow.hide_phone || false,
    isPremium: vehicleRow.is_premium,
    premiumType: vehicleRow.premium_type,
    premiumExpiresAt: vehicleRow.premium_expires_at
      ? new Date(vehicleRow.premium_expires_at)
      : null,
    isBoosted: vehicleRow.is_boosted || false,
    boostedUntil: vehicleRow.boosted_until
      ? new Date(vehicleRow.boosted_until)
      : undefined,
    createdAt: new Date(vehicleRow.created_at),
    updatedAt: new Date(vehicleRow.updated_at),
    views: vehicleRow.views,
    favorites: vehicleRow.favorites,
    status: vehicleRow.status,
    rejectionReason: vehicleRow.rejection_reason ?? undefined,
    isActive: vehicleRow.is_active !== false,
    deletedAt: vehicleRow.deleted_at ? new Date(vehicleRow.deleted_at) : null,
    deletionReason: vehicleRow.deletion_reason,
    deletionComment: vehicleRow.deletion_comment,
    damageDetails: validateDamageDetails(vehicleRow.damage_details),
    priorityScore: vehicleRow.priority_score ?? 0,
    professionalAccountId: vehicleRow.professional_account_id ?? null,
  };
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserIdToUuid(oldId: string, newUuid: string): Promise<User>;

  // Vehicles
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleWithUser(id: string): Promise<Vehicle | undefined>;
  getAllVehicles(): Promise<Vehicle[]>; // Seulement les annonces actives (site public)
  getAllVehiclesAdmin(): Promise<Vehicle[]>; // Toutes les annonces (admin/propriétaires)
  getPendingVehicles(): Promise<Vehicle[]>; // Annonces en attente de modération
  approveVehicle(id: string): Promise<boolean>; // Approuver une annonce
  rejectVehicle(id: string, reason?: string): Promise<boolean>; // Rejeter une annonce
  getVehiclesByUser(userId: string): Promise<Vehicle[]>;
  getDeletedVehiclesByUser(userId: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(
    id: string,
    updates: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  softDeleteVehicleWithReason(
    id: string,
    reason: string,
    comment?: string,
  ): Promise<boolean>;
  searchVehicles(filters: any): Promise<Vehicle[]>;
  updateVehicleActiveStatus(id: string, isActive: boolean): Promise<boolean>;

  // Professional accounts and subscriptions
  checkListingQuota(userId: string): Promise<{
    canCreate: boolean;
    activeListings: number;
    maxListings: number | null;
    message?: string;
  }>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByVehicle(vehicleId: string): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;

  // Wishlist / Favorites
  getUserWishlist(userId: string): Promise<Wishlist[]>;
  getUserFavorites(userId: string): Promise<Vehicle[]>;
  addToWishlist(item: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, vehicleId: string): Promise<boolean>;
  isInWishlist(userId: string, vehicleId: string): Promise<boolean>;

  // Saved Searches
  getUserSavedSearches(userId: string): Promise<SavedSearch[]>;
  createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch>;
  updateSavedSearch(
    id: string,
    updates: Partial<InsertSavedSearch>,
  ): Promise<SavedSearch | undefined>;
  deleteSavedSearch(id: string): Promise<boolean>;

  // Boost Plans
  getAllBoostPlans(): Promise<BoostPlan[]>;
  getBoostPlan(id: number): Promise<BoostPlan | undefined>;
  getBoostPlanByStripePrice(
    stripePriceId: string,
  ): Promise<BoostPlan | undefined>;

  // Boost Logs (nouveau système)
  createBoostLog(log: {
    annonceId: number;
    planId: number;
    stripeSessionId: string;
    action: string;
    amount: number;
    userId: string;
  }): Promise<void>;
  activateBoostWithLog(stripeSessionId: string): Promise<boolean>;
  checkBoostAlreadyActive(annonceId: number): Promise<boolean>;

  // Ancienne API (à supprimer)
  createAnnonceBoost(boost: InsertAnnonceBoost): Promise<AnnonceBoost>;
  getActiveBoostForAnnonce(
    annonceId: number,
  ): Promise<AnnonceBoost | undefined>;
  updateBoostSession(
    boostId: number,
    stripeSessionId: string,
  ): Promise<boolean>;
  activateBoost(stripeSessionId: string): Promise<boolean>;
}

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
    return data as User;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabaseServer
      .from("users")
      .select(
        `
        *,
        professional_accounts (
          company_name,
          siret
        )
      `,
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }

    if (!data) return undefined;

    // ✅ Ajouter les données professional_accounts
    const enrichedData = {
      ...data, // ← GARDE company_logo de users
      // Ajouter les infos professionnelles
      company_name: data.professional_accounts?.[0]?.company_name || null,
      siret: data.professional_accounts?.[0]?.siret || null,
    };

    // Supprimer l'objet imbriqué
    delete enrichedData.professional_accounts;

    return enrichedData as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseServer
      .from("users")
      .insert(user)
      .select()
      .single();

    if (error) {
      // 📱 Détecter erreur contrainte téléphone (unique)
      if (error.code === "23505" && error.message.includes("phone")) {
        throw new Error("PHONE_ALREADY_EXISTS");
      }

      // 📧 Détecter erreur contrainte email (unique)
      if (error.code === "23505" && error.message.includes("email")) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      // 🚨 Autres erreurs de contrainte
      if (error.code === "23505") {
        throw new Error("DUPLICATE_VALUE");
      }

      // ⚠️ Erreur générique
      throw new Error(`Error creating user: ${error.message}`);
    }
    return data as User;
  }

  async updateUserIdToUuid(oldId: string, newUuid: string): Promise<User> {
    console.log(`🔄 Migration ID utilisateur: ${oldId} → ${newUuid}`);

    try {
      // 1. Récupérer l'utilisateur existant
      const { data: existingUser, error: fetchError } = await supabaseServer
        .from("users")
        .select("*")
        .eq("id", oldId)
        .single();

      if (fetchError || !existingUser) {
        throw new Error(`Utilisateur ${oldId} introuvable`);
      }

      // 2. Créer un nouvel utilisateur avec l'UUID
      const { data: newUser, error: insertError } = await supabaseServer
        .from("users")
        .insert({
          ...existingUser,
          id: newUuid,
          createdAt: existingUser.createdAt,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erreur création nouveau user: ${insertError.message}`);
      }

      // 3. Mettre à jour les annonces
      const { error: annoncesError } = await supabaseServer
        .from("annonces")
        .update({ user_id: newUuid })
        .eq("user_id", oldId);

      if (annoncesError) {
        console.error("⚠️ Erreur mise à jour annonces:", annoncesError);
      }

      // 4. Mettre à jour les messages
      const { error: messagesFromError } = await supabaseServer
        .from("messages")
        .update({ from_user_id: newUuid })
        .eq("from_user_id", oldId);

      const { error: messagesToError } = await supabaseServer
        .from("messages")
        .update({ to_user_id: newUuid })
        .eq("to_user_id", oldId);

      if (messagesFromError || messagesToError) {
        console.error(
          "⚠️ Erreur mise à jour messages:",
          messagesFromError,
          messagesToError,
        );
      }

      // 5. Supprimer l'ancien utilisateur
      const { error: deleteError } = await supabaseServer
        .from("users")
        .delete()
        .eq("id", oldId);

      if (deleteError) {
        console.error("⚠️ Erreur suppression ancien user:", deleteError);
      }

      console.log(`✅ Migration réussie: ${oldId} → ${newUuid}`);
      return newUser as User;
    } catch (error) {
      console.error(`❌ Erreur migration ID:`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseServer.from("users").select("*");

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return data as User[];
  }

  // Vehicles
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const { data, error } = await supabaseServer
      .from("annonces")
      .select(
        `
        *,
        users(*,
          professional_accounts(*)
        )
      `,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("Error fetching vehicle:", error);
      return undefined;
    }

    return transformVehicleFromSupabase(data);
  }

  async getVehicleWithUser(id: string): Promise<Vehicle | undefined> {
    // Rediriger vers getVehicle car il inclut déjà les users
    return this.getVehicle(id);
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    console.log(
      "🔄 Récupération des annonces ACTIVES avec users depuis Supabase...",
    );

    try {
      // Utiliser la vue annonces_with_boost pour inclure les informations de boost
      // FILTRE IMPORTANT: Seulement les annonces approuvées, actives et non supprimées pour le site public
      let { data, error } = await supabaseServer
        .from("annonces")
        .select(
          `
          *,
          users (*,
            professional_accounts(*)
          )
        `,
        )
        .eq("status", "approved")
        .neq("is_active", false)
        .is("deleted_at", null)
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur Supabase:", error.message);
        console.log("❌ Rechute vers requête directe...");

        // Fallback: récupérer séparément les véhicules et utilisateurs
        const { data: vehiclesData, error: vehiclesError } =
          await supabaseServer
            .from("annonces")
            .select("*")
            .eq("status", "approved")
            .neq("is_active", false)
            .order("created_at", { ascending: false });

        if (vehiclesError) {
          throw new Error(`Error fetching vehicles: ${vehiclesError.message}`);
        }

        const { data: usersData, error: usersError } = await supabaseServer
          .from("users")
          .select("*");

        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`);
        }

        // Associer manuellement les données
        data = vehiclesData.map((vehicle: any) => {
          const user = usersData.find((u: any) => u.id === vehicle.user_id);
          return { ...vehicle, users: user };
        });
      }

      console.log(
        "✅ Annonces ACTIVES avec users récupérées depuis Supabase:",
        data?.length || 0,
      );

      if (data && data.length > 0) {
        // Transformer les données de la table annonces vers le format Vehicle avec user inclus
        return data.map((vehicle: any) => transformVehicleFromSupabase(vehicle));
      } else {
        console.log(
          "⚠️  Table annonces vide dans Supabase, utilisation des données mock",
        );
        throw new Error("Empty annonces table");
      }
    } catch (error) {
      console.error("❌ Rechute vers données mock");
      throw error;
    }
  }

  async getVehiclesByUser(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabaseServer
      .from("annonces")
      .select(
        `
        *,
        users (*)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user vehicles:", error);
      return [];
    }

    return (data || []).map((vehicle: any) => transformVehicleFromSupabase(vehicle));
  }

  async getDeletedVehiclesByUser(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabaseServer
      .from("annonces")
      .select(
        `
        *,
        users (*)
      `,
      )
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Error fetching deleted user vehicles:", error);
      return [];
    }

    return data.map((vehicle: any) => transformVehicleFromSupabase(vehicle));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    console.log(
      "🔍 DONNÉES AVANT TRANSFORMATION:",
      JSON.stringify(vehicle, null, 2),
    );

    // FORCER LA SUPPRESSION de tout champ id qui pourrait être caché
    const cleanVehicle = { ...vehicle };
    delete (cleanVehicle as any).id;

    // Transformer les données du format Vehicle vers le format table annonces
    // L'ID sera auto-généré par Supabase (auto-increment)
    const annonceData: any = {
      user_id: cleanVehicle.userId,
      title: cleanVehicle.title,
      description: cleanVehicle.description,
      category: cleanVehicle.category,
      price: cleanVehicle.price || 0,
      // FIX LOCALISATION : Convertir l'objet location en string
      location:
        typeof cleanVehicle.location === "object"
          ? `${(cleanVehicle.location as any).city} (${(cleanVehicle.location as any).postalCode})`
          : cleanVehicle.location,
      images: cleanVehicle.images || [],
      features: cleanVehicle.features || [],
      is_premium: cleanVehicle.isPremium || false,
      views: cleanVehicle.views || 0,
      favorites: cleanVehicle.favorites || 0,
      status: cleanVehicle.status || "draft", // Nouvelles annonces en brouillon par défaut
      listing_type: (cleanVehicle as any).listingType || "sale",
    };

    // Ajouter les champs avec valeurs par défaut pour respecter les contraintes Supabase
    annonceData.brand = cleanVehicle.brand || "Non spécifié";
    annonceData.model = cleanVehicle.model || "Non spécifié";
    annonceData.year = cleanVehicle.year || new Date().getFullYear();
    annonceData.mileage = cleanVehicle.mileage || 0;
    annonceData.fuel_type = cleanVehicle.fuelType || "Non spécifié";
    annonceData.condition = cleanVehicle.condition || "good";

    // Informations de contact spécifiques à l'annonce
    if ((cleanVehicle as any).contactPhone)
      annonceData.contact_phone = (cleanVehicle as any).contactPhone;
    if ((cleanVehicle as any).contactEmail)
      annonceData.contact_email = (cleanVehicle as any).contactEmail;
    if ((cleanVehicle as any).contactWhatsapp)
      annonceData.contact_whatsapp = (cleanVehicle as any).contactWhatsapp;
    if ((cleanVehicle as any).hidePhone !== undefined)
      annonceData.hide_phone = (cleanVehicle as any).hidePhone;

    if (cleanVehicle.premiumType)
      annonceData.premium_type = cleanVehicle.premiumType;
    if (cleanVehicle.premiumExpiresAt)
      annonceData.premium_expires_at = cleanVehicle.premiumExpiresAt;

    // Informations sur les dommages (véhicules accidentés)
    if ((cleanVehicle as any).damageDetails)
      annonceData.damage_details = (cleanVehicle as any).damageDetails;

    // DOUBLE VÉRIFICATION : supprimer tout id qui pourrait s'être glissé
    delete annonceData.id;

    console.log(
      "🔍 DONNÉES ENVOYÉES À SUPABASE:",
      JSON.stringify(annonceData, null, 2),
    );

    // SOLUTION TEMPORAIRE : Récupérer le MAX ID et forcer la séquence
    const { data: maxIdData } = await supabaseServer
      .from("annonces")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdData && maxIdData.length > 0) {
      const nextId = maxIdData[0].id + 1;
      console.log(`🔧 FORÇAGE ID: ${nextId} (MAX actuel: ${maxIdData[0].id})`);
      annonceData.id = nextId;
    }

    const { data, error } = await supabaseServer
      .from("annonces")
      .insert(annonceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating vehicle: ${error.message}`);
    }

    // Transformer la réponse vers le format Vehicle
    const transformedData = {
      id: data.id.toString(), // Convertir l'integer en string pour compatibilité
      userId: data.user_id,
      title: data.title,
      description: data.description,
      category: data.category,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      fuelType: data.fuel_type,
      condition: data.condition,
      price: data.price,
      location: data.location,
      images: data.images || [],
      features: data.features || [],
      listingType: data.listing_type || "sale", // Nouveau champ listing_type
      // Informations de contact spécifiques à l'annonce
      contactPhone: data.contact_phone || null,
      contactEmail: data.contact_email || null,
      contactWhatsapp: data.contact_whatsapp || null,
      hidePhone: data.hide_phone || false,
      isPremium: data.is_premium,
      premiumType: data.premium_type,
      premiumExpiresAt: data.premium_expires_at
        ? new Date(data.premium_expires_at)
        : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      views: data.views,
      favorites: data.favorites,
      status: data.status,
      isActive: data.is_active !== false,
      damageDetails: validateDamageDetails(data.damage_details),
    };

    return transformedData as Vehicle;
  }

  async updateVehicle(
    id: string,
    updates: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from("annonces")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating vehicle:", error);
      return undefined;
    }
    return data as Vehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from("annonces")
      .delete()
      .eq("id", id);

    return !error;
  }

  async softDeleteVehicleWithReason(
    id: string,
    reason: string,
    comment?: string,
  ): Promise<boolean> {
    try {
      // Utiliser une requête SQL directe pour contourner le problème de cache Supabase
      const { error } = await supabaseServer.rpc("soft_delete_vehicle", {
        vehicle_id: parseInt(id),
        delete_reason: reason,
        delete_comment: comment || null,
      });

      if (error) {
        console.error("Error with RPC soft delete:", error);
        // Fallback : essayer une requête SQL directe
        const { error: sqlError } = await supabaseServer
          .from("annonces")
          .update({
            deleted_at: new Date().toISOString(),
            deletion_reason: reason,
            deletion_comment: comment || null,
            is_active: false,
          })
          .eq("id", parseInt(id));

        if (sqlError) {
          console.error("Error soft deleting vehicle:", sqlError);
          return false;
        }
      }

      console.log(`✅ Annonce ${id} supprimée avec raison: ${reason}`);
      return true;
    } catch (error) {
      console.error("Unexpected error soft deleting vehicle:", error);
      return false;
    }
  }

  async searchVehicles(filters: any): Promise<Vehicle[]> {
    let query = supabaseServer.from("annonces").select(`
        *,
        users (*)
      `);

    // FILTRE IMPORTANT: Seulement les annonces approuvées, actives et non supprimées pour les recherches publiques
    query = query
      .eq("status", "approved")
      .neq("is_active", false)
      .is("deleted_at", null);

    // Apply filters
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.brand) {
      query = query.eq("brand", filters.brand);
    }
    if (filters.condition) {
      query = query.eq("condition", filters.condition);
    }
    if (filters.yearFrom) {
      query = query.gte("year", filters.yearFrom);
    }
    if (filters.yearTo) {
      query = query.lte("year", filters.yearTo);
    }
    if (filters.priceFrom) {
      query = query.gte("price", filters.priceFrom);
    }
    if (filters.priceTo) {
      query = query.lte("price", filters.priceTo);
    }
    if (filters.searchTerm) {
      query = query.ilike("title", `%${filters.searchTerm}%`);
    }

    // Order by premium first, then by created date
    query = query
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error searching vehicles:", error);
      return [];
    }

    return data as Vehicle[];
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching message:", error);
      return undefined;
    }
    return data as Message;
  }

  async getMessagesByVehicle(vehicleId: string): Promise<Message[]> {
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vehicle messages:", error);
      return [];
    }
    return data as Message[];
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user messages:", error);
      return [];
    }
    return data as Message[];
  }

  async createMessage(message: any): Promise<Message> {
    console.log(
      "🔍 createMessage appelé avec:",
      JSON.stringify(message, null, 2),
    );

    // Vérification des champs nécessaires
    if (!message.id) throw new Error("Message ID is required");
    if (!message.from_user_id && !message.fromUserId)
      throw new Error("from_user_id is required");
    if (!message.to_user_id && !message.toUserId)
      throw new Error("to_user_id is required");
    if (!message.annonce_id && !message.vehicleId)
      throw new Error("vehicle_id/annonce_id is required");
    if (!message.content) throw new Error("content is required");

    // Adapter les noms de champs pour qu'ils correspondent à la DB réelle
    const adaptedMessage = {
      id: message.id,
      from_user_id: message.from_user_id || message.fromUserId,
      to_user_id: message.to_user_id || message.toUserId,
      // Adapter selon ce qui existe réellement dans la DB
      ...(message.annonce_id ? { annonce_id: message.annonce_id } : {}),
      ...(message.vehicleId ? { vehicle_id: message.vehicleId } : {}),
      content: message.content,
      created_at:
        message.created_at || message.createdAt || new Date().toISOString(),
      read: message.read !== undefined ? message.read : false,
    };

    console.log(
      "📦 Message adapté pour Supabase:",
      JSON.stringify(adaptedMessage, null, 2),
    );

    try {
      const { data, error } = await supabaseServer
        .from("messages")
        .insert(adaptedMessage)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur Supabase détaillée:", error);
        throw new Error(`Error creating message: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned after creating message");
      }

      console.log("✅ Message créé dans la BD:", data.id);
      return data as Message;
    } catch (err) {
      console.error("❌ Exception complète:", err);
      throw err;
    }
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from("messages")
      .update({ read: true })
      .eq("id", id);

    return !error;
  }

  // Wishlist methods
  async getUserWishlist(userId: string): Promise<Wishlist[]> {
    const { data, error } = await supabaseServer
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }
    return data as Wishlist[];
  }

  async getUserFavorites(userId: string): Promise<Vehicle[]> {
    console.log(
      "🔄 Récupération favoris avec table wishlist dédiée pour:",
      userId,
    );

    try {
      // Essayer d'abord la table wishlist dédiée
      const { data: wishlistData, error: wishlistError } = await supabaseServer
        .from("wishlist")
        .select("vehicle_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      let favoriteIds: string[] = [];

      if (wishlistError) {
        console.log(
          "❌ Table wishlist non disponible, utilisation bio:",
          wishlistError,
        );
        // Fallback vers le système bio
        const user = await this.getUser(userId);
        if (!user) return [];

        try {
          if (user.bio && user.bio.trim() !== "") {
            const bioData = JSON.parse(user.bio);
            favoriteIds = bioData.favorites || [];
          }
        } catch (e) {
          return [];
        }
      } else {
        // Utiliser la table wishlist dédiée
        favoriteIds = (wishlistData || []).map((item) => item.vehicle_id);
        console.log("✅ Favoris récupérés depuis table dédiée:", favoriteIds);
      }

      if (favoriteIds.length === 0) {
        console.log("✅ Aucun favori trouvé");
        return [];
      }

      // Convertir les IDs en nombres pour la requête Supabase
      const numericIds = favoriteIds
        .map((id) => parseInt(id.toString()))
        .filter((id) => !isNaN(id));

      if (numericIds.length === 0) {
        console.log("✅ Aucun ID valide trouvé");
        return [];
      }

      console.log("🔍 IDs numériques pour requête optimisée:", numericIds);

      // Requête optimisée : récupérer tous les véhicules favoris en une fois
      const { data: annonceData, error: annonceError } = await supabaseServer
        .from("annonces")
        .select(
          `
          *,
          users!annonces_user_id_fkey (
            id, email, name, phone, whatsapp, type, company_name, 
            avatar, address, city, postal_code, website, 
            bio, specialties, verified, email_verified, 
            contact_preferences, created_at, last_login_at
          )
        `,
        )
        .in("id", numericIds)
        .eq("status", "approved");

      if (annonceError) {
        console.error(
          "❌ Erreur récupération favoris optimisée:",
          annonceError,
        );
        return [];
      }

      // Transformer les données en format Vehicle
      const favorites = (annonceData || []).map((annonce) => ({
        id: annonce.id.toString(),
        userId: annonce.user_id,
        user: annonce.users
          ? {
              id: annonce.users.id,
              email: annonce.users.email,
              name: annonce.users.name,
              phone: annonce.users.phone,
              whatsapp: annonce.users.whatsapp,
              type: annonce.users.type,
              companyName: annonce.users.company_name,
              //companyLogo: annonce.users.company_logo,
              address: annonce.users.address,
              city: annonce.users.city,
              postalCode: annonce.users.postal_code,
              website: annonce.users.website,
              bio: annonce.users.bio,
              avatar: annonce.users.avatar,
              specialties: annonce.users.specialties || [],
              verified: annonce.users.verified,
              emailVerified: annonce.users.email_verified,
              contactPreferences: annonce.users.contact_preferences || [],
              createdAt: annonce.users.created_at,
            }
          : null,
        title: annonce.title,
        description: annonce.description,
        category: annonce.category,
        brand: annonce.brand,
        model: annonce.model,
        year: annonce.year,
        mileage: annonce.mileage,
        fuelType: annonce.fuel_type,
        condition: annonce.condition,
        price: annonce.price,
        location: annonce.location,
        images: annonce.images || [],
        features: annonce.features || [],
        listingType: annonce.listing_type || "sale",
        contactPhone: null,
        contactEmail: null,
        contactWhatsapp: null,
        hidePhone: false,
        isPremium: annonce.is_premium || false,
        premiumType: annonce.premium_type,
        createdAt: annonce.created_at,
        updatedAt: annonce.updated_at,
        views: annonce.views || 0,
        favorites: annonce.favorites || 0,
        status: annonce.status || "draft", // Nouvelles annonces en brouillon par défaut
        isActive: annonce.is_active !== false,
      }));

      console.log(
        "✅ Favoris récupérés avec détails (optimisé):",
        favorites.length,
      );
      return favorites as unknown as Vehicle[];
    } catch (error) {
      console.error("❌ Erreur dans getUserFavorites:", error);
      return [];
    }
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    console.log("🔄 Migration vers table wishlist dédiée:", item);

    try {
      // Essayer d'abord d'insérer dans la table wishlist dédiée
      const wishlistId = crypto.randomUUID();

      const { data: wishlistData, error: wishlistError } = await supabaseServer
        .from("wishlist")
        .upsert(
          {
            id: wishlistId,
            user_id: item.userId,
            vehicle_id: item.vehicleId.toString(), // TEXT type, pas INTEGER
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,vehicle_id",
          },
        )
        .select()
        .single();

      if (wishlistError) {
        console.log(
          "❌ Table wishlist non disponible, utilisation bio:",
          wishlistError,
        );
        // Fallback vers le système bio
        return await this.addToWishlistBio(item);
      }

      const result = {
        id: wishlistData.id,
        userId: wishlistData.user_id,
        vehicleId: wishlistData.vehicle_id, // Déjà en TEXT
        createdAt: new Date(wishlistData.created_at),
      };

      console.log("✅ Favori ajouté table wishlist dédiée:", result);
      return result as Wishlist;
    } catch (error) {
      console.error("❌ Erreur table wishlist, fallback bio:", error);
      return await this.addToWishlistBio(item);
    }
  }

  // Méthode fallback utilisant le bio
  async addToWishlistBio(item: InsertWishlist): Promise<Wishlist> {
    const user = await this.getUser(item.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    let favorites: string[] = [];
    try {
      if (user.bio && user.bio.trim() !== "") {
        const bioData = JSON.parse(user.bio);
        favorites = bioData.favorites || [];
      }
    } catch (e) {
      favorites = [];
    }

    if (!favorites.includes(item.vehicleId)) {
      favorites.push(item.vehicleId);

      const bioData = { favorites };
      const bioJson = JSON.stringify(bioData);

      const { error } = await supabaseServer
        .from("users")
        .update({ bio: bioJson })
        .eq("id", item.userId);

      if (error) {
        throw new Error(`Erreur sauvegarde favoris: ${error.message}`);
      }
    }

    return {
      id: crypto.randomUUID(),
      userId: item.userId,
      vehicleId: item.vehicleId,
      createdAt: new Date(),
    } as Wishlist;
  }

  async removeFromWishlist(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    console.log("🔄 Suppression favori table wishlist:", { userId, vehicleId });

    try {
      // Essayer d'abord la table wishlist dédiée
      const { error: wishlistError } = await supabaseServer
        .from("wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("vehicle_id", vehicleId.toString()); // TEXT type, pas INTEGER

      if (wishlistError) {
        console.log(
          "❌ Table wishlist non disponible, utilisation bio:",
          wishlistError,
        );
        return await this.removeFromWishlistBio(userId, vehicleId);
      }

      console.log("✅ Favori supprimé table wishlist dédiée");
      return true;
    } catch (error) {
      console.error("❌ Erreur table wishlist, fallback bio:", error);
      return await this.removeFromWishlistBio(userId, vehicleId);
    }
  }

  async removeFromWishlistBio(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    let favorites = [];
    try {
      if (user.bio) {
        const bioData = JSON.parse(user.bio);
        favorites = bioData.favorites || [];
      }
    } catch (e) {
      favorites = [];
    }

    favorites = favorites.filter((fav: string) => fav !== vehicleId);

    const bioData = { favorites };
    await supabaseServer
      .from("users")
      .update({ bio: JSON.stringify(bioData) })
      .eq("id", userId);

    return true;
  }

  async isInWishlist(userId: string, vehicleId: string): Promise<boolean> {
    console.log("🔄 Vérification favori table wishlist:", {
      userId,
      vehicleId,
    });

    try {
      // Essayer d'abord la table wishlist dédiée
      const { data: wishlistData, error: wishlistError } = await supabaseServer
        .from("wishlist")
        .select("id")
        .eq("user_id", userId)
        .eq("vehicle_id", parseInt(vehicleId))
        .limit(1);

      if (wishlistError) {
        console.log(
          "❌ Table wishlist non disponible, utilisation bio:",
          wishlistError,
        );
        return await this.isInWishlistBio(userId, vehicleId);
      }

      const isInWishlist = wishlistData && wishlistData.length > 0;
      console.log("✅ Véhicule en favori (table dédiée):", isInWishlist);
      return isInWishlist;
    } catch (error) {
      console.error("❌ Erreur table wishlist, fallback bio:", error);
      return await this.isInWishlistBio(userId, vehicleId);
    }
  }

  async isInWishlistBio(userId: string, vehicleId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.bio) return false;

    try {
      const bioData = JSON.parse(user.bio);
      const favorites = bioData.favorites || [];
      return favorites.includes(vehicleId);
    } catch (e) {
      return false;
    }
  }

  // Saved Searches methods
  async getUserSavedSearches(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabaseServer
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved searches:", error);
      return [];
    }
    return data as SavedSearch[];
  }

  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    // Mapper les champs vers les colonnes de la base de données
    const dbData = {
      id: search.id,
      user_id: search.userId,
      name: search.name,
      filters: search.filters,
      alerts_enabled: search.alertsEnabled || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from("saved_searches")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating saved search: ${error.message}`);
    }
    return data as SavedSearch;
  }

  async updateSavedSearch(
    id: string,
    updates: Partial<InsertSavedSearch>,
  ): Promise<SavedSearch | undefined> {
    // Mapper les champs vers les colonnes de la base de données
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.alertsEnabled !== undefined) {
      dbUpdates.alerts_enabled = updates.alertsEnabled;
    }
    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }
    if (updates.filters !== undefined) {
      dbUpdates.filters = updates.filters;
    }

    const { data, error } = await supabaseServer
      .from("saved_searches")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating saved search:", error);
      return undefined;
    }
    return data as SavedSearch;
  }

  async deleteSavedSearch(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from("saved_searches")
      .delete()
      .eq("id", id);

    return !error;
  }

  async getAllVehiclesAdmin(): Promise<Vehicle[]> {
    console.log(
      "🔄 Récupération de TOUTES les annonces (admin) avec users depuis Supabase...",
    );

    try {
      // Requête directe avec JOIN pour récupérer toutes les annonces (y compris inactives)
      let { data, error } = await supabaseServer
        .from("annonces")
        .select(
          `
          *,
          users (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur Supabase:", error.message);
        console.log("❌ Rechute vers requête directe...");

        // Fallback: récupérer séparément les véhicules et utilisateurs
        const { data: vehiclesData, error: vehiclesError } =
          await supabaseServer
            .from("annonces")
            .select("*")
            .order("created_at", { ascending: false });

        if (vehiclesError) {
          throw new Error(`Error fetching vehicles: ${vehiclesError.message}`);
        }

        const { data: usersData, error: usersError } = await supabaseServer
          .from("users")
          .select("*");

        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`);
        }

        // Associer manuellement les données
        data = vehiclesData.map((vehicle: any) => {
          const user = usersData.find((u: any) => u.id === vehicle.user_id);
          return { ...vehicle, users: user };
        });
      }

      console.log(
        "✅ TOUTES les annonces avec users récupérées depuis Supabase:",
        data?.length || 0,
      );

      if (data && data.length > 0) {
        // Transformer les données de la table annonces vers le format Vehicle avec user inclus
        const transformedData = data.map((vehicle: any) => ({
          id: vehicle.id.toString(),
          userId: vehicle.user_id,
          user: vehicle.users
            ? {
                id: vehicle.users.id,
                email: vehicle.users.email,
                name: vehicle.users.name,
                phone: vehicle.users.phone,
                whatsapp: vehicle.users.whatsapp,
                type: vehicle.users.type,
                companyName: vehicle.users.company_name,
                //companyLogo: vehicle.users.company_logo,
                address: vehicle.users.address,
                city: vehicle.users.city,
                postalCode: vehicle.users.postal_code,
                website: vehicle.users.website,
                siret: vehicle.users.siret,
                bio: vehicle.users.bio,
                avatar: vehicle.users.avatar,
                specialties: safeJsonParse(vehicle.users.specialties),
                verified: vehicle.users.verified,
                emailVerified: vehicle.users.email_verified,
                contactPreferences: safeJsonParse(
                  vehicle.users.contact_preferences,
                ),
                createdAt: new Date(vehicle.users.created_at),
                lastLoginAt: vehicle.users.last_login_at
                  ? new Date(vehicle.users.last_login_at)
                  : undefined,
              }
            : undefined,
          title: vehicle.title,
          description: vehicle.description,
          category: vehicle.category,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
          fuelType: vehicle.fuel_type,
          condition: vehicle.condition,
          price: vehicle.price,
          location: vehicle.location,
          images: vehicle.images || [],
          features: vehicle.features || [],
          listingType: vehicle.listing_type || "sale",
          contactPhone: vehicle.contact_phone || null,
          contactEmail: vehicle.contact_email || null,
          contactWhatsapp: vehicle.contact_whatsapp || null,
          hidePhone: vehicle.hide_phone || false,
          isPremium: vehicle.is_premium,
          premiumType: vehicle.premium_type,
          premiumExpiresAt: vehicle.premium_expires_at
            ? new Date(vehicle.premium_expires_at)
            : undefined,
          createdAt: new Date(vehicle.created_at),
          updatedAt: new Date(vehicle.updated_at),
          views: vehicle.views,
          favorites: vehicle.favorites,
          status: vehicle.status,
          isActive: vehicle.is_active !== false,
          deletedAt: vehicle.deleted_at ? new Date(vehicle.deleted_at) : null,
          deletionReason: vehicle.deletion_reason,
          deletionComment: vehicle.deletion_comment,
          damageDetails: validateDamageDetails(vehicle.damage_details),
          priorityScore: vehicle.priority_score ?? 0,
          professionalAccountId: vehicle.professional_account_id ?? null,
        }));

        return transformedData as Vehicle[];
      }
    } catch (error) {
      console.error("❌ Erreur dans getAllVehiclesAdmin:", error);
      return [];
    }

    return [];
  }

  async updateVehicleActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<boolean> {
    try {
      const { error } = await supabaseServer
        .from("annonces")
        .update({ is_active: isActive })
        .eq("id", parseInt(id));

      if (error) {
        console.error("❌ Erreur changement statut actif:", error);
        // Si la colonne n'existe pas encore, le signaler
        if (
          error.message.includes("column") &&
          error.message.includes("is_active")
        ) {
          console.log(
            "⚠️  La colonne is_active doit être ajoutée à la table annonces dans Supabase",
          );
          console.log(
            "⚠️  Commande SQL: ALTER TABLE annonces ADD COLUMN is_active BOOLEAN DEFAULT true;",
          );
        }
        return false;
      }

      console.log(
        `✅ Statut annonce ${id} changé: ${isActive ? "active" : "désactivée"}`,
      );
      return true;
    } catch (error) {
      console.error("❌ Erreur inattendue changement statut:", error);
      return false;
    }
  }
  //
  async checkListingQuota(userId: string): Promise<{
    canCreate: boolean;
    activeListings: number;
    maxListings: number | null;
    message?: string;
  }> {
    try {
      console.log(`🔍 Vérification quota pour l'utilisateur: ${userId}`);

      // 🚀 OPTIMISATION: Récupérer type utilisateur ET compter les annonces en parallèle
      const [userResult, activeListingsCount, subscriptionResult] =
        await Promise.all([
          // 1. Type utilisateur
          supabaseServer.from("users").select("type").eq("id", userId).single(),

          // 2. Compter les annonces actives en parallèle (optimisé)
          // ✅ CORRECTION: Inclure aussi les "draft" dans le quota pour éviter contournement
          supabaseServer
            .from("annonces")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_active", true)
            .is("deleted_at", null)
            .in("status", ["approved", "pending", "draft"]),

          // 3. Abonnement actif avec plan
          supabaseServer
            .from("subscriptions")
            .select(
              `
            id,
            plan_id,
            status,
            subscription_plans (
              max_listings,
              name
            )
          `,
            )
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      // Traiter les résultats
      const { data: user, error: userError } = userResult;
      const { data: annoncesData, error: annoncesError } = activeListingsCount;
      const { data: subscription, error: subError } = subscriptionResult;

      if (userError) {
        console.error("❌ Erreur récupération type utilisateur:", userError);
        return {
          canCreate: false,
          activeListings: 0,
          maxListings: 0,
          message: "Erreur vérification compte utilisateur.",
        };
      }

      const activeListings = annoncesError ? 0 : activeListingsCount.count || 0;
      const userType = user?.type;
      console.log(
        `👤 Type utilisateur: ${userType}, Annonces actives: ${activeListings}`,
      );

      if (subError) {
        console.error("❌ Erreur récupération abonnement:", subError);
        // En cas d'erreur, retourner quota gratuit par sécurité
        return {
          canCreate: activeListings < 5,
          activeListings,
          maxListings: 5,
          message: "Erreur vérification abonnement. Quota gratuit appliqué.",
        };
      }

      if (!subscription) {
        // 👉 Pas d'abonnement actif

        // 🚨 RÈGLE BUSINESS : Les pros DOIVENT avoir un abonnement
        if (userType === "professional") {
          return {
            canCreate: false,
            activeListings,
            maxListings: 0,
            message:
              "Abonnement requis pour les comptes professionnels. Veuillez souscrire à un plan pour publier des annonces.",
          };
        }

        // ✅ Particuliers : quota gratuit (5 annonces)
        const maxListings = 5;
        return {
          canCreate: activeListings < maxListings,
          activeListings,
          maxListings,
          message:
            activeListings >= maxListings
              ? "Limite atteinte (5 annonces). Passez à un plan supérieur pour publier plus d'annonces."
              : undefined,
        };
      }

      // 3. Cas Professionnel avec abonnement actif → lire quota dans subscription_plans
      const maxListings = (subscription as any).subscription_plans
        ?.max_listings;
      // ⚡ OPTIMISATION: activeListings déjà calculé en parallèle ci-dessus

      console.log(
        `📊 Quota: ${activeListings}/${maxListings || "illimité"} annonces actives`,
      );

      if (maxListings === null || maxListings === undefined) {
        // Abonnement illimité
        return { canCreate: true, activeListings, maxListings: null };
      }

      const canCreate = activeListings < maxListings;

      return {
        canCreate,
        activeListings,
        maxListings,
        message: !canCreate
          ? `Limite atteinte (${activeListings}/${maxListings}). Passez à un plan supérieur pour publier plus d'annonces.`
          : undefined,
      };
    } catch (error) {
      console.error("❌ Erreur vérification quota:", error);
      // En cas d'erreur → fail-safe (autoriser la création)
      return {
        canCreate: true,
        activeListings: 0,
        maxListings: null,
        message: "Erreur lors de la vérification du quota",
      };
    }
  }

  private async countActiveListingsByUser(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseServer
        .from("annonces")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .in("status", ["approved", "draft", "pending"]); // ⬅️ clé: exclut "rejected" et "draft"

      if (error) {
        console.error("❌ Erreur comptage annonces actives:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error("❌ Erreur comptage annonces actives:", error);
      return 0;
    }
  }

  // Boost Plans
  async getAllBoostPlans(): Promise<BoostPlan[]> {
    const { data, error } = await supabaseServer
      .from("boost_plans")
      .select("*")
      .order("duration_days", { ascending: true });

    if (error) {
      console.error("Error fetching boost plans:", error);
      return [];
    }

    // Transformer les noms de colonnes snake_case en camelCase pour le frontend
    return (
      data?.map((plan) => ({
        id: plan.id,
        name: plan.name,
        durationDays: plan.duration_days,
        priceCents: plan.price_cents,
        currency: plan.currency,
        stripePriceId: plan.stripe_price_id,
        createdAt: plan.created_at,
      })) || []
    );
  }

  async getBoostPlan(id: number): Promise<BoostPlan | undefined> {
    const { data, error } = await supabaseServer
      .from("boost_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching boost plan:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Transformer les noms de colonnes snake_case en camelCase pour le frontend
    return {
      id: data.id,
      name: data.name,
      durationDays: data.duration_days,
      priceCents: data.price_cents,
      currency: data.currency,
      stripePriceId: data.stripe_price_id,
      createdAt: data.created_at,
    };
  }

  async getBoostPlanByStripePrice(
    stripePriceId: string,
  ): Promise<BoostPlan | undefined> {
    const { data, error } = await supabaseServer
      .from("boost_plans")
      .select("*")
      .eq("stripe_price_id", stripePriceId)
      .single();

    if (error) {
      console.error("Error fetching boost plan by stripe price:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Transformer les noms de colonnes snake_case en camelCase pour le frontend
    return {
      id: data.id,
      name: data.name,
      durationDays: data.duration_days,
      priceCents: data.price_cents,
      currency: data.currency,
      stripePriceId: data.stripe_price_id,
      createdAt: data.created_at,
    };
  }

  // Annonce Boosts
  async createAnnonceBoost(boost: InsertAnnonceBoost): Promise<AnnonceBoost> {
    const { data, error } = await supabaseServer
      .from("annonce_boosts")
      .insert(boost)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating annonce boost: ${error.message}`);
    }
    return data as AnnonceBoost;
  }

  async getActiveBoostForAnnonce(
    annonceId: number,
  ): Promise<AnnonceBoost | undefined> {
    const { data, error } = await supabaseServer
      .from("annonce_boosts")
      .select("*")
      .eq("annonce_id", annonceId)
      .eq("is_active", true)
      .gt("end_at", new Date().toISOString())
      .single();

    if (error) {
      // Pas d'erreur si aucun boost actif trouvé
      return undefined;
    }
    return data as AnnonceBoost;
  }

  async updateBoostSession(
    boostId: number,
    stripeSessionId: string,
  ): Promise<boolean> {
    const { error } = await supabaseServer
      .from("annonce_boosts")
      .update({ stripe_session_id: stripeSessionId })
      .eq("id", boostId);

    if (error) {
      console.error("Error updating boost session:", error);
      return false;
    }
    return true;
  }

  // Nouveau système avec boost_logs et boosted_until
  async createBoostLog(log: {
    annonceId: number;
    planId: number;
    stripeSessionId: string;
    action: string;
    amount: number;
    userId: string;
  }): Promise<void> {
    const { error } = await supabaseServer.from("boost_logs").insert({
      annonce_id: log.annonceId,
      plan_id: log.planId,
      stripe_session_id: log.stripeSessionId,
      action: log.action,
      amount: log.amount,
      user_id: log.userId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating boost log:", error);
      throw new Error("Failed to create boost log");
    }
  }

  async checkBoostAlreadyActive(annonceId: number): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from("annonces")
      .select("boosted_until")
      .eq("id", annonceId)
      .single();

    if (error || !data) return false;

    // Vérifier si boost actif (boosted_until > maintenant)
    return data.boosted_until && new Date(data.boosted_until) > new Date();
  }

  async activateBoostWithLog(stripeSessionId: string): Promise<boolean> {
    try {
      // Récupérer les informations du log d'achat
      const { data: logData, error: logError } = await supabaseServer
        .from("boost_logs")
        .select("annonce_id, plan_id, user_id")
        .eq("stripe_session_id", stripeSessionId)
        .eq("action", "purchased")
        .single();

      if (logError || !logData) {
        console.error("Error finding boost log:", logError);
        return false;
      }

      // Récupérer le plan pour connaître la durée
      const plan = await this.getBoostPlan(logData.plan_id);
      if (!plan) {
        console.error("Plan not found:", logData.plan_id);
        return false;
      }

      // Calculer la nouvelle date de fin (logique d'empilement)
      const { data: currentAnnonce, error: annonceError } = await supabaseServer
        .from("annonces")
        .select("boosted_until")
        .eq("id", logData.annonce_id)
        .single();

      if (annonceError) {
        console.error("Error fetching annonce:", annonceError);
        return false;
      }

      const now = new Date();
      const currentBoostEnd = currentAnnonce?.boosted_until
        ? new Date(currentAnnonce.boosted_until)
        : null;

      // Logique d'empilement : si boost actif, prolonger, sinon commencer maintenant
      const startFrom =
        currentBoostEnd && currentBoostEnd > now ? currentBoostEnd : now;
      const newBoostEnd = new Date(
        startFrom.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
      );

      // Mettre à jour l'annonce avec la nouvelle date de fin
      const { error: updateError } = await supabaseServer
        .from("annonces")
        .update({ boosted_until: newBoostEnd.toISOString() })
        .eq("id", logData.annonce_id);

      if (updateError) {
        console.error("Error updating boosted_until:", updateError);
        return false;
      }

      // Créer un log d'activation
      await this.createBoostLog({
        annonceId: logData.annonce_id,
        planId: logData.plan_id,
        stripeSessionId: stripeSessionId,
        action: "activated",
        amount: plan.priceCents,
        userId: logData.user_id,
      });

      console.log(
        `✅ Boost activé jusqu'au ${newBoostEnd.toISOString()} pour l'annonce ${logData.annonce_id}`,
      );
      return true;
    } catch (error) {
      console.error("Error in activateBoostWithLog:", error);
      return false;
    }
  }

  // Ancienne fonction (gardée pour compatibilité temporaire)
  async activateBoost(stripeSessionId: string): Promise<boolean> {
    // Rediriger vers la nouvelle fonction
    return this.activateBoostWithLog(stripeSessionId);
  }

  // Récupérer l'historique des achats d'un utilisateur (boost + abonnements)
  async getUserPurchaseHistory(userId: string) {
    try {
      // Récupérer les achats de boost (sans relations pour éviter les erreurs)
      const { data: boostPurchases, error: boostError } = await supabaseServer
        .from("boost_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("action", "purchased")
        .order("created_at", { ascending: false });

      if (boostError) {
        console.error("Error fetching boost purchases:", boostError);
        return { data: null, error: boostError };
      }

      // Récupérer séparément les données des plans et annonces pour éviter les problèmes de relations
      let boostHistory: any[] = [];
      if (boostPurchases && boostPurchases.length > 0) {
        const planIds = [...new Set(boostPurchases.map((p) => p.plan_id))];
        const annonceIds = [
          ...new Set(boostPurchases.map((p) => p.annonce_id)),
        ];

        const { data: plansData } = await supabaseServer
          .from("boost_plans")
          .select("id, name, duration_days")
          .in("id", planIds);

        const { data: annoncesData } = await supabaseServer
          .from("annonces")
          .select("id, title")
          .in("id", annonceIds);

        boostHistory = boostPurchases.map((purchase) => {
          const plan = plansData?.find((p) => p.id === purchase.plan_id);
          const annonce = annoncesData?.find(
            (a) => a.id === purchase.annonce_id,
          );

          return {
            id: purchase.id,
            type: "boost",
            title: `Boost - ${plan?.name || "Plan inconnu"}`,
            description: `Annonce: ${annonce?.title || "Titre inconnu"}`,
            amount: purchase.amount / 100,
            status: "completed",
            date: purchase.created_at,
            stripeId: purchase.stripe_session_id,
            duration: plan?.duration_days,
          };
        });
      }

      // 🔧 CORRECTION CRITIQUE: Récupérer TOUS les abonnements (particuliers ET professionnels)
      let subscriptionPurchases: any[] = [];

      // 1. Abonnements directs par user_id (pour les particuliers individual)
      const { data: directSubscriptions } = await supabaseServer
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // 2. Abonnements via professional_accounts (pour les professionnels)
      const { data: userProfessionalAccount } = await supabaseServer
        .from("professional_accounts")
        .select("id")
        .eq("user_id", userId)
        .single();

      let proSubscriptions: any[] = [];
      if (userProfessionalAccount) {
        const { data: subscriptions } = await supabaseServer
          .from("subscriptions")
          .select("*")
          .eq("professional_account_id", userProfessionalAccount.id)
          .order("created_at", { ascending: false });

        proSubscriptions = subscriptions || [];
      }

      // Combiner tous les abonnements et dédupliquer par ID
      const allSubscriptions = [
        ...(directSubscriptions || []),
        ...proSubscriptions,
      ];
      const uniqueSubscriptionIds = new Set();
      subscriptionPurchases = allSubscriptions.filter((sub) => {
        if (uniqueSubscriptionIds.has(sub.id)) {
          return false;
        }
        uniqueSubscriptionIds.add(sub.id);
        return true;
      });

      // Récupérer les détails des plans d'abonnement
      let subscriptionHistory: any[] = [];
      if (subscriptionPurchases.length > 0) {
        const planIds = [
          ...new Set(subscriptionPurchases.map((s) => s.plan_id)),
        ];
        const { data: subscriptionPlans } = await supabaseServer
          .from("subscription_plans")
          .select("id, name, price_monthly, price_yearly")
          .in("id", planIds);

        subscriptionHistory = subscriptionPurchases.map((sub) => {
          const plan = subscriptionPlans?.find((p) => p.id === sub.plan_id);
          return {
            id: sub.id,
            type: "subscription",
            title: `Abonnement - ${plan?.name || "Plan inconnu"}`,
            description: "Abonnement professionnel",
            amount: plan?.price_monthly || 0,
            status: sub.status,
            date: sub.created_at,
            stripeId: sub.stripe_subscription_id,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: sub.current_period_end,
          };
        });
      }

      // Combiner et trier par date
      const allPurchases = [...boostHistory, ...subscriptionHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return { data: allPurchases, error: null };
    } catch (error) {
      console.error("Error in getUserPurchaseHistory:", error);
      return { data: null, error: error };
    }
  }

  // Récupérer l'historique global des achats pour l'admin
  async getAllPurchaseHistory() {
    try {
      // Récupérer tous les achats de boost (sans relations pour éviter les erreurs)
      const { data: boostPurchases, error: boostError } = await supabaseServer
        .from("boost_logs")
        .select("*")
        .eq("action", "purchased")
        .order("created_at", { ascending: false });

      if (boostError) {
        console.error("Error fetching all boost purchases:", boostError);
        return { data: null, error: boostError };
      }

      // Récupérer tous les abonnements pro avec les utilisateurs
      const { data: allSubscriptions } = await supabaseServer
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      // Récupérer les comptes professionnels et utilisateurs associés
      let subscriptionPurchases: any[] = [];
      if (allSubscriptions && allSubscriptions.length > 0) {
        const professionalAccountIds = [
          ...new Set(allSubscriptions.map((s) => s.professional_account_id)),
        ];
        const { data: professionalAccounts } = await supabaseServer
          .from("professional_accounts")
          .select("id, user_id")
          .in("id", professionalAccountIds);

        const userIds = [
          ...new Set(professionalAccounts?.map((pa) => pa.user_id) || []),
        ];
        const { data: users } = await supabaseServer
          .from("users")
          .select("id, name, email")
          .in("id", userIds);

        subscriptionPurchases = allSubscriptions.map((sub) => {
          const professionalAccount = professionalAccounts?.find(
            (pa) => pa.id === sub.professional_account_id,
          );
          // 🔧 CORRECTION: Utiliser le user_id existant dans la subscription au lieu de l'écraser
          const user = users?.find(
            (u) => u.id === (sub.user_id || professionalAccount?.user_id),
          );
          return {
            ...sub,
            // Garder le user_id original de la subscription, ne pas l'écraser
            user: user,
          };
        });
      }

      // Récupérer séparément les données des plans, annonces et utilisateurs
      let boostHistory: any[] = [];
      if (boostPurchases && boostPurchases.length > 0) {
        const planIds = [...new Set(boostPurchases.map((p) => p.plan_id))];
        const annonceIds = [
          ...new Set(boostPurchases.map((p) => p.annonce_id)),
        ];
        const userIds = [...new Set(boostPurchases.map((p) => p.user_id))];

        const { data: plansData } = await supabaseServer
          .from("boost_plans")
          .select("id, name, duration_days")
          .in("id", planIds);

        const { data: annoncesData } = await supabaseServer
          .from("annonces")
          .select("id, title")
          .in("id", annonceIds);

        const { data: usersData } = await supabaseServer
          .from("users")
          .select("id, name, email")
          .in("id", userIds);

        boostHistory = boostPurchases.map((purchase) => {
          const plan = plansData?.find((p) => p.id === purchase.plan_id);
          const annonce = annoncesData?.find(
            (a) => a.id === purchase.annonce_id,
          );
          const user = usersData?.find((u) => u.id === purchase.user_id);

          return {
            id: purchase.id,
            type: "boost",
            title: `Boost - ${plan?.name || "Plan inconnu"}`,
            description: `Annonce: ${annonce?.title || "Titre inconnu"}`,
            amount: purchase.amount / 100,
            status: "completed",
            date: purchase.created_at,
            stripeId: purchase.stripe_session_id,
            duration: plan?.duration_days,
            userName: user?.name || "Utilisateur inconnu",
            userEmail: user?.email || "Email inconnu",
          };
        });
      }

      // Formatter l'historique des abonnements
      let subscriptionHistory: any[] = [];
      if (subscriptionPurchases.length > 0) {
        const planIds = [
          ...new Set(subscriptionPurchases.map((s) => s.plan_id)),
        ];
        const { data: subscriptionPlans } = await supabaseServer
          .from("subscription_plans")
          .select("id, name, price_monthly, price_yearly")
          .in("id", planIds);

        subscriptionHistory = subscriptionPurchases.map((sub) => {
          const plan = subscriptionPlans?.find((p) => p.id === sub.plan_id);
          return {
            id: sub.id,
            type: "subscription",
            title: `Abonnement - ${plan?.name || "Plan inconnu"}`,
            description: "Abonnement professionnel",
            amount: plan?.price_monthly || 0,
            status: sub.status,
            date: sub.created_at,
            stripeId: sub.stripe_subscription_id,
            userName: sub.user?.name || "Utilisateur inconnu",
            userEmail: sub.user?.email || "Email inconnu",
          };
        });
      }

      // Combiner et trier par date
      const allPurchases = [...boostHistory, ...subscriptionHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return { data: allPurchases, error: null };
    } catch (error) {
      console.error("Error in getAllPurchaseHistory:", error);
      return { data: null, error: error };
    }
  }

  // Améliorer la vérification du statut boost
  async getBoostStatus(annonceId: number) {
    try {
      const { data: annonce, error } = await supabaseServer
        .from("annonces")
        .select("boosted_until")
        .eq("id", annonceId)
        .single();

      if (error || !annonce) {
        return { isActive: false, boostedUntil: null };
      }

      const now = new Date();
      const boostedUntil = annonce.boosted_until
        ? new Date(annonce.boosted_until)
        : null;
      const isActive = boostedUntil ? boostedUntil > now : false;

      return {
        isActive,
        boostedUntil: boostedUntil ? boostedUntil.toISOString() : null,
      };
    } catch (error) {
      console.error("Error checking boost status:", error);
      return { isActive: false, boostedUntil: null };
    }
  }

  // Récupérer les annonces en attente de modération
  async getPendingVehicles(): Promise<Vehicle[]> {
    console.log(
      "🔄 Récupération des annonces EN ATTENTE DE MODÉRATION depuis Supabase...",
    );

    try {
      let { data, error } = await supabaseServer
        .from("annonces")
        .select(
          `
          *,
          users (*)
        `,
        )
        .in("status", ["draft", "pending"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur Supabase getPendingVehicles:", error.message);
        throw new Error(`Error fetching pending vehicles: ${error.message}`);
      }

      if (!data) {
        console.log("✅ Aucune annonce en attente trouvée");
        return [];
      }

      console.log(`✅ ${data.length} annonce(s) en attente récupérée(s)`);

      // Transformer les données comme dans les autres méthodes
      const transformedData = data.map((item: any) => ({
        ...item,
        user: item.users
          ? {
              ...item.users,
              createdAt: item.users.created_at
                ? new Date(item.users.created_at)
                : new Date(),
              lastLoginAt: item.users.last_login_at
                ? new Date(item.users.last_login_at)
                : undefined,
            }
          : undefined,
        createdAt: new Date(item.created_at || new Date()),
        images: safeJsonParse(item.images),
        equipment: safeJsonParse(item.equipment),
        isActive: item.is_active !== false,
      }));

      return transformedData as any; // Utiliser any temporairement pour éviter les erreurs de types
    } catch (error) {
      console.error("❌ Erreur dans getPendingVehicles:", error);
      throw error;
    }
  }

  // Approuver une annonce
  async approveVehicle(id: string): Promise<boolean> {
    console.log(`🔄 Approbation de l'annonce ${id}...`);

    try {
      const { error } = await supabaseServer
        .from("annonces")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("❌ Erreur lors de l'approbation:", error.message);
        throw new Error(`Error approving vehicle: ${error.message}`);
      }

      console.log(`✅ Annonce ${id} approuvée avec succès`);
      return true;
    } catch (error) {
      console.error("❌ Erreur dans approveVehicle:", error);
      throw error;
    }
  }

  // Rejeter une annonce
  async rejectVehicle(id: string, reason?: string): Promise<boolean> {
    console.log(`🔄 Rejet de l'annonce ${id}...`);

    try {
      const { error } = await supabaseServer
        .from("annonces")
        .update({
          status: "rejected",
          rejection_reason: reason || "Rejetée par l'administrateur",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("❌ Erreur lors du rejet:", error.message);
        throw new Error(`Error rejecting vehicle: ${error.message}`);
      }

      console.log(`✅ Annonce ${id} rejetée avec succès`);
      return true;
    } catch (error) {
      console.error("❌ Erreur dans rejectVehicle:", error);
      throw error;
    }
  }
}

export const storage = new SupabaseStorage();
