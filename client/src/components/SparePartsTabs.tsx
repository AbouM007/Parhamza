import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";

interface SparePartsTabsProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const SparePartsTabs: React.FC<SparePartsTabsProps> = ({
  vehicles,
  onVehicleClick,
}) => {
  const [activeTab, setActiveTab] =
    useState<keyof typeof categorizedParts>("tous");

  // Grouper les pièces détachées par catégorie
  const categorizedParts = useMemo(
    () => {
      // Filtrer uniquement les pièces détachées (catégories commençant par "piece-" ou égales à "autre-piece")
      const spareParts = vehicles.filter(
        (v) => (v.category as string).startsWith("piece-") || v.category === "autre-piece"
      );
      
      return {
        tous: spareParts,
        "piece-voiture-utilitaire": spareParts.filter(
          (v) => (v.category as string) === "piece-voiture-utilitaire",
        ),
        "piece-moto-scooter": spareParts.filter(
          (v) => (v.category as string) === "piece-moto-scooter",
        ),
        "piece-quad": spareParts.filter((v) => (v.category as string) === "piece-quad"),
        "piece-caravane-remorque": spareParts.filter(
          (v) => (v.category as string) === "piece-caravane-remorque",
        ),
        "piece-jetski-bateau": spareParts.filter(
          (v) => (v.category as string) === "piece-jetski-bateau",
        ),
        "piece-aerien": spareParts.filter((v) => (v.category as string) === "piece-aerien"),
        "autre-piece": spareParts.filter((v) => (v.category as string) === "autre-piece"),
      };
    },
    [vehicles],
  );

  const tabs = [
    {
      id: "tous" as const,
      label: "Toutes",
      count: categorizedParts.tous.length,
    },
    {
      id: "piece-voiture-utilitaire" as const,
      label: "Voitures & Utilitaires",
      count: categorizedParts["piece-voiture-utilitaire"].length,
    },
    {
      id: "piece-moto-scooter" as const,
      label: "Motos & Scooters",
      count: categorizedParts["piece-moto-scooter"].length,
    },
    {
      id: "piece-quad" as const,
      label: "Quads",
      count: categorizedParts["piece-quad"].length,
    },
    {
      id: "piece-caravane-remorque" as const,
      label: "Caravanes & Remorques",
      count: categorizedParts["piece-caravane-remorque"].length,
    },
    {
      id: "piece-jetski-bateau" as const,
      label: "Jetskis & Bateaux",
      count: categorizedParts["piece-jetski-bateau"].length,
    },
    {
      id: "piece-aerien" as const,
      label: "Aérien",
      count: categorizedParts["piece-aerien"].length,
    },
    {
      id: "autre-piece" as const,
      label: "Autres pièces",
      count: categorizedParts["autre-piece"].length,
    },
  ].filter((tab) => tab.count > 0); // Masquer les onglets vides

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const SparePartCard: React.FC<{ part: Vehicle }> = ({ part }) => (
    <div
      onClick={() => onVehicleClick(part)}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
      data-testid={`card-spare-part-${part.id}`}
    >
      <div className="relative">
        {part.images && part.images.length > 0 ? (
          <img
            src={part.images[0]}
            alt={part.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Aucune image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {part.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary-bolt-600">
            {formatPrice(part.price)}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {part.brand && <p className="font-medium">{part.brand}</p>}
          {part.location && <p>📍 {part.location}</p>}
        </div>

        {/* Tags de compatibilité */}
        {part.compatibilityTags && part.compatibilityTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Compatible avec :</p>
            <div className="flex flex-wrap gap-1">
              {part.compatibilityTags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {tag}
                </span>
              ))}
              {part.compatibilityTags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                  +{part.compatibilityTags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-primary-bolt-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorizedParts[activeTab].length > 0 ? (
          categorizedParts[activeTab].map((part) => (
            <SparePartCard key={part.id} part={part} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucune pièce détachée disponible dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
