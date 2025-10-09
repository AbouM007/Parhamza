import React, { useState, useMemo } from "react";
import { Vehicle } from "@/types";
import { VehicleCard } from "./VehicleCard";

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
            <VehicleCard key={service.id} vehicle={service} onClick={() => onVehicleClick(service)} />
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
