import React, { useState, useMemo } from "react";
import { Filter, X, ChevronDown, RotateCcw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { brands, fuelTypes, conditions, categories, carModelsByBrand, brandsByVehicleType } from "@/utils/mockData";
import { VEHICLE_TYPES, TRANSMISSION_TYPES, SERVICE_TYPES, PART_CATEGORIES } from "@/data/vehicle";

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  isOpen,
  onClose,
}) => {
  const { searchFilters, setSearchFilters, vehicles } = useApp();
  const [localFilters, setLocalFilters] = useState(searchFilters);
  const [allFranceChecked, setAllFranceChecked] = useState(false);

  // Mapping des catégories principales vers sous-catégories
  const categoryMapping = {
    "voiture-utilitaire": {
      label: "Voitures - Utilitaires",
      subcategories: [
        { id: "voiture", label: "Voitures" },
        { id: "utilitaire", label: "Utilitaires" },
        { id: "caravane", label: "Caravanes" },
        { id: "remorque", label: "Remorques" },
      ],
    },
    "moto-scooter-quad": {
      label: "Motos, Scooters, Quads",
      subcategories: [
        { id: "moto", label: "Motos" },
        { id: "scooter", label: "Scooters" },
        { id: "quad", label: "Quads" },
      ],
    },
    "nautisme-sport-aerien": {
      label: "Nautisme, Sport et Plein air",
      subcategories: [
        { id: "bateau", label: "Bateaux" },
        { id: "jetski", label: "Jet-skis" },
        { id: "aerien", label: "Aérien" },
      ],
    },
    services: {
      label: "Services",
      subcategories: [
        { id: "reparation", label: "Réparation" },
        { id: "remorquage", label: "Remorquage" },
        { id: "entretien", label: "Entretien" },
        { id: "autre-service", label: "Autres services" },
      ],
    },
    pieces: {
      label: "Pièces détachées",
      subcategories: [
        { id: "piece-voiture", label: "Pièces voiture" },
        { id: "piece-moto", label: "Pièces moto" },
        { id: "autre-piece", label: "Autres pièces" },
      ],
    },
  };

  // Déterminer les sous-catégories disponibles selon la catégorie principale active
  const availableSubcategories = useMemo(() => {
    if (!searchFilters.category) return [];

    // Si c'est une catégorie principale, montrer ses sous-catégories
    if (
      categoryMapping[searchFilters.category as keyof typeof categoryMapping]
    ) {
      return categoryMapping[
        searchFilters.category as keyof typeof categoryMapping
      ].subcategories;
    }

    // Si c'est déjà une sous-catégorie, ne pas afficher de sous-catégories
    // (pas de "Type spécifique" si on est déjà dans une sous-catégorie)
    return [];
  }, [searchFilters.category]);

  // Obtenir les marques disponibles selon la catégorie active et la sous-catégorie sélectionnée
  const availableBrands = useMemo(() => {
    if (!searchFilters.category) return brands;

    // Obtenir les sous-catégories concernées
    let relevantSubcategories: string[] = [];

    // Si une sous-catégorie spécifique est sélectionnée dans les filtres locaux, l'utiliser
    if (localFilters.subcategory) {
      relevantSubcategories = [localFilters.subcategory];
    } else if (
      categoryMapping[searchFilters.category as keyof typeof categoryMapping]
    ) {
      // Sinon, utiliser toutes les sous-catégories de la catégorie principale
      relevantSubcategories = categoryMapping[
        searchFilters.category as keyof typeof categoryMapping
      ].subcategories.map((sub) => sub.id);
    } else {
      // Sous-catégorie directe
      relevantSubcategories = [searchFilters.category];
    }

    // Filtrer les véhicules et extraire les marques uniques
    const categoryVehicles = vehicles.filter((vehicle) =>
      relevantSubcategories.includes(vehicle.category),
    );

    const uniqueBrands = Array.from(
      new Set(
        categoryVehicles
          .map((vehicle) => vehicle.brand)
          .filter((brand) => !brand.includes(",")), // Exclure les marques avec plusieurs noms (ex: "Honda, Yamaha, Kawasaki")
      ),
    ).sort();

    return uniqueBrands;
  }, [searchFilters.category, localFilters.subcategory, vehicles]);

  // Obtenir les modèles disponibles selon la marque sélectionnée
  const availableModels = useMemo(() => {
    if (!localFilters.brand) return [];

    // Chercher dans carModelsByBrand d'abord
    if (carModelsByBrand[localFilters.brand as keyof typeof carModelsByBrand]) {
      return carModelsByBrand[localFilters.brand as keyof typeof carModelsByBrand];
    }

    // Sinon, extraire les modèles des véhicules existants
    const brandVehicles = vehicles.filter(
      (vehicle) => vehicle.brand === localFilters.brand
    );
    return Array.from(new Set(brandVehicles.map((v) => v.model))).sort();
  }, [localFilters.brand, vehicles]);

  // Fonction pour déterminer quels filtres afficher selon la catégorie/sous-catégorie
  const getVisibleFilters = useMemo(() => {
    const subcategory = localFilters.subcategory || searchFilters.category;
    
    return {
      // Filtres communs à tous
      price: true,
      location: true,
      brand: true,
      model: true,
      
      // Filtres pour véhicules (voiture, moto, utilitaire, etc.)
      year: !["reparation", "remorquage", "entretien", "autre-service"].includes(subcategory || "") &&
            !subcategory?.startsWith("piece-"),
      mileage: ["voiture", "utilitaire", "caravane", "remorque", "moto", "scooter", "quad"].includes(subcategory || ""),
      fuelType: ["voiture", "utilitaire", "caravane", "moto", "scooter"].includes(subcategory || ""),
      transmission: ["voiture", "utilitaire", "caravane"].includes(subcategory || ""),
      condition: !subcategory?.startsWith("piece-") && 
                 !["reparation", "remorquage", "entretien", "autre-service"].includes(subcategory || ""),
      
      // Filtres spécifiques motos/scooters
      engineSize: ["moto", "scooter"].includes(subcategory || ""),
      vehicleType: ["voiture", "utilitaire", "moto", "scooter", "quad", "bateau", "jetski", "aerien"].includes(subcategory || ""),
      
      // Filtres spécifiques bateaux
      length: ["bateau"].includes(subcategory || ""),
      
      // Filtres spécifiques services
      serviceType: ["reparation", "remorquage", "entretien", "autre-service"].includes(subcategory || ""),
      serviceZone: ["reparation", "remorquage", "entretien", "autre-service"].includes(subcategory || ""),
      
      // Filtres spécifiques pièces détachées
      partCategory: subcategory?.startsWith("piece-") || subcategory === "autre-piece",
    };
  }, [localFilters.subcategory, searchFilters.category]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };

    // Si on change de sous-catégorie, réinitialiser la marque si elle n'est plus disponible
    if (key === "subcategory") {
      // Recalculer les marques disponibles pour la nouvelle sous-catégorie
      const newRelevantSubcategories = value
        ? [value]
        : categoryMapping[
            searchFilters.category as keyof typeof categoryMapping
          ]?.subcategories.map((sub) => sub.id) || [];

      const newCategoryVehicles = vehicles.filter((vehicle) =>
        newRelevantSubcategories.includes(vehicle.category),
      );

      const newAvailableBrands = Array.from(
        new Set(
          newCategoryVehicles
            .map((vehicle) => vehicle.brand)
            .filter((brand) => !brand.includes(",")), // Exclure les marques avec plusieurs noms
        ),
      );

      // Si la marque actuellement sélectionnée n'est plus disponible, la réinitialiser
      if (
        localFilters.brand &&
        !newAvailableBrands.includes(localFilters.brand)
      ) {
        newFilters.brand = undefined;
      }
    }

    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    setSearchFilters(localFilters);
    onClose();
  };

  const clearFilters = () => {
    // Conserver la catégorie d'origine lors de l'effacement
    // Qu'elle soit une catégorie principale ou une sous-catégorie directe
    const clearedFilters = searchFilters.category
      ? { category: searchFilters.category }
      : {};
    setLocalFilters(clearedFilters);
    setSearchFilters(clearedFilters);
    setAllFranceChecked(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Filter className="h-6 w-6 text-primary-bolt-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Filtres de recherche
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters Content */}
        <div className="p-6 space-y-6">
          {/* Current Category Display */}
          {searchFilters.category && (
            <div className="bg-primary-bolt-50 border border-primary-bolt-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-primary-bolt-700 mb-2">
                Catégorie actuelle
              </h3>
              <p className="text-primary-bolt-600">
                {categoryMapping[
                  searchFilters.category as keyof typeof categoryMapping
                ]?.label || searchFilters.category}
              </p>
            </div>
          )}

          {/* Subcategory and Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sous-catégories dynamiques */}
            {availableSubcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type spécifique
                </label>
                <select
                  value={localFilters.subcategory || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "subcategory",
                      e.target.value || undefined,
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous types</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.brand && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque
                </label>
                <select
                  value={localFilters.brand || ""}
                  onChange={(e) =>
                    handleFilterChange("brand", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Toutes marques</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.model && availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle
                </label>
                <select
                  value={localFilters.model || ""}
                  onChange={(e) =>
                    handleFilterChange("model", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                  disabled={!localFilters.brand}
                >
                  <option value="">Tous modèles</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Prix min"
                value={localFilters.priceFrom || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "priceFrom",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
              />
              <input
                type="number"
                placeholder="Prix max"
                value={localFilters.priceTo || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "priceTo",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
              />
            </div>
          </div>

          {/* Year Range */}
          {getVisibleFilters.year && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Année min"
                  value={localFilters.yearFrom || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "yearFrom",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
                <input
                  type="number"
                  placeholder="Année max"
                  value={localFilters.yearTo || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "yearTo",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
              </div>
            </div>
          )}

          {/* Mileage Range */}
          {getVisibleFilters.mileage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilométrage
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Km min"
                  value={localFilters.mileageFrom || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "mileageFrom",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
                <input
                  type="number"
                  placeholder="Km max"
                  value={localFilters.mileageTo || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "mileageTo",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
              </div>
            </div>
          )}

          {/* Fuel Type, Condition, Transmission, and other specific filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getVisibleFilters.fuelType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carburant
                </label>
                <select
                  value={localFilters.fuelType || ""}
                  onChange={(e) =>
                    handleFilterChange("fuelType", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous carburants</option>
                  {fuelTypes.map((fuel) => (
                    <option key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.transmission && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boîte de vitesses
                </label>
                <select
                  value={localFilters.transmission || ""}
                  onChange={(e) =>
                    handleFilterChange("transmission", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Toutes</option>
                  {TRANSMISSION_TYPES.map((trans) => (
                    <option key={trans.value} value={trans.value}>
                      {trans.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.condition && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État
                </label>
                <select
                  value={localFilters.condition || ""}
                  onChange={(e) =>
                    handleFilterChange("condition", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous états</option>
                  {conditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.engineSize && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cylindrée (cm³)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 125, 600, 1000"
                  value={localFilters.engineSize || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "engineSize",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
              </div>
            )}

            {getVisibleFilters.vehicleType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de véhicule
                </label>
                <select
                  value={localFilters.vehicleType || ""}
                  onChange={(e) =>
                    handleFilterChange("vehicleType", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous types</option>
                  {(() => {
                    const subcategory = localFilters.subcategory || searchFilters.category;
                    const typeKey = subcategory === "moto" ? "motorcycle" : 
                                   subcategory === "voiture" ? "car" :
                                   subcategory === "utilitaire" ? "utility" :
                                   subcategory === "bateau" ? "boat" :
                                   subcategory === "jetski" ? "jetski" :
                                   subcategory === "aerien" ? "aircraft" :
                                   subcategory === "quad" ? "quad" :
                                   subcategory === "scooter" ? "scooter" : null;
                    
                    if (!typeKey || !VEHICLE_TYPES[typeKey as keyof typeof VEHICLE_TYPES]) return null;
                    
                    return VEHICLE_TYPES[typeKey as keyof typeof VEHICLE_TYPES].map((type: string) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            )}

            {getVisibleFilters.length && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur (m)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 6.5"
                  step="0.1"
                  value={localFilters.length || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "length",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
              </div>
            )}

            {getVisibleFilters.serviceType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de service
                </label>
                <select
                  value={localFilters.serviceType || ""}
                  onChange={(e) =>
                    handleFilterChange("serviceType", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous services</option>
                  {SERVICE_TYPES.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {getVisibleFilters.serviceZone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone d'intervention
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50km, Région Parisienne..."
                  value={localFilters.serviceZone || ""}
                  onChange={(e) =>
                    handleFilterChange("serviceZone", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                />
              </div>
            )}

            {getVisibleFilters.partCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de pièce
                </label>
                <select
                  value={localFilters.partCategory || ""}
                  onChange={(e) =>
                    handleFilterChange("partCategory", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500"
                >
                  <option value="">Tous types</option>
                  {PART_CATEGORIES.map((part) => (
                    <option key={part} value={part}>
                      {part}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allFrance"
                  checked={allFranceChecked}
                  onChange={(e) => {
                    setAllFranceChecked(e.target.checked);
                    if (e.target.checked) {
                      handleFilterChange("location", undefined);
                    }
                  }}
                  className="h-4 w-4 text-primary-bolt-600 focus:ring-primary-bolt-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="allFrance"
                  className="ml-2 text-sm text-gray-700"
                >
                  Toute la France
                </label>
              </div>
              <input
                type="text"
                placeholder="Ville, département, région..."
                value={localFilters.location || ""}
                onChange={(e) => {
                  handleFilterChange("location", e.target.value || undefined);
                  // Décocher "Toute la France" si l'utilisateur tape quelque chose
                  if (e.target.value) {
                    setAllFranceChecked(false);
                  }
                }}
                disabled={allFranceChecked}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 ${
                  allFranceChecked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-6 py-2 text-orange-700 hover:text-orange-900 hover:bg-orange-50 font-medium transition-all rounded-lg"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Effacer les filtres</span>
          </button>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-primary-bolt-500 text-white rounded-xl hover:bg-primary-bolt-600 transition-colors font-medium"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
