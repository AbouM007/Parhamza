import React from "react";
import {
  Heart,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Crown,
} from "lucide-react";
import { Vehicle } from "@/types";
import brandIcon from "@/assets/Brand_1752260033631.png";
import { VehicleCard } from "./VehicleCard";

interface CategorySectionProps {
  title: string;
  vehicles: Vehicle[];
  onViewAll: () => void;
  onVehicleClick: (vehicle: Vehicle) => void;
}

const CategorySectionComponent: React.FC<CategorySectionProps> = ({
  title,
  vehicles,
  onViewAll,
  onVehicleClick,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return "Date inconnue";
      }

      // Vérifier si la date est celle par défaut de 1970 (problème de migration)
      const epoch = new Date("1970-01-01T00:00:00.000Z");
      if (Math.abs(dateObj.getTime() - epoch.getTime()) < 1000) {
        return "Récemment ajouté"; // Afficher un texte plus approprié
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "aujourd'hui";
      if (diffDays === 1) return "hier";
      if (diffDays < 7) return `il y a ${diffDays} jours`;
      if (diffDays < 30) return `il y a ${Math.ceil(diffDays / 7)} semaines`;
      return `il y a ${Math.ceil(diffDays / 30)} mois`;
    } catch (error) {
      return "Date inconnue";
    }
  };

  const getCategoryIcon = (category: string) => {
    return (
      <img src={brandIcon} alt="Brand icon" className="w-12 h-12 opacity-60" />
    );
  };

  if (vehicles.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Container with background and padding */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
          {/* Header - Desktop: title + link, Mobile: title only */}
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-primary-bolt-500">
              {title}
            </h2>
            <button
              onClick={onViewAll}
              className="hidden md:flex items-center space-x-1 text-primary-bolt-500 hover:text-primary-bolt-600 font-medium transition-colors"
            >
              <span>Voir plus d'annonces</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Listings Grid - Wider cards with better spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {vehicles.slice(0, 4).map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() => onVehicleClick(vehicle)}
              />
            ))}
          </div>

          {/* Mobile: "Voir plus" button at the end */}
          <div className="mt-6 md:hidden">
            <button
              onClick={onViewAll}
              className="w-full bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Voir plus d'annonces</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const CategorySection = React.memo(CategorySectionComponent);
