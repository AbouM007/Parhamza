import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => (
    <div
      onClick={() => onVehicleClick(vehicle)}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      <div className="relative">
        {vehicle.images && vehicle.images.length > 0 ? (
          <img
            src={vehicle.images[0]}
            alt={vehicle.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Aucune image</span>
          </div>
        )}

        {/* Badge "Accidenté" */}
        <div className="absolute top-3 left-3">
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Accidenté
          </span>
        </div>

        {/* Badge catégorie */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
            {vehicle.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {vehicle.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary-bolt-600">
            {formatPrice(vehicle.price)}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {vehicle.brand && vehicle.model && (
            <p>
              {vehicle.brand} {vehicle.model}
            </p>
          )}
          {vehicle.year && <p>{vehicle.year}</p>}
          {vehicle.mileage && <p>{vehicle.mileage.toLocaleString()} km</p>}
          {vehicle.location && <p>📍 {vehicle.location}</p>}
        </div>
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
                ? "bg-orange-500 text-white shadow-md"
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
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
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
