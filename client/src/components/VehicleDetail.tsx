import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Gauge,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Crown,
  Eye,
  Phone,
  Mail,
  CheckCircle,
  X,
  Send,
  AlertTriangle,
  Wrench,
  Fuel,
  Zap,
  Palette,
  Car,
  Settings,
  Users,
} from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { Vehicle } from "@/types";
import { WhatsAppContact } from "./WhatsAppContact";
import { VehicleCard } from "./VehicleCard";
import { Breadcrumb } from "./Breadcrumb";
import { useApp } from "@/contexts/AppContext";
import { Footer } from "./Footer";
import { ContactSellerModal } from "./ContactSellerModal";
import { ShareModal } from "./ShareModal";
import { useAuth } from "@/contexts/AuthContext";
import { PassionateLabel } from "./PassionateLabel";
import brandIcon from "@/assets/Brand_1752260033631.png";
import { getUserDisplayName } from "@/lib/utils";

// Helper to check if subcategory is a service
const isServiceCategory = (category: string): boolean => {
  const serviceSubcategories = [
    "reparation",
    "remorquage",
    "entretien",
    "autre-service",
  ];
  return serviceSubcategories.includes(category);
};

// Helper to check if subcategory is a spare part
const isSparePart = (category: string): boolean => {
  return category.startsWith("piece-");
};

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onNavigate?: (path: string) => void;
  setCurrentView?: (view: string) => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle,
  onBack,
  onVehicleSelect,
  onNavigate,
  setCurrentView,
}) => {
  const { currentUser, openAuthModal, vehicles } = useApp();
  const { user: authUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [professionalAccount, setProfessionalAccount] = useState<any>(null);
  const [loadingProfessional, setLoadingProfessional] = useState(false);

  // Function to handle navigation from footer links
  const handleFooterNavigation = (view: string) => {
    onBack(); // Close vehicle detail
    if (setCurrentView) {
      setCurrentView(view); // Navigate to requested view
      // Scroll to top after navigation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  // Function to fetch professional account verification status only
  const fetchProfessionalVerification = async (userId: string) => {
    setLoadingProfessional(true);
    try {
      const response = await fetch(`/api/professional-account/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfessionalAccount(data);
      }
    } catch (error) {
      console.error("Error fetching professional verification:", error);
    } finally {
      setLoadingProfessional(false);
    }
  };

  // Scroll to top when vehicle changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [vehicle.id]);

  // Fetch professional verification status if user is professional
  useEffect(() => {
    if (vehicle.user?.type === "professional" && vehicle.user?.id) {
      fetchProfessionalVerification(vehicle.user.id);
    }
  }, [vehicle.user?.id, vehicle.user?.type]);

  // Function to find similar vehicles
  const getSimilarVehicles = (
    currentVehicle: Vehicle,
    limit: number = 4,
  ): Vehicle[] => {
    // Get all vehicles in the same subcategory (excluding current)
    const sameSubcategoryVehicles = vehicles.filter(
      (v) =>
        v.id !== currentVehicle.id && v.category === currentVehicle.category,
    );

    // If no other vehicles in subcategory, return empty array
    if (sameSubcategoryVehicles.length === 0) {
      return [];
    }

    // Sort vehicles by multiple criteria with priority scoring
    const scoredVehicles = sameSubcategoryVehicles.map((v) => {
      let score = 0;

      // Same brand gets highest priority (100 points)
      if (v.brand === currentVehicle.brand) {
        score += 100;
      }

      // Price similarity (0-50 points based on price difference)
      const priceDiff = Math.abs(v.price - currentVehicle.price);
      const maxPriceDiff = Math.max(currentVehicle.price, 10000); // Avoid division by 0
      const priceScore = Math.max(0, 50 - (priceDiff / maxPriceDiff) * 50);
      score += priceScore;

      // Same type gets bonus points (30 points)
      // Note: 'type' property doesn't exist on Vehicle, using listingType instead
      if ((v as any).listingType === (currentVehicle as any).listingType) {
        score += 30;
      }

      // Same condition gets bonus points (20 points)
      if (v.condition === currentVehicle.condition) {
        score += 20;
      }

      // Year similarity (0-20 points)
      if (v.year && currentVehicle.year) {
        const yearDiff = Math.abs(v.year - currentVehicle.year);
        const yearScore = Math.max(0, 20 - yearDiff);
        score += yearScore;
      }

      // Mileage similarity for used vehicles (0-15 points)
      if (
        v.mileage &&
        currentVehicle.mileage &&
        currentVehicle.condition === "used"
      ) {
        const mileageDiff = Math.abs(v.mileage - currentVehicle.mileage);
        const maxMileageDiff = Math.max(currentVehicle.mileage, 50000);
        const mileageScore = Math.max(
          0,
          15 - (mileageDiff / maxMileageDiff) * 15,
        );
        score += mileageScore;
      }

      return { vehicle: v, score };
    });

    // Sort by score (highest first) and return top vehicles
    return scoredVehicles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.vehicle);
  };

  const similarVehicles = getSimilarVehicles(vehicle);

  // Function to find compatible spare parts for damaged vehicles with smart scoring
  const getCompatibleSpareParts = (currentVehicle: Vehicle): Array<{ part: Vehicle; score: number; matchReason: string }> => {
    if (currentVehicle.condition !== "damaged") return [];

    // Precise mapping: vehicle category → compatible spare parts category
    const vehicleToPartsMapping: Record<string, string> = {
      "voiture": "piece-voiture-utilitaire",
      "utilitaire": "piece-voiture-utilitaire",
      "moto": "piece-moto-scooter",
      "scooter": "piece-moto-scooter",
      "quad": "piece-quad",
      "caravane": "piece-caravane-remorque",
      "remorque": "piece-caravane-remorque",
      "jetski": "piece-jetski-bateau",
      "bateau": "piece-jetski-bateau",
      "aerien": "piece-aerien",
    };

    const sparePartsCategory = vehicleToPartsMapping[currentVehicle.category] || "autre-piece";

    // Build search terms from the current vehicle
    const vehicleBrand = currentVehicle.brand.toLowerCase();
    const vehicleModel = currentVehicle.model.toLowerCase();
    const vehicleFullName = `${vehicleBrand} ${vehicleModel}`;

    const scoredParts = vehicles
      .filter((v) => v.category === sparePartsCategory)
      .map((part) => {
        let score = 0;
        let matchReasons: string[] = [];

        // SCORING SYSTEM:
        
        // 1. Compatibility Tags (highest priority) - Check if tags explicitly mention this vehicle
        if (part.compatibilityTags && part.compatibilityTags.length > 0) {
          part.compatibilityTags.forEach((tag) => {
            const tagLower = tag.toLowerCase();
            
            // Exact match with full vehicle name
            if (tagLower === vehicleFullName) {
              score += 15;
              matchReasons.push(tag);
            }
            // Tag contains both brand and model
            else if (tagLower.includes(vehicleBrand) && tagLower.includes(vehicleModel)) {
              score += 12;
              matchReasons.push(tag);
            }
            // Tag contains the model
            else if (tagLower.includes(vehicleModel)) {
              score += 8;
              matchReasons.push(tag);
            }
            // Tag contains the brand
            else if (tagLower.includes(vehicleBrand)) {
              score += 5;
              matchReasons.push(tag);
            }
          });
        }

        // 2. Brand match (important but less than tags)
        if (part.brand.toLowerCase() === vehicleBrand) {
          score += 4;
        }

        // 3. Model mentioned in title
        if (part.title.toLowerCase().includes(vehicleModel)) {
          score += 3;
        }

        // 4. Model mentioned in description
        if (part.description.toLowerCase().includes(vehicleModel)) {
          score += 2;
        }

        // 5. Model mentioned in features
        if (part.features?.some((feature) => feature.toLowerCase().includes(vehicleModel))) {
          score += 2;
        }

        // Only return parts with score > 0 (at least some compatibility)
        if (score > 0) {
          const matchReason = matchReasons.length > 0 
            ? `Compatible : ${matchReasons[0]}` 
            : part.brand === currentVehicle.brand 
              ? `Compatible : ${part.brand}`
              : "Compatible";
          
          return { part, score, matchReason };
        }
        return null;
      })
      .filter((item): item is { part: Vehicle; score: number; matchReason: string } => item !== null)
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .slice(0, 12); // Limit to top 12 results

    return scoredParts;
  };

  const compatiblePartsWithScore = getCompatibleSpareParts(vehicle);
  const compatibleParts = compatiblePartsWithScore.map(item => item.part);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("fr-FR").format(mileage) + " km";
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === vehicle.images.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.images.length - 1 : prev - 1,
    );
  };

  const handleBreadcrumbNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      onBack(); // Fallback to going back
    }
  };

  const handleMessageClick = () => {
    if (authUser || currentUser) {
      setShowContactModal(true);
    } else {
      openAuthModal("login");
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    // Ici on enverrait le message via une API
    console.log("Message envoyé:", {
      from: currentUser?.id,
      to: vehicle.userId,
      vehicleId: vehicle.id,
      message: messageText,
    });

    setMessageText("");
    setShowMessageForm(false);
    // Afficher une confirmation
    alert("Message envoyé avec succès !");
  };
  
  const damageTypes = vehicle.damageDetails?.damageTypes ?? [];
  const mechanicalState = vehicle.damageDetails?.mechanicalState;
  const severity = vehicle.damageDetails?.severity;
  const hasDamageInfo = damageTypes.length > 0 || mechanicalState || severity;

  return (
    <div className="min-h-screen bg-gray-50 relative z-0">
      {/* Breadcrumb */}
      <Breadcrumb vehicle={vehicle} onNavigate={handleBreadcrumbNavigation} />

      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-bolt-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour aux annonces</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {vehicle.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative h-96 bg-gray-200">
                  <img
                    src={vehicle.images[currentImageIndex]}
                    alt={vehicle.title}
                    className="w-full h-full object-cover"
                  />

                  {vehicle.images.length > 1 && (
                    <div>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        ←
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        →
                      </button>
                    </div>
                  )}

                  {/* Premium Badge */}
                  {vehicle.isPremium && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Crown className="h-4 w-4" />
                      <span>Premium</span>
                    </div>
                  )}

                  {/* Favoris et Partage Icons */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <FavoriteButton
                      vehicleId={vehicle.id}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                      size="md"
                    />
                    <button
                      onClick={() => {
                        // Essayer d'utiliser l'API Web Share si disponible
                        const title = `${vehicle.brand} ${vehicle.model} - ${vehicle.price}€`;
                        const url = window.location.href;

                        if (navigator.share) {
                          navigator
                            .share({
                              title: title,
                              text: `Découvrez cette annonce: ${title}`,
                              url: url,
                            })
                            .catch(() => {
                              setShowShareModal(true);
                            });
                        } else {
                          setShowShareModal(true);
                        }
                      }}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                    >
                      <Share2 className="h-5 w-5 text-gray-600 hover:text-blue-500" />
                    </button>
                  </div>

                  {/* Image Counter */}
                  {vehicle.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {vehicle.images.length}
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {vehicle.images.length > 1 && (
                  <div className="p-4 flex space-x-2 overflow-x-auto">
                    {vehicle.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index
                            ? "border-[#0CBFDE]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${vehicle.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Details */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-primary-bolt-600 mb-2">
                    {vehicle.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{vehicle.views} vues</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{vehicle.favorites} favoris</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-bolt-500 mb-1">
                    {formatPrice(vehicle.price)}
                  </div>
                  {vehicle.user?.type === "professional" && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                      Professionnel
                    </span>
                  )}
                </div>
              </div>

              {/* Key Information - Conditional based on category */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {/* Localisation - toujours affichée */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Localisation</div>
                    <div className="font-bold text-gray-900">{vehicle.location}</div>
                  </div>
                </div>

                {/* Marque - pour pièces détachées et véhicules (pas pour services) */}
                {!isServiceCategory(vehicle.category) &&
                  vehicle.brand !== "Non spécifié" && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={brandIcon}
                        alt="Brand icon"
                        className="w-6 h-6 opacity-60"
                      />
                      <div>
                        <div className="text-sm text-gray-500">Marque</div>
                        <div className="font-bold text-gray-900">{vehicle.brand}</div>
                      </div>
                    </div>
                  )}

                {/* Année - pour pièces détachées et véhicules si elle existe */}
                {!isServiceCategory(vehicle.category) && vehicle.year && (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Année</div>
                      <div className="font-bold text-gray-900">{vehicle.year}</div>
                    </div>
                  </div>
                )}

                {/* Kilométrage - uniquement pour véhicules (PAS pour pièces détachées) */}
                {!isServiceCategory(vehicle.category) &&
                  !isSparePart(vehicle.category) &&
                  vehicle.mileage &&
                  vehicle.mileage > 0 && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Gauge className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Kilométrage</div>
                        <div className="font-bold text-gray-900">
                          {formatMileage(vehicle.mileage)}
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Damage Details - Always shown FIRST for damaged vehicles */}
              {vehicle.condition === "damaged" && (
                <div className="mb-8 bg-primary-bolt-50 border-2 border-primary-bolt-300 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-primary-bolt-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-primary-bolt-600" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-bolt-700">
                      Informations sur les dommages
                    </h3>
                  </div>

                  {hasDamageInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Types de dommages */}
                      {damageTypes.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-primary-bolt-200">
                          <div className="text-sm font-bold text-primary-bolt-700 mb-3">
                            Types de dommages
                          </div>
                          <div className="space-y-2">
                            {damageTypes.map((type, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 text-sm text-gray-700"
                              >
                                <span className="w-2 h-2 bg-primary-bolt-500 rounded-full"></span>
                                <span className="capitalize font-medium">
                                  {type.replace(/_/g, " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* État mécanique */}
                      {mechanicalState && (
                        <div className="bg-white rounded-lg p-4 border border-primary-bolt-200">
                          <div className="text-sm font-bold text-primary-bolt-700 mb-3 flex items-center space-x-2">
                            <Wrench className="h-4 w-4" />
                            <span>État mécanique</span>
                          </div>
                          <div className="text-sm text-gray-800 capitalize font-medium">
                            {mechanicalState === "fonctionne"
                              ? "Fonctionne"
                              : mechanicalState === "reparer"
                                ? "À réparer"
                                : mechanicalState === "hs"
                                  ? "Hors service"
                                  : mechanicalState}
                          </div>
                        </div>
                      )}

                      {/* Gravité */}
                      {severity && (
                        <div className="bg-white rounded-lg p-4 border border-primary-bolt-200">
                          <div className="text-sm font-bold text-primary-bolt-700 mb-3">
                            Gravité
                          </div>
                          <div className="text-sm">
                            <span
                              className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${
                                severity === "leger"
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : severity === "moyen"
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                    : "bg-red-100 text-red-700 border border-red-300"
                              }`}
                            >
                              {severity === "leger"
                                ? "Léger"
                                : severity === "moyen"
                                  ? "Moyen"
                                  : "Grave"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white rounded-lg border border-primary-bolt-200">
                      <p className="text-sm text-gray-600 mb-2">
                        Aucune information détaillée disponible pour le moment.
                      </p>
                      {currentUser?.id === vehicle.userId && (
                        <p className="text-sm text-primary-bolt-600 font-medium">
                          💡 Vous pouvez modifier votre annonce pour ajouter ces informations.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Compatibilités - EN PREMIER pour pièces détachées */}
              {vehicle.compatibilityTags && vehicle.compatibilityTags.length > 0 && (
                <div className="mb-8 bg-primary-bolt-50 border-2 border-primary-bolt-300 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-primary-bolt-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-primary-bolt-600" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-bolt-700">
                      Compatibilités
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {vehicle.compatibilityTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white text-primary-bolt-700 border-2 border-primary-bolt-300 hover:bg-primary-bolt-100 transition-colors"
                        data-testid={`tag-compatibility-${index}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Caractéristiques techniques */}
              {!isServiceCategory(vehicle.category) && (vehicle.fuelType || vehicle.transmission || vehicle.color || vehicle.power || vehicle.emissionClass || vehicle.vehicleSpecifications) && (
                <div className="mb-8 bg-gray-50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-primary-bolt-600 mb-5">
                    Caractéristiques techniques
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Carburant */}
                    {vehicle.fuelType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Fuel className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Carburant</div>
                        </div>
                        <div className="font-bold text-gray-900 capitalize ml-6">
                          {vehicle.fuelType === 'gasoline' ? 'Essence' : 
                           vehicle.fuelType === 'diesel' ? 'Diesel' :
                           vehicle.fuelType === 'electric' ? 'Électrique' :
                           vehicle.fuelType === 'hybrid' ? 'Hybride' : vehicle.fuelType}
                        </div>
                      </div>
                    )}
                    
                    {/* Transmission */}
                    {vehicle.transmission && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Settings className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Boîte de vitesses</div>
                        </div>
                        <div className="font-bold text-gray-900 capitalize ml-6">
                          {vehicle.transmission === 'manual' ? 'Manuelle' : 
                           vehicle.transmission === 'automatic' ? 'Automatique' : vehicle.transmission}
                        </div>
                      </div>
                    )}
                    
                    {/* Couleur */}
                    {vehicle.color && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Palette className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Couleur</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.color}</div>
                      </div>
                    )}
                    
                    {/* Puissance */}
                    {vehicle.power && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Puissance</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.power} CH</div>
                      </div>
                    )}

                    {/* Classe d'émissions */}
                    {vehicle.emissionClass && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Norme Euro</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.emissionClass}</div>
                      </div>
                    )}
                    
                    {/* Cylindrée */}
                    {vehicle.vehicleSpecifications?.displacement && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Settings className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Cylindrée</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.displacement} cm³</div>
                      </div>
                    )}
                    
                    {/* Version */}
                    {vehicle.vehicleSpecifications?.version && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Version</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.version}</div>
                      </div>
                    )}
                    
                    {/* Type de moto */}
                    {vehicle.vehicleSpecifications?.motorcycleType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Type de moto</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.motorcycleType}</div>
                      </div>
                    )}
                    
                    {/* Type de véhicule (voiture) */}
                    {vehicle.vehicleSpecifications?.vehicleType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Type de véhicule</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.vehicleType}</div>
                      </div>
                    )}
                    
                    {/* Permis requis */}
                    {vehicle.vehicleSpecifications?.licenseType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Permis requis</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">Permis {vehicle.vehicleSpecifications.licenseType}</div>
                      </div>
                    )}
                    
                    {/* Puissance fiscale */}
                    {vehicle.vehicleSpecifications?.fiscalHorsepower && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Puissance fiscale</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.fiscalHorsepower} CV</div>
                      </div>
                    )}
                    
                    {/* Portes */}
                    {vehicle.vehicleSpecifications?.doors && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Portes</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.doors}</div>
                      </div>
                    )}

                    {/* Sièges */}
                    {vehicle.vehicleSpecifications?.seats && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Places</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.seats}</div>
                      </div>
                    )}
                    
                    {/* Sellerie */}
                    {vehicle.vehicleSpecifications?.upholstery && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Settings className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Sellerie</div>
                        </div>
                        <div className="font-bold text-gray-900 capitalize ml-6">{vehicle.vehicleSpecifications.upholstery}</div>
                      </div>
                    )}

                    {/* Volume (utilitaire) */}
                    {vehicle.vehicleSpecifications?.volume && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Volume de chargement</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.volume} m³</div>
                      </div>
                    )}

                    {/* Charge utile (utilitaire) */}
                    {vehicle.vehicleSpecifications?.payload && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Charge utile</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.payload} kg</div>
                      </div>
                    )}

                    {/* Poids maximum (caravane/remorque) */}
                    {vehicle.vehicleSpecifications?.maxWeight && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Poids maximum</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.maxWeight} kg</div>
                      </div>
                    )}

                    {/* Poids à vide */}
                    {vehicle.vehicleSpecifications?.emptyWeight && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Poids à vide</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.emptyWeight} kg</div>
                      </div>
                    )}

                    {/* Dimensions */}
                    {vehicle.vehicleSpecifications?.dimensions && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Dimensions</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.dimensions}</div>
                      </div>
                    )}

                    {/* Type de jetski */}
                    {vehicle.vehicleSpecifications?.jetskiType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Type de jet-ski</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.jetskiType}</div>
                      </div>
                    )}

                    {/* Heures d'utilisation */}
                    {vehicle.vehicleSpecifications?.usageHours && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Gauge className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Heures d'utilisation</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.usageHours}h</div>
                      </div>
                    )}

                    {/* Type de remorque */}
                    {vehicle.vehicleSpecifications?.trailerType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Type de remorque</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.trailerType}</div>
                      </div>
                    )}

                    {/* Type d'utilitaire */}
                    {vehicle.vehicleSpecifications?.utilityType && (
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="h-4 w-4 text-primary-bolt-500" />
                          <div className="text-sm text-gray-500">Type d'utilitaire</div>
                        </div>
                        <div className="font-bold text-gray-900 ml-6">{vehicle.vehicleSpecifications.utilityType}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-8 bg-gray-50 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-primary-bolt-600 mb-5">
                    Équipements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-bolt-50 text-primary-bolt-700 border border-primary-bolt-200 rounded-full hover:bg-primary-bolt-100 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-8 bg-gray-50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-primary-bolt-600 mb-5">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                  {vehicle.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Contact and Actions */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center overflow-hidden">
                  {vehicle.user?.type === "professional" &&
                  vehicle.user?.companyLogo ? (
                    <img
                      src={vehicle.user.companyLogo}
                      alt={getUserDisplayName(vehicle.user)}
                      className="w-full h-full object-cover"
                    />
                  ) : vehicle.user?.avatar ? (
                    <img
                      src={vehicle.user.avatar}
                      alt={getUserDisplayName(vehicle.user)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#0CBFDE] font-semibold text-lg">
                      {getUserDisplayName(vehicle.user).charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  {/* Nom affiché selon le type d'utilisateur */}
                  <h3 className="font-semibold text-gray-900">
                    {getUserDisplayName(vehicle.user)}
                  </h3>

                  {/* Nom commercial pour les pros - cliquable */}
                  {vehicle.user?.type === "professional" &&
                    vehicle.user?.companyName &&
                    vehicle.user?.id && (
                      <button
                        onClick={() =>
                          window.open(`/pro/${vehicle.user?.id}`, "_blank")
                        }
                        className="text-[#0CBFDE] hover:text-[#0CBFDE]/80 font-medium text-sm flex items-center space-x-1 mt-1 transition-colors"
                      >
                        <span>{vehicle.user.companyName}</span>
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </button>
                    )}

                  {/* Badge PRO + statut vérifié pour les professionnels uniquement */}
                  {vehicle.user?.type === "professional" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded">
                        PRO
                      </span>
                      {professionalAccount?.is_verified && (
                        <div className="flex items-center space-x-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Vérifié</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Label Passionné pour les particuliers avec abonnement */}
                  {vehicle.user?.type === "individual" && (
                    <div className="mt-2">
                      <PassionateLabel
                        userId={vehicle.userId}
                        userType={vehicle.user?.type}
                        variant="full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                {/* Bouton téléphone - Masqué si hidePhone = true */}
                {!vehicle.hidePhone && (
                  <>
                    <button
                      onClick={() => setShowContactInfo(!showContactInfo)}
                      className="w-full bg-primary-bolt-500 text-white py-3 px-4 rounded-xl hover:bg-primary-bolt-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                    >
                      <Phone className="h-5 w-5" />
                      <span>Voir le téléphone</span>
                    </button>

                    {showContactInfo &&
                      (vehicle.contactPhone || vehicle.user?.phone) && (
                        <div className="p-3 bg-primary-bolt-50 rounded-xl text-center">
                          <a
                            href={`tel:${vehicle.contactPhone || vehicle.user?.phone}`}
                            className="text-lg font-semibold text-primary-bolt-500 hover:text-primary-bolt-600"
                          >
                            {vehicle.contactPhone || vehicle.user?.phone}
                          </a>
                        </div>
                      )}
                  </>
                )}

                {/* WhatsApp Button - Mobile Only - Masqué si hideWhatsapp = true */}
                {!vehicle.hideWhatsapp && (vehicle.contactWhatsapp || vehicle.user?.whatsapp) && (
                  <button
                    onClick={() => {
                      const whatsappNumber =
                        vehicle.contactWhatsapp || vehicle.user?.whatsapp;
                      const cleanNumber = whatsappNumber!
                        .replace(/[\s\-\(\)]/g, "")
                        .replace(/^\+/, "");
                      const message = `Bonjour, je suis intéressé par votre annonce ${vehicle.title}.`;
                      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, "_blank");
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl transition-colors font-semibold flex items-center justify-center space-x-2 md:hidden"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    <span>Contacter sur WhatsApp</span>
                  </button>
                )}

                {/* Bouton message - Masqué si hideMessages = true */}
                {!vehicle.hideMessages && (
                  <button
                    onClick={handleMessageClick}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Envoyer un message</span>
                  </button>
                )}

                {/* Lien vers boutique professionnelle */}
                {vehicle.user?.type === "professional" &&
                  vehicle.user?.companyName && (
                    <button
                      onClick={() => {
                        // Naviguer vers la boutique professionnelle
                        const userId = vehicle.user?.id;
                        if (userId) {
                          window.open(`/pro/${userId}`, "_blank");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h2v10z" />
                      </svg>
                      <span>Voir la boutique</span>
                    </button>
                  )}
              </div>
            </div>

            {/* WhatsApp Contact Component - Desktop/Tablet Only - Masqué si hideWhatsapp = true */}
            {!vehicle.hideWhatsapp && (vehicle.contactWhatsapp || vehicle.user?.whatsapp) && (
              <div className="hidden md:block">
                <WhatsAppContact
                  whatsappNumber={
                    vehicle.contactWhatsapp || vehicle.user?.whatsapp || ""
                  }
                  listingTitle={vehicle.title}
                  ownerName={vehicle.user?.name || ""}
                />
              </div>
            )}

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-semibold text-yellow-800 mb-3">
                🛡️ Conseils de sécurité
              </h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Rencontrez le vendeur en personne</li>
                <li>• Inspectez le véhicule avant l'achat</li>
                <li>• Vérifiez les papiers du véhicule</li>
                <li>• Méfiez-vous des prix trop attractifs</li>
                <li>• Préférez un paiement sécurisé</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compatible Spare Parts Section - Only for damaged vehicles */}
        {compatibleParts.length > 0 && vehicle.condition === "damaged" && (
          <div className="mt-12">
            <div className="flex items-center mb-6">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pièces détachées compatibles proposées sur le site
                </h2>
                <p className="text-gray-600 mt-1">
                  Pièces disponibles compatibles avec ce véhicule
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compatiblePartsWithScore.map(({ part, score, matchReason }) => (
                <div
                  key={part.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate to the spare part listing
                    window.open(`/vehicle/${part.id}`, '_blank');
                  }}
                >
                  {/* Compatibility Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {matchReason}
                    </span>
                  </div>

                  <h3 className="font-semibold text-base text-gray-900 mb-2">
                    {part.title}
                  </h3>

                  <div className="text-xl font-bold text-primary-bolt-600 mb-2">
                    {formatPrice(part.price)}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{part.location}</span>
                  </div>

                  <button
                    onClick={() => onVehicleSelect?.(part)}
                    className="w-full bg-primary-bolt-500 text-white px-4 py-2 rounded-lg hover:bg-primary-bolt-600 transition-colors text-sm font-medium"
                  >
                    Voir l'annonce
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Products Section */}
        {similarVehicles.length > 0 && (
          <div className="mt-12 mb-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary-bolt-600 mb-3">
                Annonces similaires
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-300 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarVehicles.slice(0, 3).map((similarVehicle) => (
                <VehicleCard
                  key={similarVehicle.id}
                  vehicle={similarVehicle}
                  onClick={() => onVehicleSelect?.(similarVehicle)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Form Modal */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Envoyer un message
              </h3>
              <button
                onClick={() => setShowMessageForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Message à{" "}
                <span className="font-semibold">{vehicle.user?.name}</span>{" "}
                concernant :
              </p>
              <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                {vehicle.title}
              </p>
            </div>

            <div className="mb-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tapez votre message ici..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {messageText.length}/500 caractères
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMessageForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="flex-1 px-4 py-2 bg-primary-bolt-500 text-white rounded-lg hover:bg-primary-bolt-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        vehicle={{
          id: vehicle.id,
          title: vehicle.title,
          price: vehicle.price,
          user_id: vehicle.userId,
        }}
        currentUserId={authUser?.id || currentUser?.id}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${vehicle.brand} ${vehicle.model} - ${vehicle.price}€`}
        url={window.location.href}
      />

      {/* Footer with custom navigation handler */}
      <Footer setCurrentView={handleFooterNavigation} />
    </div>
  );
};
