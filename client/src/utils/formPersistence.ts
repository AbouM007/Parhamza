// Utilitaire pour gérer la persistance du formulaire de création d'annonce dans localStorage

const FORM_STORAGE_KEY = "passionauto_listing_draft";

export interface PersistedFormData {
  listingType: string;
  category: string;
  subcategory: string;
  condition?: string;
  title: string;
  registrationNumber?: string;
  specificDetails: Record<string, any>;
  description: string;
  photoUrls: string[]; // URLs Supabase des images déjà uploadées
  photoBase64?: string[]; // Base64 des images locales (pour backup temporaire)
  price: number;
  location: {
    city: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    hidePhone: boolean;
    sameAsPhone: boolean;
    showPhone: boolean;
    showWhatsapp: boolean;
    showInternal: boolean;
  };
  premiumPack: string;
  savedAt: string; // timestamp ISO
  currentStep: number;
}

/**
 * Sauvegarder le brouillon du formulaire dans localStorage
 * Note: les File objects ne peuvent pas être sérialisés, donc on ne sauvegarde que les URLs
 */
export const saveFormDraft = (formData: any, currentStep: number): boolean => {
  try {
    // Filtrer les photos pour ne garder que les URLs (string)
    const photoUrls = formData.photos?.filter((photo: any) => typeof photo === "string") || [];
    
    const persistedData: PersistedFormData = {
      listingType: formData.listingType || "",
      category: formData.category || "",
      subcategory: formData.subcategory || "",
      condition: formData.condition,
      title: formData.title || "",
      registrationNumber: formData.registrationNumber,
      specificDetails: formData.specificDetails || {},
      description: formData.description || "",
      photoUrls,
      price: formData.price || 0,
      location: formData.location || { city: "", postalCode: "" },
      contact: formData.contact || {
        phone: "",
        email: "",
        whatsapp: "",
        hidePhone: false,
        sameAsPhone: false,
        showPhone: true,
        showWhatsapp: true,
        showInternal: true,
      },
      premiumPack: formData.premiumPack || "free",
      savedAt: new Date().toISOString(),
      currentStep,
    };

    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(persistedData));
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde brouillon:", error);
    return false;
  }
};

/**
 * Récupérer le brouillon sauvegardé
 */
export const loadFormDraft = (): PersistedFormData | null => {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as PersistedFormData;
    
    // Vérifier que le brouillon n'est pas trop ancien (7 jours max)
    const savedDate = new Date(parsed.savedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      // Brouillon trop ancien, le supprimer
      clearFormDraft();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("❌ Erreur chargement brouillon:", error);
    return null;
  }
};

/**
 * Supprimer le brouillon sauvegardé
 */
export const clearFormDraft = (): void => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    console.error("❌ Erreur suppression brouillon:", error);
  }
};

/**
 * Vérifier si un brouillon existe
 */
export const hasDraft = (): boolean => {
  try {
    const draft = loadFormDraft();
    return draft !== null;
  } catch {
    return false;
  }
};
