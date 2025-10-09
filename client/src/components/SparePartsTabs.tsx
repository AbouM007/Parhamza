import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";
import { VehicleCard } from "./VehicleCard";

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
        "piece-voiture": spareParts.filter(
          (v) => (v.category as string) === "piece-voiture",
        ),
        "piece-utilitaire": spareParts.filter(
          (v) => (v.category as string) === "piece-utilitaire",
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
      id: "piece-voiture" as const,
      label: "Voitures",
      count: categorizedParts["piece-voiture"].length,
    },
    {
      id: "piece-utilitaire" as const,
      label: "Utilitaires",
      count: categorizedParts["piece-utilitaire"].length,
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
            <VehicleCard key={part.id} vehicle={part} onClick={() => onVehicleClick(part)} />
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
