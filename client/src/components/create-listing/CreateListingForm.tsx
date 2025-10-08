import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Search,
  X,
  EyeOff,
} from "lucide-react";
import { PublishSuccessModal } from "../PublishSuccessModal";
import { BoostModal } from "../BoostModal";
import { AddressInput } from "../AddressInput";
import { CategoryStep } from "./CategoryStep";
import { ListingTypeStep, ListingTypeValue } from "./ListingTypeStep";
import { VehicleDetailsStep } from "./VehicleDetailsStep";
import { PlateBlurModal } from "../PlateBlurModal";
import { VehicleDataPreviewModal } from "./VehicleDataPreviewModal";
import { PlateInputStep } from "./PlateInputStep";
import { DataValidationStep } from "./DataValidationStep";
import { useAuth } from "@/contexts/AuthContext";
import { useQuota } from "@/hooks/useQuota";
import { useListingNavigation } from "@/hooks/useListingNavigation";
import { useRegistrationNumber } from "@/hooks/useRegistrationNumber";
import { compressImage } from "@/utils/imageCompression";
import { useToast } from '@/hooks/use-toast';
import {
  getBrandsBySubcategory,
  fuelTypes,
  carModelsByBrand,
  brandsByVehicleType,
} from "@/utils/mockData";
import { CATEGORIES } from "@/data/categories";
import { COUNTRY_CODES } from "@/data/contact";
import {
  COLORS,
  DOORS,
  EMISSION_CLASSES,
  LICENSE_TYPES,
  PART_CATEGORIES,
  PART_CONDITIONS,
  SERVICE_TYPES,
  TRANSMISSION_TYPES,
  UPHOLSTERY_TYPES,
  VEHICLE_CONDITIONS,
  VEHICLE_EQUIPMENT,
  VEHICLE_TYPES,
} from "@/data/vehicle";

interface FormData {
  // Étape 1: Type d'annonce
  listingType: ListingTypeValue | "";

  // Étape 2: Famille principale
  category: string;

  // Étape 3: État du bien (seulement pour biens matériels - non services/pièces)
  condition?:
    | "neuf"
    | "occasion"
    | "damaged"
    | "tres_bon_etat"
    | "bon_etat"
    | "etat_moyen"
    | "pour_pieces";

  // Étape 4: Sous-famille
  subcategory: string;

  // Étape 5+: Suite habituelle
  title: string;
  registrationNumber?: string;
  specificDetails: Record<string, any>;
  description: string;
  photos: (File | string)[];
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
}

interface CreateListingFormProps {
  onSuccess?: () => void;
}

export const CreateListingForm: React.FC<CreateListingFormProps> = ({
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const { data: quotaInfo } = useQuota(profile?.id);
  const { toast } = useToast();
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdVehicle, setCreatedVehicle] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [blurredImages, setBlurredImages] = useState<Set<number>>(new Set());
  const [plateBlurModal, setPlateBlurModal] = useState<{
    isOpen: boolean;
    photoIndex: number;
    imageUrl: string;
  }>({
    isOpen: false,
    photoIndex: -1,
    imageUrl: "",
  });

  // État pour la recherche de compatibilités (pièces détachées)
  const [compatibilitySearch, setCompatibilitySearch] = useState("");
  const [showCompatibilitySuggestions, setShowCompatibilitySuggestions] = useState(false);

  // État pour tracker les champs auto-remplis depuis API
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  
  // États pour le modal de prévisualisation des données véhicule
  const [showVehiclePreview, setShowVehiclePreview] = useState(false);
  const [pendingVehicleData, setPendingVehicleData] = useState<any>(null);
  const [pendingRegistrationNumber, setPendingRegistrationNumber] = useState("");

  // Nouveaux états pour le flux de saisie de plaque
  const [useManualMode, setUseManualMode] = useState(false);
  const [apiVehicleData, setApiVehicleData] = useState<any>(null);
  const [isLoadingPlateData, setIsLoadingPlateData] = useState(false);
  const [plateApiError, setPlateApiError] = useState("");

  // Fonction pour détecter et formater le numéro de téléphone international
  const formatPhoneNumber = (phone: string): string => {
    // Supprimer tous les caractères non numériques sauf le +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Si le numéro commence déjà par +, essayer de le formater selon le pays
    if (cleaned.startsWith("+")) {
      for (const country of COUNTRY_CODES) {
        if (cleaned.startsWith(country.code)) {
          const withoutPrefix = cleaned.slice(country.code.length);
          if (
            withoutPrefix.length >= country.length - 1 &&
            withoutPrefix.length <= country.length + 1
          ) {
            const paddedNumber = withoutPrefix.padEnd(country.length, "");
            return `${country.code} ${country.format(paddedNumber.slice(0, country.length))}`;
          }
        }
      }
      return cleaned; // Retourner tel quel si format non reconnu
    }

    // Pour les numéros français sans indicatif
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      const withoutZero = cleaned.slice(1);
      return `+33 ${withoutZero.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
    }

    // Si le numéro fait 9 chiffres (français sans 0), ajouter +33
    if (cleaned.length === 9 && !cleaned.startsWith("0")) {
      return `+33 ${cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
    }

    // Si pas de format reconnu, ajouter +33 par défaut pour la France
    if (cleaned.length > 0 && !cleaned.startsWith("+")) {
      return `+33 ${cleaned}`;
    }

    return cleaned;
  };

  // Initialiser formData avec les fonctions de formatage
  const initializeFormData = (): FormData => ({
    listingType: "",
    category: "",
    subcategory: "",
    title: "",
    registrationNumber: "",
    specificDetails: {},
    description: "",
    photos: [],
    price: 0,
    location: { city: "", postalCode: "" },
    contact: {
      phone: "",
      email: "",
      hidePhone: false,
      whatsapp: "",
      sameAsPhone: false,
      showPhone: true, // affiché par défaut
      showWhatsapp: true, // affiché par défaut
      showInternal: true, // activé par défaut (ou false si tu veux)
    },
    premiumPack: "free", // Gardé pour compatibilité mais plus utilisé dans le flux
  });

  const [formData, setFormData] = useState<FormData>(initializeFormData());

  // 🔧 Gestion mémoire des preview URLs (évite crash mobile)
  const photoPreviewUrls = useMemo(() => {
    return formData.photos.map((photo) => {
      if (typeof photo === "string") {
        return photo; // URL déjà uploadée
      }
      return URL.createObjectURL(photo); // Créer URL pour File
    });
  }, [formData.photos]);

  // Nettoyer les URLs quand les photos changent ou composant démonté
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoPreviewUrls]);

  const [vehicleDataLoading, setVehicleDataLoading] = useState(false);
  const [vehicleDataMessage, setVehicleDataMessage] = useState("");

  const totalSteps = 14; // 2 nouveaux steps pour plaque + 12 steps existants

  // Réinitialiser la sous-catégorie quand la catégorie change
  useEffect(() => {
    if (formData.category) {
      setFormData((prev) => ({
        ...prev,
        subcategory: "",
        specificDetails: {},
      }));
    }
  }, [formData.category]);

  // État pour éviter le pré-remplissage multiple
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  // Réinitialiser le flag à chaque ouverture du composant
  useEffect(() => {
    setHasPrefilledData(false);
  }, []);

  // Pré-remplir avec les données utilisateur via appel API
  useEffect(() => {
    const loadUserContactData = async () => {
      if ((user || profile) && !hasPrefilledData) {
        try {
          console.log(
            "🔄 Récupération des données utilisateur depuis Supabase...",
          );

          // Appel API pour récupérer les données fraîches de l'utilisateur
          const userEmail = user?.email || profile?.email;
          if (!userEmail) return;

          const response = await fetch(
            `/api/users/by-email/${encodeURIComponent(userEmail)}`,
          );
          if (!response.ok) {
            console.error(
              "Erreur lors de la récupération des données utilisateur",
            );
            return;
          }

          const userData = await response.json();
          console.log("📞 Données utilisateur récupérées:", userData);

          const userPhone = userData.phone
            ? formatPhoneNumber(userData.phone)
            : "";
          const userWhatsapp = userData.whatsapp
            ? formatPhoneNumber(userData.whatsapp)
            : "";

          setFormData((prev) => ({
            ...prev,
            location: {
              city: userData.city || "",
              postalCode: userData.postal_code?.toString() || "",
            },
            contact: {
              ...prev.contact,
              phone: userPhone,
              email: userData.email || "",
              whatsapp: userWhatsapp,
              sameAsPhone: userWhatsapp === userPhone && userPhone !== "",
            },
          }));

          setHasPrefilledData(true);
          console.log("✅ Données auto-remplies depuis l'API");
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données utilisateur:",
            error,
          );
        }
      }
    };

    loadUserContactData();
  }, [user, profile, hasPrefilledData]);

  const updateFormData = (field: string, value: any) => {
    console.log("updateFormData called:", field, value);

    // Validation spéciale pour le titre
    if (field === "title") {
      // Limiter à 50 caractères et ne garder que lettres, chiffres, espaces et caractères accentués
      const cleanedValue = value
        .replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, "") // Garde uniquement lettres, chiffres, espaces et caractères accentués
        .substring(0, 50); // Limite à 50 caractères

      setFormData((prev) => {
        const newData = { ...prev, [field]: cleanedValue };
        console.log("New form data (title filtered):", newData);
        return newData;
      });
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        console.log("New form data:", newData);
        return newData;
      });
    }

    // Réactiver l'auto-avancement quand l'utilisateur fait un nouveau choix
    if (!autoAdvanceEnabled) {
      enableAutoAdvance();
    }

    // Auto-avancement immédiat pour l'état du bien
    if (field === "condition" && value && currentStep === 4) {
      setTimeout(() => setCurrentStep(5), 300);
    }
  };

  const updateSpecificDetails = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specificDetails: { ...prev.specificDetails, [field]: value },
    }));
  };

  // Fonctions pour gérer les tags de compatibilité
  const getCompatibilitySuggestions = (): string[] => {
    if (!compatibilitySearch.trim()) return [];

    const searchTerm = compatibilitySearch.toLowerCase();
    const suggestions: string[] = [];

    // Récupérer les marques selon le type de pièce
    let brandsToSearch: string[] = [];
    if (formData.subcategory === "piece-voiture-utilitaire") {
      brandsToSearch = brandsByVehicleType.voiture || [];
    } else if (formData.subcategory === "piece-moto-scooter") {
      brandsToSearch = brandsByVehicleType.moto || [];
    } else if (formData.subcategory === "piece-quad") {
      brandsToSearch = brandsByVehicleType.quad || [];
    } else if (formData.subcategory === "piece-jetski-bateau") {
      brandsToSearch = [
        ...(brandsByVehicleType.jetski || []),
        ...(brandsByVehicleType.bateau || []),
      ];
    } else if (formData.subcategory === "piece-caravane-remorque") {
      brandsToSearch = [
        ...(brandsByVehicleType.caravane || []),
        ...(brandsByVehicleType.remorque || []),
      ];
    } else if (formData.subcategory === "piece-aerien") {
      brandsToSearch = brandsByVehicleType.aerien || [];
    } else {
      // Pour autres catégories de pièces, on prend toutes les marques
      brandsToSearch = [
        ...(brandsByVehicleType.voiture || []),
        ...(brandsByVehicleType.moto || []),
      ];
    }

    // Filtrer les marques
    const matchingBrands = brandsToSearch.filter((brand) =>
      brand.toLowerCase().includes(searchTerm)
    );
    suggestions.push(...matchingBrands);

    // Si la recherche correspond à une marque, ajouter les modèles
    Object.entries(carModelsByBrand).forEach(([brand, models]) => {
      if (brand.toLowerCase().includes(searchTerm)) {
        models.forEach((model) => {
          suggestions.push(`${brand} ${model}`);
        });
      } else {
        // Rechercher dans les modèles
        const matchingModels = models.filter((model) =>
          model.toLowerCase().includes(searchTerm)
        );
        matchingModels.forEach((model) => {
          suggestions.push(`${brand} ${model}`);
        });
      }
    });

    // Limiter à 10 suggestions et retirer les doublons
    return [...new Set(suggestions)].slice(0, 10);
  };

  const addCompatibilityTag = (tag: string) => {
    const currentTags = formData.specificDetails.compatibilityTags || [];
    if (!currentTags.includes(tag)) {
      updateSpecificDetails("compatibilityTags", [...currentTags, tag]);
    }
    setCompatibilitySearch("");
    setShowCompatibilitySuggestions(false);
  };

  const removeCompatibilityTag = (tagToRemove: string) => {
    const currentTags = formData.specificDetails.compatibilityTags || [];
    updateSpecificDetails(
      "compatibilityTags",
      currentTags.filter((tag: string) => tag !== tagToRemove)
    );
  };

  // Validation du numéro de téléphone international
  const validatePhoneNumber = (
    phone: string,
  ): { isValid: boolean; message: string } => {
    if (!phone)
      return { isValid: false, message: "Le numéro de téléphone est requis" };

    // Vérifier si le numéro commence par +
    if (!phone.startsWith("+")) {
      return {
        isValid: false,
        message:
          "Le numéro doit commencer par un indicatif international (+33, +1, +44, etc.)",
      };
    }

    const cleaned = phone.replace(/[^\d]/g, "");

    // Vérifier pour chaque pays supporté
    for (const country of COUNTRY_CODES) {
      const countryCode = country.code.replace("+", "");
      if (cleaned.startsWith(countryCode)) {
        const withoutPrefix = cleaned.slice(countryCode.length);

        // Validation spécifique pour la France
        if (country.code === "+33") {
          if (withoutPrefix.length === 9) {
            const firstDigit = withoutPrefix.charAt(0);
            const validPrefixes = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
            if (validPrefixes.includes(firstDigit)) {
              return {
                isValid: true,
                message: `Numéro valide (${country.name})`,
              };
            }
          }
        } else {
          // Validation générique pour les autres pays
          if (
            withoutPrefix.length >= country.length - 1 &&
            withoutPrefix.length <= country.length + 1
          ) {
            return {
              isValid: true,
              message: `Numéro valide (${country.name})`,
            };
          }
        }
      }
    }

    // Si aucun pays reconnu, vérifier si c'est un format international valide générique
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      return { isValid: true, message: "Format international valide" };
    }

    return {
      isValid: false,
      message:
        "Format invalide. Utilisez un indicatif international (ex: +33 6 12 34 56 78)",
    };
  };

  // Fonction pour récupérer les données véhicule via API
  const fetchVehicleData = async (registrationNumber: string) => {
    if (!registrationNumber || registrationNumber.trim().length === 0) {
      return;
    }

    setVehicleDataLoading(true);
    setVehicleDataMessage("");

    try {
      const response = await fetch("/api/vehicle-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { specificDetails, vehicleInfo } = result.data;

        // Préparer les données pour le modal de prévisualisation
        const previewData = {
          brand: specificDetails.brand,
          model: specificDetails.model,
          year: specificDetails.firstRegistration 
            ? specificDetails.firstRegistration.split('-')[0] 
            : vehicleInfo.year,
          fuelType: specificDetails.fuel,
          transmission: specificDetails.transmission,
          color: specificDetails.color,
          engineSize: specificDetails.engineSize,
          doors: specificDetails.doors,
          co2: specificDetails.co2,
          fiscalPower: specificDetails.fiscalHorsepower,
        };

        // Stocker les données complètes pour utilisation après confirmation
        setPendingVehicleData({ specificDetails, vehicleInfo });
        setPendingRegistrationNumber(registrationNumber);
        
        // Afficher le modal de prévisualisation
        setShowVehiclePreview(true);
      } else {
        toast({
          title: "❌ " + (result.error || "Véhicule non trouvé"),
          description: "Veuillez remplir les champs manuellement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur récupération données:", error);
      toast({
        title: "❌ Erreur de connexion",
        description: "Impossible de récupérer les données du véhicule",
        variant: "destructive",
      });
    } finally {
      setVehicleDataLoading(false);
    }
  };

  // Fonction pour confirmer et remplir le formulaire avec les données
  const confirmAndFillVehicleData = () => {
    if (!pendingVehicleData) return;

    const { specificDetails, vehicleInfo } = pendingVehicleData;
    const filledFields: string[] = [];

    // DEBUG: Log des données reçues
    console.log('🔍 DEBUG - Données reçues du backend:', specificDetails);

    // Pré-remplir automatiquement les détails spécifiques
    const newSpecificDetails = { ...formData.specificDetails };

    if (specificDetails.brand) {
      newSpecificDetails.brand = specificDetails.brand;
      filledFields.push('Marque');
      console.log('✅ Marque remplie:', specificDetails.brand);
    }
    if (specificDetails.model) {
      newSpecificDetails.model = specificDetails.model;
      filledFields.push('Modèle');
    }
    if (specificDetails.firstRegistration) {
      // Extraire l'année de la date ISO
      const year = specificDetails.firstRegistration.split('-')[0];
      newSpecificDetails.year = year;
      filledFields.push('Année');
    }
    if (specificDetails.fuel) {
      // Mapper fuel vers fuelType (champ du formulaire)
      newSpecificDetails.fuelType = specificDetails.fuel;
      filledFields.push('Carburant');
      console.log('✅ Carburant rempli:', specificDetails.fuel);
    }
    if (specificDetails.transmission) {
      newSpecificDetails.transmission = specificDetails.transmission;
      filledFields.push('Transmission');
    }
    if (specificDetails.color) {
      newSpecificDetails.color = specificDetails.color;
      filledFields.push('Couleur');
    }
    if (specificDetails.bodyType) {
      // Mapper bodyType (API) vers vehicleType (formulaire)
      newSpecificDetails.vehicleType = specificDetails.bodyType;
      filledFields.push('Type de véhicule');
      console.log('✅ Type de véhicule rempli:', specificDetails.bodyType);
    }
    if (specificDetails.engineSize) {
      // engineSize est numérique, le stocker tel quel
      newSpecificDetails.engineSize = specificDetails.engineSize;
      filledFields.push('Cylindrée');
    }
    if (specificDetails.doors) {
      newSpecificDetails.doors = specificDetails.doors;
      filledFields.push('Portes');
    }
    if (specificDetails.co2) {
      newSpecificDetails.co2 = specificDetails.co2;
      filledFields.push('CO2');
    }
    if (specificDetails.fiscalHorsepower) {
      // Mapper fiscalHorsepower vers fiscalPower (champ du formulaire)
      newSpecificDetails.fiscalPower = specificDetails.fiscalHorsepower;
      filledFields.push('Puissance fiscale');
      console.log('✅ Puissance fiscale remplie:', specificDetails.fiscalHorsepower);
    }

    setFormData((prev) => ({
      ...prev,
      specificDetails: newSpecificDetails,
    }));

    setAutoFilledFields(filledFields);

    // Fermer le modal
    setShowVehiclePreview(false);
    setPendingVehicleData(null);

    // Toast avec info véhicule et liste des champs remplis
    const vehicleDesc = `${vehicleInfo.brand || ''} ${vehicleInfo.model || ''}`.trim();
    const yearInfo = vehicleInfo.year ? ` (${vehicleInfo.year})` : '';
    const fieldsCount = filledFields.length;
    
    toast({
      title: `✅ ${vehicleDesc}${yearInfo} importé`,
      description: `${fieldsCount} champ${fieldsCount > 1 ? 's' : ''} rempli${fieldsCount > 1 ? 's' : ''} : ${filledFields.join(', ')}. Vérifiez et complétez les informations manquantes.`,
    });
  };

  // Fonction pour annuler la prévisualisation
  const cancelVehicleDataPreview = () => {
    setShowVehiclePreview(false);
    setPendingVehicleData(null);
    setPendingRegistrationNumber("");
  };

  // Nouveaux handlers pour le flux de plaque (Steps 1-2)
  const handlePlateSearch = async () => {
    if (!formData.registrationNumber || formData.registrationNumber.trim().length < 5) {
      setPlateApiError("Veuillez saisir un numéro d'immatriculation valide");
      return;
    }

    setIsLoadingPlateData(true);
    setPlateApiError("");

    try {
      const response = await fetch("/api/vehicle-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber: formData.registrationNumber }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { specificDetails, vehicleInfo } = result.data;

        // Stocker les données de l'API
        setApiVehicleData({
          brand: specificDetails.brand,
          model: specificDetails.model,
          year: specificDetails.firstRegistration 
            ? specificDetails.firstRegistration.split('-')[0] 
            : vehicleInfo.year,
          fuel: specificDetails.fuel,
          transmission: specificDetails.transmission,
          power: specificDetails.power,
          engineSize: specificDetails.engineSize,
          doors: specificDetails.doors,
          bodyType: specificDetails.bodyType,
          color: specificDetails.color,
          co2: specificDetails.co2,
          fiscalHorsepower: specificDetails.fiscalHorsepower,
          cylinders: specificDetails.cylinders,
          genreVCG: specificDetails.genreVCG,
        });

        // Passer au step 2 (validation)
        setCurrentStep(2);
      } else {
        setPlateApiError(result.error || "Véhicule non trouvé. Essayez la saisie manuelle.");
      }
    } catch (error) {
      console.error("Erreur récupération données:", error);
      setPlateApiError("Erreur de connexion. Veuillez réessayer ou saisir manuellement.");
    } finally {
      setIsLoadingPlateData(false);
    }
  };

  const handleManualEntry = () => {
    setUseManualMode(true);
    setCurrentStep(3); // Passer directement au step 3 (ancien step 1 - type d'annonce)
  };

  const toggleEquipment = (equipment: string) => {
    const currentEquipment = formData.specificDetails.equipment || [];
    const updatedEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter((item: string) => item !== equipment)
      : [...currentEquipment, equipment];

    updateSpecificDetails("equipment", updatedEquipment);
  };

  const nextStepHandler = () => {
    // Mode PLAQUE : Après Step 2 (validation données), auto-remplir et sauter au titre
    if (currentStep === 2 && !useManualMode && apiVehicleData) {
      // Auto-remplir TOUTES les données : métadonnées ET détails du véhicule
      setFormData(prev => ({
        ...prev,
        listingType: "sale", // C'est toujours une vente si on a saisi une plaque
        category: "vehicules", // C'est toujours un véhicule
        subcategory: "voiture", // On suppose que c'est une voiture (peut être ajusté si moto)
        condition: "occasion", // Une plaque implique un véhicule d'occasion
        // 🔧 COPIER LES DONNÉES DE L'API DANS specificDetails
        // IMPORTANT: Mapper les noms de champs API vers les noms utilisés dans le Step 8
        specificDetails: {
          ...prev.specificDetails,
          brand: formData.specificDetails.brand || apiVehicleData.brand,
          model: formData.specificDetails.model || apiVehicleData.model,
          year: formData.specificDetails.year || apiVehicleData.year,
          fuelType: formData.specificDetails.fuelType || apiVehicleData.fuel,
          transmission: formData.specificDetails.transmission || apiVehicleData.transmission,
          power: formData.specificDetails.power || apiVehicleData.power,
          engineSize: formData.specificDetails.engineSize || apiVehicleData.engineSize,
          doors: formData.specificDetails.doors || apiVehicleData.doors,
          // Mapper bodyType → vehicleType (utilisé dans Step 8)
          vehicleType: formData.specificDetails.vehicleType || apiVehicleData.bodyType,
          color: formData.specificDetails.color || apiVehicleData.color,
          // Mapper fiscalHorsepower → fiscalPower (utilisé dans Step 8)
          fiscalPower: formData.specificDetails.fiscalPower || apiVehicleData.fiscalHorsepower,
          // Champs saisis manuellement dans le Step 2 (DataValidationStep)
          mileage: formData.specificDetails.mileage || 0,
          emissionClass: formData.specificDetails.emissionClass || null,
          equipment: formData.specificDetails.equipment || [],
        }
      }));
      
      // Sauter directement au Step 7 (titre de l'annonce)
      setCurrentStep(7);
      return;
    }
    
    // Mode PLAQUE : Depuis Step 7 (titre+description), aller au Step 8 (détails) comme le flux manuel
    // On ne saute plus le Step 8 car on doit utiliser le même formulaire que le flux manuel
    // Les données API sont déjà dans formData.specificDetails, elles seront pré-remplies
    if (currentStep === 7 && !useManualMode && apiVehicleData) {
      setCurrentStep(8); // Aller au Step 8 (détails) au lieu de sauter
      return;
    }
    
    // Mode MANUEL : Navigation spécifique pour Steps 3-6
    if (useManualMode) {
      if (currentStep === 3) {
        // Step 3 (type d'annonce) → Step 4 (catégorie)
        setCurrentStep(4);
        return;
      }
      if (currentStep === 4) {
        // Step 4 (catégorie) → Step 5 (sous-catégorie)
        setCurrentStep(5);
        return;
      }
      if (currentStep === 5) {
        // Step 5 (sous-catégorie) → Step 6 (condition) ou Step 7 selon needsConditionStep()
        setCurrentStep(needsConditionStep() ? 6 : 7);
        return;
      }
      if (currentStep === 6) {
        // Step 6 (condition) → Step 7 (titre+description)
        setCurrentStep(7);
        return;
      }
    }
    
    // Logique normale pour tous les autres cas
    goToNextStep();
  };

  const prevStepHandler = () => {
    // Désactiver l'auto-avancement temporairement
    disableAutoAdvance();

    // Effacer seulement les données de navigation (pas les contenus saisis par l'utilisateur)
    switch (currentStep) {
      case 2:
        // En revenant du step 2 (validation) au step 1 (plaque), on efface les données API
        setApiVehicleData(null);
        setPlateApiError("");
        break;

      case 3:
        // En revenant du step 3 (type d'annonce), gérer selon le mode
        if (useManualMode) {
          // Si mode manuel, retourner au step 1
          setCurrentStep(1);
          setUseManualMode(false);
        } else {
          // Si mode API, retourner au step 2
          goToPreviousStep();
        }
        enableAutoAdvance();
        return; // Sortir sans appeler goToPreviousStep à la fin

      case 4:
        // En revenant de l'étape catégorie, on efface le type d'annonce
        setFormData((prev) => ({ ...prev, listingType: "" }));
        break;

      case 5:
        // En revenant de l'étape sous-famille, on efface la famille principale
        setFormData((prev) => ({ ...prev, category: "" }));
        break;

      case 6:
        // En revenant de l'étape état du bien, on efface la sous-famille
        setFormData((prev) => ({
          ...prev,
          subcategory: "",
          condition: undefined,
        }));
        break;

      case 7:
        // Mode PLAQUE : Revenir directement au Step 2 (validation données)
        if (!useManualMode && apiVehicleData) {
          setCurrentStep(2);
          enableAutoAdvance();
          return;
        }
        
        // Mode MANUEL : En revenant du titre, on efface l'état du bien ou la sous-famille selon le cas
        if (needsConditionStep()) {
          setFormData((prev) => ({ ...prev, condition: undefined }));
        } else {
          setFormData((prev) => ({ ...prev, subcategory: "" }));
        }
        break;
      
      case 10:
        // Mode PLAQUE : Depuis Step 10 (photos), revenir au Step 7 (titre+description) en sautant Step 8 et 9
        if (!useManualMode && apiVehicleData) {
          setCurrentStep(7);
          enableAutoAdvance();
          return;
        }
        break;
      
      // Pour les étapes 8 et suivantes, on ne supprime rien - on préserve tout le contenu utilisateur
    }

    goToPreviousStep();

    // Réactiver l'auto-avancement après un délai
    setTimeout(() => {
      enableAutoAdvance();
    }, 500);
  };

  const canProceed = () => {
    const result = (() => {
      switch (currentStep) {
        case 1:
          // Step 1 (NEW): PlateInputStep - toujours valide (on peut rechercher ou passer en manuel)
          return true;
        case 2:
          // Step 2 (NEW): DataValidationStep - vérifier les champs essentiels
          return formData.specificDetails.brand && formData.specificDetails.model && formData.specificDetails.year;
        case 3:
          // Step 3 (was 1): ListingTypeStep
          return formData.listingType !== "";
        case 4:
          // Step 4 (was 2): CategoryStep
          return formData.category !== "";
        case 5:
          // Step 5 (was 3): Subcategory
          return formData.subcategory !== "";
        case 6:
          // Step 6 (was 4): Condition - état du bien (seulement pour biens matériels)
          if (needsConditionStep()) {
            return formData.condition !== undefined;
          }
          return true; // Si pas besoin d'état, toujours valide
        case 7:
          // Step 7: Titre et Description (fusionnés)
          return formData.title.trim() !== "" && formData.description && formData.description.trim().length > 0;
        case 8:
          // Step 8 (was 6): Details - détails spécifiques
          // Ignorer pour les recherches de pièces détachées ET les services
          if (isSearchForParts() || isServiceCategory()) {
            return true;
          }
          // Validation spécifique pour les pièces détachées
          if (isPiecePart()) {
            return !!(
              formData.specificDetails.partCategory &&
              formData.specificDetails.partCondition
            );
          }
          // Validation pour les services
          if (
            formData.subcategory === "reparation" ||
            formData.subcategory === "remorquage" ||
            formData.subcategory === "entretien" ||
            formData.subcategory === "autre-service"
          ) {
            return !!(
              formData.specificDetails.serviceType &&
              formData.specificDetails.serviceArea
            );
          }
          // Validation spécifique pour les voitures
          if (formData.subcategory === "voiture") {
            return !!(
              formData.specificDetails.brand &&
              formData.specificDetails.model &&
              formData.specificDetails.year &&
              formData.specificDetails.mileage &&
              formData.specificDetails.fuelType &&
              formData.specificDetails.vehicleType &&
              formData.specificDetails.transmission
            );
          }
          // Validation pour les utilitaires
          if (formData.subcategory === "utilitaire") {
            return !!(
              formData.specificDetails.brand &&
              formData.specificDetails.model &&
              formData.specificDetails.year &&
              formData.specificDetails.mileage &&
              formData.specificDetails.fuelType &&
              formData.specificDetails.utilityType &&
              formData.specificDetails.transmission
            );
          }
          // Validation pour les motos et scooters
          if (
            formData.subcategory === "moto" ||
            formData.subcategory === "scooter"
          ) {
            return !!(
              formData.specificDetails.brand &&
              formData.specificDetails.model &&
              formData.specificDetails.year &&
              formData.specificDetails.mileage &&
              formData.specificDetails.motorcycleType
            );
          }
          // Validation pour les caravanes
          if (formData.subcategory === "caravane") {
            return !!(
              formData.specificDetails.brand &&
              formData.specificDetails.model &&
              formData.specificDetails.year &&
              formData.specificDetails.caravanType &&
              formData.specificDetails.sleeps
            );
          }
          // Validation pour les remorques
          if (formData.subcategory === "remorque") {
            return !!formData.specificDetails.trailerType;
          }
          // Validation pour les bateaux
          if (formData.subcategory === "bateau") {
            return !!(
              formData.specificDetails.brand &&
              formData.specificDetails.model &&
              formData.specificDetails.year &&
              formData.specificDetails.boatType &&
              formData.specificDetails.length
            );
          }
          // Validation pour les autres sous-catégories
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year
          );
        case 9:
          // Step 9: OBSOLÈTE - Description fusionnée avec Step 7
          return true; // Toujours valide pour permettre le passage
        case 10:
          // Step 10 (was 8): Photos
          return true; // Photos optionnelles - toujours permettre de passer
        case 11:
          // Step 11 (was 9): Price
          // Ignorer cette étape pour les recherches de pièces détachées ET les annonces de recherche
          if (isSearchForParts() || isSearchListing()) {
            return true;
          }
          return formData.price > 0;
        case 12:
          // Step 12: Localisation et Contacts (fusionnés)
          // Ignorer cette étape pour les recherches de pièces détachées
          if (isSearchForParts()) {
            return true;
          }
          const locationValid =
            formData.location.city !== "" &&
            formData.location.postalCode !== "";
          const contactValid =
            formData.contact.phone !== "" &&
            validatePhoneNumber(formData.contact.phone).isValid;
          console.log("Step 12 validation:", {
            city: formData.location.city,
            postalCode: formData.location.postalCode,
            locationValid,
            contactValid,
          });
          return locationValid && contactValid;
        case 13:
          // Step 13: OBSOLÈTE - Contacts fusionnés avec Step 12
          return true; // Toujours valide pour permettre le passage
        case 14:
          // Step 14 (was 12): Summary
          return true; // Étape de récapitulatif
        default:
          return false;
      }
    })();

    // Debug log pour identifier le problème
    console.log(`Step ${currentStep}: canProceed = ${result}`, {
      listingType: formData.listingType,
      category: formData.category,
      subcategory: formData.subcategory,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      photosCount: formData.photos.length,
      needsCondition: needsConditionStep(),
      condition: formData.condition,
    });

    return result;
  };

  const getSelectedCategory = () => {
    return CATEGORIES.find((cat) => cat.id === formData.category);
  };

  const getSelectedSubcategory = () => {
    const category = getSelectedCategory();
    return category?.subcategories.find(
      (sub) => sub.id === formData.subcategory,
    );
  };

  // Vérifier si la sous-catégorie nécessite un numéro d'immatriculation
  const needsRegistrationNumber = () => {
    const vehicleSubcategories = [
      "voiture",
      "utilitaire",
      "caravane",
      "remorque",
      "moto",
      "scooter",
      "quad",
      "bateau",
      "jetski",
      "aerien",
    ];
    return vehicleSubcategories.includes(formData.subcategory);
  };

  // Vérifier si la catégorie nécessite une étape d'état du bien (biens matériels uniquement)
  //  const needsConditionStep = () => {
  const needsConditionStep = (): boolean => {
    const category = getSelectedCategory();
    // Seulement pour les biens matériels, excluant services et pièces détachées
    return !!(
      category?.isMaterial &&
      category?.id !== "services" &&
      category?.id !== "pieces"
    );
  };

  // Vérifier si on est dans le cas d'une recherche de pièces détachées
  const isSearchForParts = () => {
    return (
      formData.listingType === "search" && formData.category === "spare-parts"
    );
  };

  const isServiceCategory = () => {
    return formData.category === "services";
  };

  const isSearchListing = () => {
    return formData.listingType === "search";
  };

  // Vérifier si c'est une pièce détachée
  const isPiecePart = () => {
    return (
      formData.subcategory === "piece-voiture-utilitaire" ||
      formData.subcategory === "piece-moto-scooter" ||
      formData.subcategory === "piece-quad" ||
      formData.subcategory === "piece-caravane-remorque" ||
      formData.subcategory === "piece-jetski-bateau" ||
      formData.subcategory === "piece-aerien" ||
      formData.subcategory === "autre-piece"
    );
  };

  const {
    autoAdvanceEnabled,
    currentStep,
    disableAutoAdvance,
    enableAutoAdvance,
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
  } = useListingNavigation({
    totalSteps,
    formState: {
      listingType: formData.listingType,
      category: formData.category,
      subcategory: formData.subcategory,
      condition: formData.condition,
    },
    needsConditionStep,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
  });

  const { formatRegistrationNumber, validateRegistrationNumber } =
    useRegistrationNumber();

  // Désactiver l'auto-avancement en mode manuel pour éviter les conflits
  useEffect(() => {
    if (useManualMode && currentStep >= 3 && currentStep <= 6) {
      disableAutoAdvance();
    } else if (!useManualMode || currentStep < 3 || currentStep > 6) {
      enableAutoAdvance();
    }
  }, [useManualMode, currentStep, disableAutoAdvance, enableAutoAdvance]);

  // Générer automatiquement le titre depuis les données API quand on arrive au Step 7
  useEffect(() => {
    if (currentStep === 7 && !useManualMode && apiVehicleData && !formData.title) {
      const brand = formData.specificDetails.brand || apiVehicleData.brand || '';
      const model = formData.specificDetails.model || apiVehicleData.model || '';
      const fuelType = formData.specificDetails.fuelType || apiVehicleData.fuel || '';
      const year = formData.specificDetails.year || apiVehicleData.year || '';

      // Générer le titre au format: "Marque Modèle Carburant Année"
      const autoTitle = [brand, model, fuelType, year].filter(Boolean).join(' ');
      
      if (autoTitle.trim()) {
        updateFormData('title', autoTitle);
        console.log('✨ Titre auto-généré:', autoTitle);
      }
    }
  }, [currentStep, apiVehicleData, useManualMode, formData.title]);

  // Fonction pour publier l'annonce
  const publishListing = async () => {
    try {
      // Vérification du quota pour les comptes professionnels
      if (quotaInfo && !quotaInfo.canCreate) {
        alert(
          quotaInfo.message ||
            "Vous avez atteint votre limite d'annonces. Passez à un plan supérieur pour publier plus d'annonces.",
        );
        return;
      }

      console.log("Publier l'annonce:", formData);

      // Transformer les données pour l'API avec validation adaptée au type d'annonce
      const isService = formData.category === "services";
      const isSearch = formData.listingType === "search";

      const vehicleData = {
        userId: profile?.id || user?.id,
        title: formData.title || "",
        description: formData.description || "",
        category: formData.subcategory || "", // Utiliser la sous-catégorie spécifique comme catégorie principale
        subcategory: formData.subcategory || "",
        // Tous les champs avec valeurs par défaut pour respecter les contraintes DB
        brand: formData.specificDetails.brand || "Non spécifié",
        model: formData.specificDetails.model || "Non spécifié",
        year: formData.specificDetails.year
          ? parseInt(formData.specificDetails.year.toString())
          : new Date().getFullYear(),
        mileage: formData.specificDetails.mileage || 0,
        fuelType: formData.specificDetails.fuelType || "Non spécifié",
        // Nouveaux champs communs
        transmission: formData.specificDetails.transmission || null,
        color: formData.specificDetails.color || null,
        power: formData.specificDetails.power ? parseInt(formData.specificDetails.power.toString()) : null,
        emissionClass: formData.specificDetails.emissionClass || null,
        // Spécifications véhicule (JSON)
        vehicleSpecifications: {
          // Voiture
          vehicleType: formData.specificDetails.vehicleType || null,
          doors: formData.specificDetails.doors ? parseInt(formData.specificDetails.doors.toString()) : null,
          fiscalHorsepower: formData.specificDetails.fiscalPower ? parseInt(formData.specificDetails.fiscalPower.toString()) : null,
          upholstery: formData.specificDetails.upholstery || null,
          // Moto
          motorcycleType: formData.specificDetails.motorcycleType || null,
          displacement: formData.specificDetails.displacement ? parseInt(formData.specificDetails.displacement.toString()) : null,
          licenseType: formData.specificDetails.licenseType || null,
          // Utilitaire
          utilityType: formData.specificDetails.utilityType || null,
          payload: formData.specificDetails.payload ? parseInt(formData.specificDetails.payload.toString()) : null,
          volume: formData.specificDetails.volume ? parseFloat(formData.specificDetails.volume.toString()) : null,
          seats: formData.specificDetails.seats ? parseInt(formData.specificDetails.seats.toString()) : null,
          // Remorque
          trailerType: formData.specificDetails.trailerType || null,
          dimensions: formData.specificDetails.dimensions || null,
          emptyWeight: formData.specificDetails.emptyWeight ? parseInt(formData.specificDetails.emptyWeight.toString()) : null,
          maxWeight: formData.specificDetails.maxWeight ? parseInt(formData.specificDetails.maxWeight.toString()) : null,
          // Jet Ski
          jetskiType: formData.specificDetails.jetskiType || null,
          usageHours: formData.specificDetails.usageHours ? parseInt(formData.specificDetails.usageHours.toString()) : null,
          // Équipements
          equipment: formData.specificDetails.equipment || [],
        },
        condition: formData.condition || "good",
        price: formData.price || 0,
        location: formData.location || "",
        images:
          formData.photos?.map((photo) =>
            typeof photo === "string" ? photo : URL.createObjectURL(photo),
          ) || [],
        features: formData.specificDetails.equipment || [],
        damageDetails:
          formData.condition === "damaged"
            ? {
                damageTypes: formData.specificDetails.damageTypes || [],
                mechanicalState: formData.specificDetails.mechanicalState || "",
                severity: formData.specificDetails.damageSeverity || "",
              }
            : null,
        compatibilityTags:
          isPiecePart()
            ? formData.specificDetails.compatibilityTags || []
            : null,
        // Informations de contact spécifiques à l'annonce
        contactPhone: formData.contact.phone || "",
        contactEmail: formData.contact.email || "",
        contactWhatsapp: formData.contact.whatsapp || "",
        hidePhone: !formData.contact.showPhone,
        hideWhatsapp: !formData.contact.showWhatsapp,
        hideMessages: false, // Messagerie toujours active
        isPremium: false,
        status: "draft", // Initialement en brouillon
        listingType: formData.listingType || "sale",
      };

      console.log(
        "🔍 FRONTEND - vehicleData avant envoi:",
        JSON.stringify(vehicleData, null, 2),
      );

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const newVehicle = await response.json();
        console.log("Annonce créée avec succès:", newVehicle);

        // Stocker les infos du véhicule créé
        setCreatedVehicle({
          id: newVehicle.id?.toString() || "",
          title: newVehicle.title || formData.title,
        });

        // Afficher le modal de succès
        setShowSuccessModal(true);
      } else {
        throw new Error("Erreur lors de la création de l'annonce");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la publication de l'annonce. Veuillez réessayer.");
    }
  };

  // Fonction pour naviguer vers l'espace personnel
  const navigateToDashboard = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
    // TODO: Naviguer vers l'espace personnel/dashboard
    // navigate('/dashboard');
  };

  // Fonction pour continuer à naviguer (ferme aussi le formulaire)
  const handleContinueNavigating = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess(); // Ferme le formulaire principal
    }
  };

  // Fonction pour ouvrir le modal de boost
  const handleBoostListing = () => {
    setShowSuccessModal(false);
    setShowBoostModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limiter à 4 photos maximum
    const remainingSlots = 4 - formData.photos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    try {
      // 🔧 Compression des images AVANT upload (évite crash mobile)
      const compressedFiles = await Promise.all(
        filesToAdd.map(async (file) => {
          try {
            // Compresser seulement les fichiers > 500KB
            if (file.size > 500 * 1024) {
              console.log(`Compression de ${file.name} (${(file.size / 1024).toFixed(0)}KB)...`);
              return await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.85,
              });
            }
            return file;
          } catch (error) {
            console.error(`Erreur compression ${file.name}:`, error);
            return file; // Fallback au fichier original
          }
        })
      );

      // Upload vers Supabase Storage
      const uploadFormData = new FormData();
      compressedFiles.forEach((file) => {
        uploadFormData.append("images", file);
      });

      const userId = profile?.id || "anonymous";
      const response = await fetch(`/api/images/upload/${userId}`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Échec de l'upload");
      }

      const data = await response.json();

      if (data.success && data.images) {
        const newImageUrls = data.images.map((img: any) => img.url);
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newImageUrls],
        }));
        console.log("Images uploadées avec succès:", newImageUrls);
      } else {
        // Fallback : utiliser les fichiers compressés localement
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...compressedFiles],
        }));
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      // Fallback : utiliser les fichiers compressés localement
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...filesToAdd],
      }));
    }

    // Réinitialiser l'input
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Fonction pour ouvrir le modal de floutage d'immatriculation
  const handleBlurPlate = async (index: number) => {
    const photo = formData.photos[index];
    let imageUrl: string;

    // Si c'est un File, il faut d'abord l'uploader
    if (typeof photo !== "string") {
      try {
        // Upload temporaire de l'image
        const formData = new FormData();
        formData.append("images", photo);

        const uploadResponse = await fetch(`/api/images/upload/${user?.id}`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Erreur upload image");
        }

        const { images } = await uploadResponse.json();
        imageUrl = images[0].url;

        // Mettre à jour le formData avec l'URL uploadée
        setFormData((prev) => {
          const newPhotos = [...prev.photos];
          newPhotos[index] = imageUrl;
          return {
            ...prev,
            photos: newPhotos,
          };
        });
      } catch (error) {
        console.error("Erreur upload image:", error);
        alert("Erreur lors de l'upload de l'image. Veuillez réessayer.");
        return;
      }
    } else {
      imageUrl = photo;
    }

    setPlateBlurModal({
      isOpen: true,
      photoIndex: index,
      imageUrl,
    });
  };

  // Fonction pour appliquer le masque blanc sur l'image
  const handleApplyMask = async (maskData: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    angle: number;
  }) => {
    try {
      const { photoIndex, imageUrl } = plateBlurModal;

      // Appeler l'API backend pour appliquer le masque
      const response = await fetch("/api/images/apply-mask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          mask: maskData,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'application du masque");
      }

      const { maskedImageUrl } = await response.json();

      // Remplacer l'image dans le formulaire par l'image masquée
      setFormData((prev) => {
        const newPhotos = [...prev.photos];
        newPhotos[photoIndex] = maskedImageUrl;
        return {
          ...prev,
          photos: newPhotos,
        };
      });

      // Marquer l'image comme floutée
      setBlurredImages((prev) => new Set(prev).add(photoIndex));

      // Fermer le modal
      setPlateBlurModal({ isOpen: false, photoIndex: -1, imageUrl: "" });
    } catch (error) {
      console.error("Erreur application masque:", error);
      alert("Erreur lors de l'application du masque. Veuillez réessayer.");
    }
  };

  const renderSpecificDetailsFields = () => {
    const subcategory = getSelectedSubcategory();
    if (!subcategory) return null;

    const brands = getBrandsBySubcategory(subcategory.id);
    // Mapper les sous-catégories aux clés d'équipement
    const equipmentKey = (() => {
      switch (subcategory.id) {
        case "voiture":
          return "car";
        case "utilitaire":
          return "utility";
        case "caravane":
          return "caravan";
        case "remorque":
          return "trailer";
        case "moto":
          return "motorcycle";
        case "scooter":
          return "scooter";
        case "quad":
          return "quad";
        case "jetski":
          return "jetski";
        case "bateau":
          return "boat";
        case "aerien":
          return "aircraft";
        default:
          return null;
      }
    })();

    const equipment = equipmentKey
      ? VEHICLE_EQUIPMENT[equipmentKey as keyof typeof VEHICLE_EQUIPMENT] || []
      : [];
    const selectedEquipment = formData.specificDetails.equipment || [];

    // Champs communs pour la plupart des véhicules
    const renderCommonVehicleFields = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Marque *
          </label>
          <select
            value={formData.specificDetails.brand || ""}
            onChange={(e) => updateSpecificDetails("brand", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
          >
            <option value="">Sélectionnez une marque</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Modèle *
          </label>
          {(() => {
            // Logique intelligente : dropdown pour voitures avec marques populaires, texte libre sinon
            const subcategory = getSelectedSubcategory();
            const selectedBrand = formData.specificDetails.brand;
            const isCarWithPopularBrand =
              subcategory?.id === "voiture" &&
              selectedBrand &&
              selectedBrand !== "Autres voitures" &&
              carModelsByBrand[selectedBrand as keyof typeof carModelsByBrand];

            if (isCarWithPopularBrand) {
              // Dropdown pour marques populaires de voitures
              const availableModels =
                carModelsByBrand[
                  selectedBrand as keyof typeof carModelsByBrand
                ] || [];
              return (
                <select
                  value={formData.specificDetails.model || ""}
                  onChange={(e) =>
                    updateSpecificDetails("model", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un modèle</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              );
            } else {
              // Input texte libre pour tout le reste
              return (
                <input
                  type="text"
                  value={formData.specificDetails.model || ""}
                  onChange={(e) =>
                    updateSpecificDetails("model", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="Ex: 320d, Agility 50, Niva..."
                />
              );
            }
          })()}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Année *
          </label>
          <input
            type="number"
            value={formData.specificDetails.year || ""}
            onChange={(e) =>
              updateSpecificDetails("year", parseInt(e.target.value) || "")
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
            placeholder="2020"
            min="1990"
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>
    );

    // Équipements
    const renderEquipment = () =>
      equipment.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Équipements (optionnel)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {equipment.map((item) => (
              <label
                key={item}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                  className="h-4 w-4 text-primary-bolt-500 focus:ring-primary-bolt-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
          {selectedEquipment.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {selectedEquipment.length} équipement
              {selectedEquipment.length > 1 ? "s" : ""} sélectionné
              {selectedEquipment.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      );

    switch (subcategory.id) {
      case "voiture":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de véhicule *
                </label>
                <select
                  value={formData.specificDetails.vehicleType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("vehicleType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.car?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kilométrage *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.mileage || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "mileage",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="50000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boîte de vitesses *
                </label>
                <select
                  value={formData.specificDetails.transmission || ""}
                  onChange={(e) =>
                    updateSpecificDetails("transmission", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {TRANSMISSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Carburant *
                </label>
                <select
                  value={formData.specificDetails.fuelType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("fuelType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un carburant</option>
                  {fuelTypes.map((fuel) => (
                    <option key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur{" "}
                  <span className="text-gray-500 font-normal">(optionnel)</span>
                </label>
                <select
                  value={formData.specificDetails.color || ""}
                  onChange={(e) =>
                    updateSpecificDetails("color", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez une couleur</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Puissance (CV)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.power || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "power",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="150"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de portes{" "}
                  <span className="text-gray-500 font-normal">(optionnel)</span>
                </label>
                <select
                  value={formData.specificDetails.doors || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "doors",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {DOORS.map((door) => (
                    <option key={door} value={door}>
                      {door} portes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Puissance fiscale (CV){" "}
                  <span className="text-gray-500 font-normal">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.fiscalPower || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "fiscalPower",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="7"
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sellerie
                </label>
                <select
                  value={formData.specificDetails.upholstery || ""}
                  onChange={(e) =>
                    updateSpecificDetails("upholstery", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {UPHOLSTERY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Classe d'émissions{" "}
                  <span className="text-gray-500 font-normal">(optionnel)</span>
                </label>
                <select
                  value={formData.specificDetails.emissionClass || ""}
                  onChange={(e) =>
                    updateSpecificDetails("emissionClass", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {EMISSION_CLASSES.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "utilitaire":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type d'utilitaire *
                </label>
                <select
                  value={formData.specificDetails.utilityType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("utilityType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.utility?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kilométrage *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.mileage || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "mileage",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="50000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Boîte de vitesses *
                </label>
                <select
                  value={formData.specificDetails.transmission || ""}
                  onChange={(e) =>
                    updateSpecificDetails("transmission", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {TRANSMISSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Carburant *
                </label>
                <select
                  value={formData.specificDetails.fuelType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("fuelType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un carburant</option>
                  {fuelTypes.map((fuel) => (
                    <option key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Charge utile (kg)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.payload || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "payload",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="1000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Volume utile (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.specificDetails.volume || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "volume",
                      parseFloat(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="8.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de places
                </label>
                <select
                  value={formData.specificDetails.seats || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "seats",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((seat) => (
                    <option key={seat} value={seat}>
                      {seat} place{seat > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={formData.specificDetails.color || ""}
                  onChange={(e) =>
                    updateSpecificDetails("color", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez une couleur</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Classe d'émissions
                </label>
                <select
                  value={formData.specificDetails.emissionClass || ""}
                  onChange={(e) =>
                    updateSpecificDetails("emissionClass", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {EMISSION_CLASSES.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "caravane":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de caravane *
                </label>
                <select
                  value={formData.specificDetails.caravanType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("caravanType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.caravan.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de couchages *
                </label>
                <select
                  value={formData.specificDetails.sleeps || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "sleeps",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sleep) => (
                    <option key={sleep} value={sleep}>
                      {sleep} couchage{sleep > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longueur (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.specificDetails.length || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "length",
                      parseFloat(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="6.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.weight || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "weight",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="1200"
                  min="0"
                />
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "remorque":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de remorque *
                </label>
                <select
                  value={formData.specificDetails.trailerType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("trailerType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.trailer.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Année
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.year || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "year",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dimensions utiles (L x l)
                </label>
                <input
                  type="text"
                  value={formData.specificDetails.dimensions || ""}
                  onChange={(e) =>
                    updateSpecificDetails("dimensions", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="Ex: 3.0 x 1.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Poids à vide (kg)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.emptyWeight || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "emptyWeight",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="300"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Poids max (PTAC) (kg)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.maxWeight || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "maxWeight",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="750"
                  min="0"
                />
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "moto":
      case "scooter":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type {subcategory.id === "moto" ? "de moto" : "de scooter"} *
                </label>
                <select
                  value={formData.specificDetails.motorcycleType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("motorcycleType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {subcategory.id === "moto" &&
                    VEHICLE_TYPES.motorcycle?.map((type: string) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  {subcategory.id === "scooter" &&
                    VEHICLE_TYPES.scooter?.map((type: string) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kilométrage *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.mileage || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "mileage",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="15000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cylindrée (cm³) *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.displacement || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "displacement",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="600"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={formData.specificDetails.color || ""}
                  onChange={(e) =>
                    updateSpecificDetails("color", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez une couleur</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              {subcategory.id === "moto" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de permis requis
                  </label>
                  <select
                    value={formData.specificDetails.licenseType || ""}
                    onChange={(e) =>
                      updateSpecificDetails("licenseType", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  >
                    <option value="">Sélectionnez</option>
                    {LICENSE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {renderEquipment()}
          </div>
        );

      case "quad":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de quad *
                </label>
                <select
                  value={formData.specificDetails.quadType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("quadType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.quad?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kilométrage *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.mileage || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "mileage",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="5000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cylindrée (cm³) *
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.displacement || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "displacement",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="450"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={formData.specificDetails.color || ""}
                  onChange={(e) =>
                    updateSpecificDetails("color", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez une couleur</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transmission
                </label>
                <select
                  value={formData.specificDetails.transmission || ""}
                  onChange={(e) =>
                    updateSpecificDetails("transmission", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  <option value="manual">Manuelle</option>
                  <option value="automatic">Automatique</option>
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "jetski":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de jetski *
                </label>
                <select
                  value={formData.specificDetails.jetskiType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("jetskiType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.jetski?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heures d'utilisation
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.hours || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "hours",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Puissance (CV)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.power || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "power",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="130"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de places
                </label>
                <select
                  value={formData.specificDetails.seats || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "seats",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {[1, 2, 3, 4].map((seat) => (
                    <option key={seat} value={seat}>
                      {seat} place{seat > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "aerien":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type d'aéronef *
                </label>
                <select
                  value={formData.specificDetails.aircraftType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("aircraftType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.aircraft?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heures de vol
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.flightHours || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "flightHours",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="200"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de places
                </label>
                <select
                  value={formData.specificDetails.seats || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "seats",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {[1, 2, 3, 4].map((seat) => (
                    <option key={seat} value={seat}>
                      {seat} place{seat > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={formData.specificDetails.color || ""}
                  onChange={(e) =>
                    updateSpecificDetails("color", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez une couleur</option>
                  {COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "bateau":
        return (
          <div className="space-y-6">
            {renderCommonVehicleFields()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de bateau *
                </label>
                <select
                  value={formData.specificDetails.boatType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("boatType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {VEHICLE_TYPES.boat?.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longueur (m) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.specificDetails.length || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "length",
                      parseFloat(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="6.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de moteur
                </label>
                <input
                  type="text"
                  value={formData.specificDetails.engineType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("engineType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="Ex: Hors-bord, In-board"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Puissance moteur (CV)
                </label>
                <input
                  type="number"
                  value={formData.specificDetails.enginePower || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "enginePower",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="115"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de couchages
                </label>
                <select
                  value={formData.specificDetails.sleeps || ""}
                  onChange={(e) =>
                    updateSpecificDetails(
                      "sleeps",
                      parseInt(e.target.value) || "",
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sleep) => (
                    <option key={sleep} value={sleep}>
                      {sleep === 0
                        ? "Aucun couchage"
                        : `${sleep} couchage${sleep > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderEquipment()}
          </div>
        );

      case "reparation":
      case "remorquage":
      case "entretien":
      case "autre-service":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de service *
                </label>
                <select
                  value={formData.specificDetails.serviceType || ""}
                  onChange={(e) =>
                    updateSpecificDetails("serviceType", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone d'intervention *
                </label>
                <input
                  type="text"
                  value={formData.specificDetails.serviceArea || ""}
                  onChange={(e) =>
                    updateSpecificDetails("serviceArea", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="Ex: Paris et région parisienne"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Certificat / Agrément (optionnel)
              </label>
              <input
                type="text"
                value={formData.specificDetails.certification || ""}
                onChange={(e) =>
                  updateSpecificDetails("certification", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                placeholder="Ex: Agréé assurances, Certifié ISO"
              />
            </div>
          </div>
        );

      case "piece-voiture-utilitaire":
      case "piece-moto-scooter":
      case "piece-quad":
      case "piece-caravane-remorque":
      case "piece-jetski-bateau":
      case "piece-aerien":
      case "autre-piece":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de pièce *
                </label>
                <select
                  value={formData.specificDetails.partCategory || ""}
                  onChange={(e) =>
                    updateSpecificDetails("partCategory", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez un type</option>
                  {PART_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  État *
                </label>
                <select
                  value={formData.specificDetails.partCondition || ""}
                  onChange={(e) =>
                    updateSpecificDetails("partCondition", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                >
                  <option value="">Sélectionnez l'état</option>
                  {PART_CONDITIONS.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Référence (si disponible)
                </label>
                <input
                  type="text"
                  value={formData.specificDetails.partReference || ""}
                  onChange={(e) =>
                    updateSpecificDetails("partReference", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                  placeholder="Ex: 11427788458"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Détails spécifiques pour {subcategory.name}
              </label>
              <textarea
                value={formData.specificDetails.details || ""}
                onChange={(e) =>
                  updateSpecificDetails("details", e.target.value)
                }
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                placeholder="Renseignez les détails spécifiques..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Renseignez les informations importantes pour votre{" "}
                {subcategory.name.toLowerCase()}.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderStepContent = () => {
    const selectedCategory = getSelectedCategory();

    // Redirections pour les steps fusionnés
    if (currentStep === 9) {
      setCurrentStep(10); // Step 9 fusionné avec Step 7 → rediriger vers Step 10 (photos)
      return null;
    }
    if (currentStep === 13) {
      setCurrentStep(14); // Step 13 fusionné avec Step 12 → rediriger vers Step 14 (récap)
      return null;
    }

    // Pour les recherches de pièces détachées, rediriger automatiquement les étapes ignorées
    if (isSearchForParts()) {
      if (currentStep === 7) {
        // Rediriger l'étape 7 vers l'étape 8 ou 10
        setCurrentStep(needsConditionStep() ? 8 : 10);
        return null;
      }
      if (currentStep === 11) {
        // Rediriger l'étape 11 vers l'étape 10 (photos) ou 13 (contacts)
        setCurrentStep(10);
        return null;
      }
      if (currentStep === 12) {
        // Rediriger l'étape 12 vers l'étape 14 (récap) - Step 13 obsolète
        setCurrentStep(14);
        return null;
      }
      if (currentStep === 15) {
        // Rediriger l'étape 15 (récapitulatif) vers l'étape 14 (pack premium)
        setCurrentStep(14);
        return null;
      }
    }

    switch (currentStep) {
      case 1:
        return (
          <PlateInputStep
            registrationNumber={formData.registrationNumber || ''}
            onRegistrationNumberChange={(value) => updateFormData('registrationNumber', value)}
            onSearchClick={handlePlateSearch}
            onManualClick={handleManualEntry}
            isLoading={isLoadingPlateData}
            error={plateApiError}
          />
        );

      case 2:
        return (
          <DataValidationStep
            apiData={apiVehicleData || {}}
            formData={formData.specificDetails}
            onFieldChange={(field, value) => updateSpecificDetails(field, value)}
            brands={(() => {
              const baseBrands = getBrandsBySubcategory(formData.subcategory);
              if (apiVehicleData?.brand && !baseBrands.includes(apiVehicleData.brand)) {
                return [apiVehicleData.brand, ...baseBrands];
              }
              return baseBrands;
            })()}
            models={(() => {
              const baseModels = carModelsByBrand[formData.specificDetails.brand as keyof typeof carModelsByBrand] || [];
              if (apiVehicleData?.model && !baseModels.includes(apiVehicleData.model)) {
                return [apiVehicleData.model, ...baseModels];
              }
              return baseModels;
            })()}
            fuelTypes={fuelTypes}
            transmissionTypes={TRANSMISSION_TYPES}
            colors={COLORS}
            doors={DOORS.map(String)}
            bodyTypes={VEHICLE_TYPES.car}
            equipmentOptions={VEHICLE_EQUIPMENT.car}
            emissionClasses={EMISSION_CLASSES}
            onToggleEquipment={toggleEquipment}
          />
        );

      case 3:
        return (
          <ListingTypeStep
            value={formData.listingType}
            onSelect={(value) => updateFormData("listingType", value)}
          />
        );

      case 4:
        return (
          <CategoryStep
            categories={CATEGORIES}
            selectedCategoryId={formData.category}
            listingType={formData.listingType}
            onSelect={(categoryId) => updateFormData("category", categoryId)}
          />
        );

      case 5:
        if (!selectedCategory) return null;

        return (
          <VehicleDetailsStep
            category={selectedCategory}
            selectedSubcategoryId={formData.subcategory}
            onSelect={(subcategoryId) =>
              updateFormData("subcategory", subcategoryId)
            }
          />
        );

      case 6:
        // Étape état du bien (seulement pour biens matériels)
        if (!needsConditionStep()) {
          // Si pas besoin d'état du bien, aller directement au titre
          return null;
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                État du bien
              </h2>
              <p className="text-gray-600">
                Précisez l'état général de votre{" "}
                {selectedCategory?.name.toLowerCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                {
                  id: "occasion",
                  name: "Occasion",
                  description: "Véhicule d'occasion en état de marche",
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-500",
                  icon: "🚗",
                },
                {
                  id: "damaged",
                  name: "Accidenté",
                  description: "Véhicule accidenté ou endommagé",
                  bgColor: "bg-orange-50",
                  borderColor: "border-orange-500",
                  icon: "⚠️",
                },
              ].map((condition) => (
                <button
                  key={condition.id}
                  onClick={() => updateFormData("condition", condition.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                    formData.condition === condition.id
                      ? `${condition.borderColor} ${condition.bgColor}`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-4xl mb-3">{condition.icon}</div>

                  <h3 className="font-semibold text-gray-900 mb-2">
                    {condition.name}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {condition.description}
                  </p>

                  {formData.condition === condition.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-primary-bolt-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        // Titre et Description fusionnés
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Titre et description
              </h2>
              <p className="text-gray-600">
                Présentez votre {formData.listingType === "sale" ? "annonce" : "recherche"} de manière attractive
              </p>
            </div>

            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all text-lg"
                  placeholder={
                    formData.listingType === "sale"
                      ? "Ex: BMW 320d excellent état"
                      : "Ex: Recherche BMW 320d"
                  }
                  maxLength={50}
                  data-testid="input-title"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    Un bon titre augmente vos chances de{" "}
                    {formData.listingType === "sale"
                      ? "vente"
                      : "trouver ce que vous cherchez"}
                  </p>
                  <span
                    className={`text-sm ${formData.title.length > 40 ? "text-orange-500" : "text-gray-400"}`}
                  >
                    {formData.title.length}/50
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all resize-y"
                  placeholder={
                    formData.condition === "damaged"
                      ? "Détaillez précisément l'accident, les circonstances, les réparations déjà effectuées, les pièces à remplacer, etc. Plus vous êtes transparent, plus vous inspirerez confiance."
                      : "Décrivez l'état, l'historique, les équipements, les points forts, etc. Soyez précis et détaillé pour attirer les acheteurs."
                  }
                  data-testid="input-description"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {formData.condition === "damaged"
                      ? "Pour un véhicule accidenté, la transparence est essentielle pour établir la confiance."
                      : "Plus votre description est détaillée, plus vous avez de chances d'attirer des acheteurs sérieux."}
                  </p>
                  {formData.description && (
                    <span className="text-sm text-gray-400">
                      {formData.description.length} caractères
                    </span>
                  )}
                </div>
              </div>

              {/* Champ d'immatriculation conditionnel */}
              {needsRegistrationNumber() && formData.listingType === "sale" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro d'immatriculation (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber || ""}
                    onChange={(e) => {
                      updateFormData("registrationNumber", e.target.value.toUpperCase());
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all"
                    placeholder="Ex: AB-123-CD ou AA123BC"
                    maxLength={20}
                    data-testid="input-registration-number"
                  />
                  <div className="mt-2 space-y-2">
                    {/* Boutons pour récupérer les données automatiquement */}
                    {formData.registrationNumber && formData.registrationNumber.trim().length > 0 && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              fetchVehicleData(formData.registrationNumber!)
                            }
                            disabled={vehicleDataLoading}
                            className="flex items-center px-4 py-2 bg-primary-bolt-600 text-white text-sm rounded-lg hover:bg-primary-bolt-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            data-testid="button-auto-fill"
                          >
                            {vehicleDataLoading ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Recherche en cours...
                              </>
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Importer les données du véhicule
                              </>
                            )}
                          </button>
                          
                          {/* Bouton Reset si des champs sont auto-remplis */}
                          {autoFilledFields.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                // Réinitialiser les champs auto-remplis
                                const resetDetails = { ...formData.specificDetails };
                                if (autoFilledFields.includes('Marque')) resetDetails.brand = '';
                                if (autoFilledFields.includes('Modèle')) resetDetails.model = '';
                                if (autoFilledFields.includes('Année')) resetDetails.year = '';
                                if (autoFilledFields.includes('Carburant')) resetDetails.fuelType = '';
                                if (autoFilledFields.includes('Transmission')) resetDetails.transmission = '';
                                if (autoFilledFields.includes('Couleur')) resetDetails.color = '';
                                if (autoFilledFields.includes('Cylindrée')) resetDetails.engineSize = '';
                                if (autoFilledFields.includes('Portes')) resetDetails.doors = '';
                                if (autoFilledFields.includes('CO2')) resetDetails.co2 = '';
                                if (autoFilledFields.includes('Puissance fiscale')) resetDetails.fiscalPower = '';
                                
                                setFormData((prev) => ({
                                  ...prev,
                                  specificDetails: resetDetails,
                                }));
                                setAutoFilledFields([]);
                                
                                toast({
                                  title: "Données réinitialisées",
                                  description: "Les informations importées ont été supprimées",
                                });
                              }}
                              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              data-testid="button-reset-auto-fill"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Réinitialiser ({autoFilledFields.length})
                            </button>
                          )}
                        </div>
                      )}

                    {/* Message de retour */}
                    {vehicleDataMessage && (
                      <div
                        className={`text-sm p-3 rounded-lg ${
                          vehicleDataMessage.startsWith("✅")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : vehicleDataMessage.startsWith("⚠️")
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {vehicleDataMessage}
                      </div>
                    )}

                    <p className="text-sm text-gray-500">
                      Formats acceptés : SIV (AA-123-AA) depuis 2009 ou FNI
                      (1234 AB 56) avant 2009
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 8:
        // Détails spécifiques
        // Ignorer cette étape pour les services - ne pas afficher
        if (isServiceCategory()) {
          return null;
        }
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Détails spécifiques
              </h2>
              <p className="text-gray-600">
                Renseignez les caractéristiques importantes de votre{" "}
                {getSelectedSubcategory()?.name.toLowerCase()}
              </p>
            </div>

            {renderSpecificDetailsFields()}
          </div>
        );

      case 9:
        // OBSOLÈTE - Description fusionnée avec Step 7 (Titre et description)
        // La redirection vers Step 10 est gérée en haut de renderStepContent
        return null;

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Photos de votre {getSelectedSubcategory()?.name.toLowerCase()}
              </h2>
              <p className="text-gray-600">
                Ajoutez des photos de qualité pour attirer plus d'acheteurs
                (maximum 4 photos)
              </p>
            </div>

            <div className="space-y-6">
              {/* Zone de upload */}
              {formData.photos.length < 4 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-bolt-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Glissez vos photos ici
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ou cliquez pour sélectionner des fichiers
                    </p>
                    <div className="bg-primary-bolt-500 text-white px-6 py-2 rounded-lg hover:bg-primary-bolt-600 transition-colors inline-block">
                      Choisir des photos
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">
                    Limite de 4 photos atteinte
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Supprimez une photo pour en ajouter d'autres
                  </p>
                </div>
              )}

              {/* Message incitatif si aucune photo */}
              {formData.photos.length === 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
                  <Camera className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Les annonces avec photos attirent 5× plus de visiteurs
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Ajoutez au moins une image pour maximiser vos chances de
                      vente rapide.
                    </p>
                  </div>
                </div>
              )}

              {/* Aperçu des photos */}
              {formData.photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Photos sélectionnées ({formData.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photoPreviewUrls[index]}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />

                        {/* Bouton pour flouter l'immatriculation */}
                        <button
                          onClick={() => handleBlurPlate(index)}
                          className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 flex items-center space-x-1"
                          title="Flouter l'immatriculation (bientôt disponible)"
                          data-testid={`button-blur-plate-${index}`}
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>Flouter</span>
                        </button>

                        {/* Bouton de suppression */}
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 11:
        // Masquer cette étape pour les annonces de recherche
        if (isSearchListing()) {
          return null;
        }
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Prix de{" "}
                {formData.listingType === "sale" ? "vente" : "budget maximum"}
              </h2>
              <p className="text-gray-600">
                {formData.listingType === "sale"
                  ? `Fixez un prix attractif pour votre ${getSelectedSubcategory()?.name.toLowerCase()}`
                  : `Indiquez votre budget maximum pour votre recherche`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.listingType === "sale"
                  ? "Prix (€) *"
                  : "Budget maximum (€) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) =>
                    updateFormData("price", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all text-lg"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  €
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.listingType === "sale"
                  ? "Consultez des annonces similaires pour fixer un prix compétitif"
                  : "Indiquez le budget maximum que vous êtes prêt à dépenser"}
              </p>
            </div>
          </div>
        );

      case 12:
        // Localisation et Contacts fusionnés
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Localisation et contacts
              </h2>
              <p className="text-gray-600">
                Où se trouve votre annonce et comment vous contacter ?
              </p>
            </div>

            {/* Section Localisation */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">📍</span>
                Localisation
              </h3>
              {(formData.location.city || formData.location.postalCode) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ℹ️ Informations pré-remplies depuis votre profil. Vous
                    pouvez les modifier si nécessaire.
                  </p>
                </div>
              )}
              <AddressInput
                postalCode={formData.location.postalCode}
                city={formData.location.city}
                onPostalCodeChange={(postalCode) => {
                  console.log("Form updating postal code:", postalCode);
                  setFormData((prev) => {
                    const newLocation = { ...prev.location, postalCode };
                    const newData = { ...prev, location: newLocation };
                    console.log(
                      "Direct form update - new location:",
                      newLocation,
                    );
                    console.log("Direct form update - complete data:", newData);
                    return newData;
                  });
                }}
                onCityChange={(city) => {
                  console.log("Form updating city:", city);
                  setFormData((prev) => {
                    const newLocation = { ...prev.location, city };
                    const newData = { ...prev, location: newLocation };
                    console.log(
                      "Direct form update - new location:",
                      newLocation,
                    );
                    console.log("Direct form update - complete data:", newData);
                    return newData;
                  });
                }}
              />
            </div>

            {/* Section Préférences de contact */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">💬</span>
                Préférences de contact
              </h3>
              <p className="text-sm text-gray-600">
                Comment les {formData.listingType === "sale" ? "acheteurs" : "vendeurs"} peuvent-ils vous contacter ?
              </p>

              <div className="space-y-4">
                {/* Téléphone */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Téléphone :</span>{" "}
                    {profile?.phone || "Non renseigné"}
                  </p>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.contact.showPhone}
                      onChange={(e) =>
                        updateFormData("contact", {
                          ...formData.contact,
                          showPhone: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary-bolt-600 border-gray-300 rounded focus:ring-primary-bolt-500"
                      data-testid="checkbox-show-phone"
                    />
                    <span className="text-sm text-gray-700">
                      Afficher mon numéro sur l'annonce
                    </span>
                  </label>
                </div>

                {/* WhatsApp */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">WhatsApp :</span>{" "}
                    {profile?.whatsapp || profile?.phone || "Non renseigné"}
                  </p>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.contact.showWhatsapp}
                      onChange={(e) =>
                        updateFormData("contact", {
                          ...formData.contact,
                          showWhatsapp: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary-bolt-600 border-gray-300 rounded focus:ring-primary-bolt-500"
                      data-testid="checkbox-show-whatsapp"
                    />
                    <span className="text-sm text-gray-700">
                      Afficher mon WhatsApp sur l'annonce
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 13:
        // OBSOLÈTE - Contacts fusionnés avec Step 12
        return null;


      case 9999999: // case obsolète supprimé
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Préférences de contact
              </h2>
              <p className="text-gray-600">
                Comment les{" "}
                {formData.listingType === "sale" ? "acheteurs" : "vendeurs"}{" "}
                peuvent-ils vous contacter ?
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Vos coordonnées sont définies dans votre profil. Vous
                  pouvez choisir par quel canal vous souhaitez être contacté.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Téléphone */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Téléphone :</span>{" "}
                  {profile?.phone || "Non renseigné"}
                </p>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.contact.showPhone}
                    onChange={(e) =>
                      updateFormData("contact", {
                        ...formData.contact,
                        showPhone: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-bolt-600 border-gray-300 rounded focus:ring-primary-bolt-500"
                  />
                  <span className="text-sm text-gray-700">
                    Afficher mon numéro sur l’annonce
                  </span>
                </label>
              </div>

              {/* WhatsApp */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">WhatsApp :</span>{" "}
                  {profile?.whatsapp || profile?.phone || "Non renseigné"}
                </p>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.contact.showWhatsapp}
                    onChange={(e) =>
                      updateFormData("contact", {
                        ...formData.contact,
                        showWhatsapp: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-bolt-600 border-gray-300 rounded focus:ring-primary-bolt-500"
                  />
                  <span className="text-sm text-gray-700">
                    Afficher mon WhatsApp sur l’annonce
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Récapitulatif de votre{" "}
                {formData.listingType === "sale" ? "annonce" : "recherche"}
              </h2>
              <p className="text-gray-600">
                Vérifiez les informations avant de publier votre{" "}
                {formData.listingType === "sale" ? "annonce" : "recherche"}
              </p>
            </div>

            {/* Affichage du récapitulatif */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations générales
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Type
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.listingType === "sale"
                          ? "Vendre"
                          : "Rechercher"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Catégorie
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.category}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Titre
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.title}
                      </dd>
                    </div>
                    {formData.price > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Prix
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {formData.price}€
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Téléphone
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.contact.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        WhatsApp
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.contact.sameAsPhone
                          ? `${formData.contact.phone} (même que téléphone)`
                          : formData.contact.whatsapp || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Localisation
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formData.location.postalCode} {formData.location.city}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.description}
                  </p>
                </div>

                {/* Section équipements sélectionnés */}
                {formData.specificDetails.equipment &&
                  formData.specificDetails.equipment.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Équipements
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formData.specificDetails.equipment.map(
                          (equipment: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                {equipment}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        {formData.specificDetails.equipment.length} équipement
                        {formData.specificDetails.equipment.length > 1
                          ? "s"
                          : ""}{" "}
                        sélectionné
                        {formData.specificDetails.equipment.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  )}

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Photos
                  </h3>
                  {formData.photos.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        {formData.photos.length} photo
                        {formData.photos.length !== 1 ? "s" : ""} ajoutée
                        {formData.photos.length !== 1 ? "s" : ""}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={
                                typeof photo === "string"
                                  ? photo
                                  : URL.createObjectURL(photo)
                              }
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                            {index === 0 && (
                              <div className="absolute top-1 left-1 bg-primary-bolt-500 text-white text-xs px-2 py-1 rounded">
                                Principal
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Aucune photo ajoutée
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 15:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Récapitulatif final
              </h2>
              <p className="text-gray-600">
                Vérifiez les informations avant de publier votre{" "}
                {formData.listingType === "sale" ? "annonce" : "recherche"}
              </p>
            </div>

            <div className="space-y-6">
              {/* Catégorie et sous-catégorie */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Catégorie
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-primary-bolt-100 text-primary-bolt-500 rounded-full text-sm font-medium">
                    {selectedCategory?.name}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-3 py-1 bg-primary-bolt-100 text-primary-bolt-500 rounded-full text-sm font-medium">
                    {getSelectedSubcategory()?.name}
                  </span>
                </div>
              </div>

              {/* Titre et prix */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Titre et prix
                </h3>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {formData.title || "Titre non renseigné"}
                    </h4>
                    {formData.registrationNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Immatriculation:</span>{" "}
                        {formData.registrationNumber}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-bolt-500">
                      {formData.price.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails spécifiques */}
              {Object.keys(formData.specificDetails).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Détails spécifiques
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.specificDetails).map(
                      ([key, value]) => {
                        if (key === "equipment" && Array.isArray(value)) {
                          return (
                            <div key={key} className="md:col-span-2">
                              <span className="font-medium text-gray-900">
                                Équipements:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {value.map(
                                  (equipment: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-primary-bolt-100 text-primary-bolt-700 rounded-md text-sm"
                                    >
                                      {equipment}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (value && value !== "") {
                          const displayKey = (() => {
                            switch (key) {
                              case "brand":
                                return "Marque";
                              case "model":
                                return "Modèle";
                              case "year":
                                return "Année";
                              case "mileage":
                                return "Kilométrage";
                              case "fuelType":
                                return "Carburant";
                              case "transmission":
                                return "Transmission";
                              case "color":
                                return "Couleur";
                              case "doors":
                                return "Portes";
                              case "power":
                                return "Puissance (CV)";
                              case "displacement":
                                return "Cylindrée (cm³)";
                              case "motorcycleType":
                                return "Type de moto";
                              case "licenseType":
                                return "Permis requis";
                              case "length":
                                return "Longueur (m)";
                              case "engineType":
                                return "Type de moteur";
                              case "enginePower":
                                return "Puissance moteur (CV)";
                              case "boatType":
                                return "Type de bateau";
                              case "utilityType":
                                return "Type d'utilitaire";
                              case "gvw":
                                return "PTAC (kg)";
                              case "volume":
                                return "Volume utile (m³)";
                              default:
                                return key;
                            }
                          })();

                          const displayValue = (() => {
                            if (key === "fuelType") {
                              const fuelLabels: Record<string, string> = {
                                gasoline: "Essence",
                                diesel: "Diesel",
                                electric: "Électrique",
                                hybrid: "Hybride",
                              };
                              return fuelLabels[value as string] || value;
                            }
                            if (key === "transmission") {
                              const transmissionLabels: Record<string, string> =
                                {
                                  manual: "Manuelle",
                                  automatic: "Automatique",
                                  "semi-automatic": "Semi-automatique",
                                };
                              return (
                                transmissionLabels[value as string] || value
                              );
                            }
                            return value;
                          })();

                          return (
                            <div key={key}>
                              <span className="font-medium text-gray-900">
                                {displayKey}:
                              </span>
                              <span className="text-gray-700 ml-2">
                                {displayValue}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>
                </div>
              )}

              {/* État général */}
              {formData.condition && needsConditionStep() && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    État général
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-primary-bolt-100 text-primary-bolt-500 rounded-full text-sm font-medium">
                      {
                        VEHICLE_CONDITIONS.find(
                          (c) => c.value === formData.condition,
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {formData.description}
                </p>
              </div>

              {/* Photos */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Photos ({formData.photos.length})
                </h3>
                {formData.photos.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={
                            typeof photo === "string"
                              ? photo
                              : URL.createObjectURL(photo)
                          }
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucune photo ajoutée</p>
                )}
              </div>

              {/* Localisation et contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Localisation
                  </h3>
                  <p className="text-gray-700">
                    {formData.location.postalCode} {formData.location.city}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Téléphone:</span>{" "}
                      {formData.contact.hidePhone
                        ? "Masqué"
                        : formData.contact.phone}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">WhatsApp:</span>{" "}
                      {formData.contact.sameAsPhone
                        ? `${formData.contact.phone} (même que téléphone)`
                        : formData.contact.whatsapp || "Non renseigné"}
                    </p>
                    {formData.contact.email && (
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span>{" "}
                        {formData.contact.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.listingType === "sale"
                  ? "Vente"
                  : formData.listingType === "search"
                    ? "Recherche"
                    : "Déposer une annonce"}
                {formData.listingType && " - Déposer une annonce"}
              </h1>
              <span className="text-sm font-medium text-gray-600">
                Étape {currentStep} sur {totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-32">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Navigation sticky */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => {
              if (currentStep === 13 && showPayment) {
                setShowPayment(false);
              } else {
                prevStepHandler();
              }
            }}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Précédent</span>
          </button>

          {currentStep === 12 ? (
            <button
              onClick={publishListing}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Check className="h-4 w-4" />
              <span>Publier l'annonce</span>
            </button>
          ) : currentStep < totalSteps ? (
            <button
              onClick={nextStepHandler}
              disabled={!canProceed()}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <span>Suivant</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={publishListing}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              Publier l'annonce
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <PublishSuccessModal
        isOpen={showSuccessModal}
        onClose={handleContinueNavigating}
        onNavigateToDashboard={navigateToDashboard}
        onBoostListing={createdVehicle ? handleBoostListing : undefined}
        vehicleId={createdVehicle?.id}
        vehicleTitle={createdVehicle?.title}
        listingType={formData.listingType === "sale" ? "sell" : "search"}
      />

      {createdVehicle && (
        <BoostModal
          isOpen={showBoostModal}
          onClose={() => {
            setShowBoostModal(false);
            if (onSuccess) onSuccess();
          }}
          annonceId={createdVehicle.id}
          annonceTitle={createdVehicle.title}
        />
      )}

      <PlateBlurModal
        isOpen={plateBlurModal.isOpen}
        imageUrl={plateBlurModal.imageUrl}
        onClose={() =>
          setPlateBlurModal({ isOpen: false, photoIndex: -1, imageUrl: "" })
        }
        onConfirm={handleApplyMask}
      />

      <VehicleDataPreviewModal
        isOpen={showVehiclePreview}
        onClose={cancelVehicleDataPreview}
        onConfirm={confirmAndFillVehicleData}
        vehicleData={
          pendingVehicleData
            ? {
                brand: pendingVehicleData.specificDetails.brand,
                model: pendingVehicleData.specificDetails.model,
                year: pendingVehicleData.specificDetails.firstRegistration
                  ? pendingVehicleData.specificDetails.firstRegistration.split('-')[0]
                  : pendingVehicleData.vehicleInfo.year,
                fuelType: pendingVehicleData.specificDetails.fuel,
                transmission: pendingVehicleData.specificDetails.transmission,
                color: pendingVehicleData.specificDetails.color,
                bodyType: pendingVehicleData.specificDetails.bodyType,
                engineSize: pendingVehicleData.specificDetails.engineSize,
                doors: pendingVehicleData.specificDetails.doors,
                co2: pendingVehicleData.specificDetails.co2,
                fiscalPower: pendingVehicleData.specificDetails.fiscalHorsepower,
              }
            : {}
        }
        registrationNumber={pendingRegistrationNumber}
      />
    </div>
  );
};
