import React, { useState, useMemo } from "react";
import { Vehicle } from "../types";

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
    <div>
      {/* Header avec onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-bolt-500 text-primary-bolt-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Message informatif */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Véhicules accidentés
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Ces véhicules ont subi des dommages. Vérifiez attentivement l'état
              et l'historique avant tout achat.
            </p>
          </div>
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="transition-all duration-300 ease-in-out">
        {categorizedVehicles[activeTab].length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categorizedVehicles[activeTab].map((vehicle, index) => (
              <div
                key={vehicle.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <VehicleCard vehicle={vehicle} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun véhicule trouvé
            </h3>
            <p className="text-gray-600">
              Il n'y a actuellement aucun véhicule accidenté dans cette
              catégorie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
