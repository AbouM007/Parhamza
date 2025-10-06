import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";

interface ServicesTabsProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const ServicesTabs: React.FC<ServicesTabsProps> = ({
  vehicles,
  onVehicleClick,
}) => {
  const [activeTab, setActiveTab] =
    useState<keyof typeof categorizedServices>("tous");

  const categorizedServices = useMemo(
    () => {
      const services = vehicles.filter(
        (v) => 
          v.category === "reparation" ||
          v.category === "remorquage" ||
          v.category === "entretien" ||
          v.category === "autre-service"
      );
      
      return {
        tous: services,
        reparation: services.filter((v) => v.category === "reparation"),
        remorquage: services.filter((v) => v.category === "remorquage"),
        entretien: services.filter((v) => v.category === "entretien"),
        "autre-service": services.filter((v) => v.category === "autre-service"),
      };
    },
    [vehicles],
  );

  const tabs = [
    {
      id: "tous" as const,
      label: "Tous",
      count: categorizedServices.tous.length,
    },
    {
      id: "reparation" as const,
      label: "Réparation",
      count: categorizedServices.reparation.length,
    },
    {
      id: "remorquage" as const,
      label: "Remorquage",
      count: categorizedServices.remorquage.length,
    },
    {
      id: "entretien" as const,
      label: "Entretien",
      count: categorizedServices.entretien.length,
    },
    {
      id: "autre-service" as const,
      label: "Autres services",
      count: categorizedServices["autre-service"].length,
    },
  ].filter((tab) => tab.count > 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const ServiceCard: React.FC<{ service: Vehicle }> = ({ service }) => (
    <div
      onClick={() => onVehicleClick(service)}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
      data-testid={`card-service-${service.id}`}
    >
      <div className="relative">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Aucune image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {service.title}
        </h3>

        {service.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-bolt-600">
            {formatPrice(service.price)}
          </span>
          {service.location && (
            <span className="text-sm text-gray-500">{service.location}</span>
          )}
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
        {categorizedServices[activeTab].length > 0 ? (
          categorizedServices[activeTab].map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun service disponible dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
