import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";
import { VehicleCard as VehicleCardComponent } from "./VehicleCard";

interface DamagedVehiclesTabsProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const DamagedVehiclesTabs: React.FC<DamagedVehiclesTabsProps> = ({
  vehicles,
  onVehicleClick,
}) => {
  const [activeTab, setActiveTab] =
    useState<keyof typeof categorizedVehicles>("tous");

  // Grouper les véhicules par catégorie
  const categorizedVehicles = useMemo(
    () => ({
      tous: vehicles,
      voitures: vehicles.filter((v) =>
        ["voiture", "utilitaire", "caravane", "remorque"].includes(v.category),
      ),
      motos: vehicles.filter((v) =>
        ["moto", "scooter", "quad"].includes(v.category),
      ),
      nautisme: vehicles.filter((v) =>
        ["bateau", "jetski"].includes(v.category),
      ),
      autres: vehicles.filter(
        (v) =>
          ![
            "voiture",
            "utilitaire",
            "caravane",
            "remorque",
            "moto",
            "scooter",
            "quad",
            "bateau",
            "jetski",
          ].includes(v.category),
      ),
    }),
    [vehicles],
  );

  const tabs = [
    {
      id: "tous" as const,
      label: "Tous",
      count: categorizedVehicles.tous.length,
    },
    {
      id: "voitures" as const,
      label: "Voitures & Utilitaires",
      count: categorizedVehicles.voitures.length,
    },
    {
      id: "motos" as const,
      label: "Motos & Scooters",
      count: categorizedVehicles.motos.length,
    },
    {
      id: "nautisme" as const,
      label: "Nautisme",
      count: categorizedVehicles.nautisme.length,
    },
    {
      id: "autres" as const,
      label: "Autres",
      count: categorizedVehicles.autres.length,
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
        {categorizedVehicles[activeTab].length > 0 ? (
          categorizedVehicles[activeTab].map((vehicle) => (
            <VehicleCardComponent key={vehicle.id} vehicle={vehicle} onClick={() => onVehicleClick(vehicle)} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun véhicule accidenté disponible dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
