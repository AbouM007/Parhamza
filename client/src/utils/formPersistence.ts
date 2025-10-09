// Utilitaire pour gérer la persistance du formulaire de création d'annonce
// Utilise localStorage pour les données texte et IndexedDB pour les photos

const FORM_STORAGE_KEY = "passionauto_listing_draft";
const DB_NAME = "PassionAutoFormDrafts";
const DB_VERSION = 1;
const STORE_NAME = "photos";

// Structure pour préserver l'ordre des photos
interface PhotoEntry {
  index: number; // Position originale dans le tableau
  type: "url" | "file";
  value: string; // URL ou clé IndexedDB
}

export interface PersistedFormData {
  listingType: string;
  category: string;
  subcategory: string;
  condition?: string;
  title: string;
  registrationNumber?: string;
  specificDetails: Record<string, any>;
  description: string;
  photos: PhotoEntry[]; // Ordre préservé avec type et référence
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
 * Ouvrir/créer la base IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Sauvegarder un fichier dans IndexedDB
 */
const saveFileToIndexedDB = async (db: IDBDatabase, key: string, file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Récupérer un fichier depuis IndexedDB
 */
const getFileFromIndexedDB = async (db: IDBDatabase, key: string): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Supprimer tous les fichiers d'IndexedDB
 */
const clearIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    db.close();
  } catch (error) {
    console.warn("⚠️ Erreur lors du nettoyage d'IndexedDB:", error);
  }
};

/**
 * Sauvegarder le brouillon du formulaire
 * - Données texte → localStorage
 * - Photos (Files) → IndexedDB
 * IMPORTANT: Écrit dans IndexedDB d'abord pour garantir l'atomicité
 */
export const saveFormDraft = async (formData: any, currentStep: number): Promise<boolean> => {
  try {
    const photoEntries: PhotoEntry[] = [];
    const filesToSave: Array<{ key: string; file: File }> = [];

    // Construire la structure ordonnée des photos
    if (formData.photos && Array.isArray(formData.photos)) {
      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];
        
        if (typeof photo === "string") {
          // URL déjà uploadée
          photoEntries.push({
            index: i,
            type: "url",
            value: photo,
          });
        } else if (photo instanceof File) {
          // Fichier local - générer une clé unique avec crypto.randomUUID()
          const key = `photo_${crypto.randomUUID()}`;
          photoEntries.push({
            index: i,
            type: "file",
            value: key,
          });
          filesToSave.push({ key, file: photo });
        }
      }
    }

    // Étape 1: Sauvegarder les fichiers dans IndexedDB d'abord
    if (filesToSave.length > 0) {
      const db = await openDB();
      try {
        for (const { key, file } of filesToSave) {
          await saveFileToIndexedDB(db, key, file);
        }
        db.close();
      } catch (error) {
        db.close();
        throw new Error(`Échec de sauvegarde dans IndexedDB: ${error}`);
      }
    }

    // Étape 2: Sauvegarder les métadonnées dans localStorage seulement si IndexedDB a réussi
    const persistedData: PersistedFormData = {
      listingType: formData.listingType || "",
      category: formData.category || "",
      subcategory: formData.subcategory || "",
      condition: formData.condition,
      title: formData.title || "",
      registrationNumber: formData.registrationNumber,
      specificDetails: formData.specificDetails || {},
      description: formData.description || "",
      photos: photoEntries,
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

    const urlCount = photoEntries.filter(p => p.type === "url").length;
    const fileCount = photoEntries.filter(p => p.type === "file").length;
    console.log(`💾 Brouillon sauvegardé: ${urlCount} URLs + ${fileCount} fichiers locaux (ordre préservé)`);
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde brouillon:", error);
    
    // Avertir l'utilisateur si on manque d'espace
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("⚠️ Quota de stockage dépassé. Les photos ne peuvent pas être sauvegardées.");
    }
    
    return false;
  }
};

/**
 * Récupérer le brouillon sauvegardé
 */
export const loadFormDraft = async (): Promise<{ 
  data: PersistedFormData; 
  photos: Array<string | File>;
  missingPhotosCount: number;
} | null> => {
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
      await clearFormDraft();
      return null;
    }

    // Reconstituer les photos dans l'ordre original
    const photos: Array<string | File> = [];
    let missingPhotosCount = 0;
    const db = await openDB();

    try {
      // Trier par index pour garantir l'ordre
      const sortedEntries = [...parsed.photos].sort((a, b) => a.index - b.index);

      for (const entry of sortedEntries) {
        if (entry.type === "url") {
          photos.push(entry.value);
        } else if (entry.type === "file") {
          const file = await getFileFromIndexedDB(db, entry.value);
          if (file) {
            photos.push(file);
          } else {
            console.warn(`⚠️ Fichier manquant dans IndexedDB: ${entry.value}`);
            missingPhotosCount++;
          }
        }
      }

      db.close();
    } catch (error) {
      db.close();
      console.warn("⚠️ Erreur lors de la récupération des fichiers:", error);
    }

    const urlCount = parsed.photos.filter(p => p.type === "url").length;
    const fileCount = parsed.photos.filter(p => p.type === "file").length;
    console.log(`📦 Brouillon chargé: ${urlCount} URLs + ${fileCount - missingPhotosCount}/${fileCount} fichiers locaux (ordre préservé)`);

    return { data: parsed, photos, missingPhotosCount };
  } catch (error) {
    console.error("❌ Erreur chargement brouillon:", error);
    return null;
  }
};

/**
 * Supprimer le brouillon sauvegardé
 */
export const clearFormDraft = async (): Promise<void> => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
    await clearIndexedDB();
  } catch (error) {
    console.error("❌ Erreur suppression brouillon:", error);
  }
};

/**
 * Vérifier si un brouillon existe
 */
export const hasDraft = (): boolean => {
  try {
    const stored = localStorage.getItem(FORM_STORAGE_KEY);
    return stored !== null;
  } catch {
    return false;
  }
};
