import React, { useState } from "react";
import {
  Calendar,
  Gauge,
  MapPin,
  Eye,
  Heart,
  Crown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Fuel,
} from "lucide-react";
import { Vehicle } from "@/types";
import brandIcon from "@/assets/Brand_1752260033631.png";
import { OptimizedImage } from "./OptimizedImage";
import { FavoriteButton } from "./FavoriteButton";
import { VerifiedBadge } from "./VerifiedBadge";
import { PassionateLabel } from "./PassionateLabel";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

const VehicleCardComponent: React.FC<VehicleCardProps> = ({
  vehicle,
  onClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);

  const formatMileage = (mileage: number) =>
    new Intl.NumberFormat("fr-FR").format(mileage) + " km";

  const translateFuelType = (fuelType: string): string => {
    const translations: Record<string, string> = {
      gasoline: "Essence",
      diesel: "Diesel",
      electric: "Électrique",
      hybrid: "Hybride",
      plugin_hybrid: "Hybride rechargeable",
      lpg: "GPL",
      cng: "GNV",
      hydrogen: "Hydrogène",
      other: "Autre",
    };
    return translations[fuelType] || fuelType;
  };

  const getCategoryIcon = (category: string) => (
    <img src={brandIcon} alt="Brand icon" className="w-16 h-16 opacity-60" />
  );

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev === 0 ? vehicle.images.length - 1 : prev - 1,
    );
  };

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] cursor-pointer overflow-hidden border border-gray-100 
        flex flex-col"
    >
      {/* Boost Badge */}
      {vehicle.isBoosted && (
        <div className="absolute top-2 left-2 lg:top-3 lg:left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
          <Crown className="h-3 w-3" />
          <span className="hidden sm:inline">Boosté</span>
        </div>
      )}

      {/* Image + Carrousel - Vertical sur tous les écrans */}
      <div className="relative w-full h-48 lg:h-56 bg-gray-200 overflow-hidden flex-shrink-0">
        {vehicle.images.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={vehicle.images[currentIndex]}
                alt={vehicle.title}
                className="w-full h-full object-cover"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
            
            {/* Filigrane DEMO */}
            {vehicle.isDemo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl lg:text-7xl font-bold text-white/30 transform rotate-[-20deg] select-none tracking-wider">
                  DEMO
                </span>
              </div>
            )}

            {/* Flèches - Visibles sur tous les écrans */}
            {vehicle.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-md p-1.5 lg:p-2 transition"
                >
                  <ChevronLeft size={18} className="lg:w-5 lg:h-5" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-md p-1.5 lg:p-2 transition"
                >
                  <ChevronRight size={18} className="lg:w-5 lg:h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {getCategoryIcon(vehicle.category)}
          </div>
        )}
        {/* Demo Badge et Favorite Button */}
        <div className="absolute top-2 right-2 lg:top-3 lg:right-3 z-10 flex items-center space-x-1 lg:space-x-2">
          {vehicle.isDemo && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
              <span>Démo</span>
            </div>
          )}
          <FavoriteButton
            vehicleId={vehicle.id}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1.5 lg:p-2 rounded-full shadow-md backdrop-blur-sm"
            size="sm"
          />
        </div>
      </div>

      {/* Contenu - Layout vertical optimisé */}
      <div className="p-4 lg:p-6 flex-1 min-w-0">
        {/* Title and Price */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3 lg:mb-3">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 mb-2 lg:mb-0 lg:flex-1 lg:mr-4">
            {vehicle.title}
          </h3>
          <div className="flex items-center justify-between lg:block lg:text-right">
            <div className="text-xl lg:text-xl font-bold text-primary-bolt-500">
              {formatPrice(vehicle.price)}
            </div>
            {vehicle.user?.type === "professional" && (
              <div className="flex lg:flex-col items-center lg:items-end space-x-1 lg:space-x-0 lg:space-y-1">
                <div className="text-xs text-orange-600 font-medium">PRO</div>
                <VerifiedBadge
                  userId={vehicle.userId}
                  userType={vehicle.user?.type}
                />
              </div>
            )}

            {vehicle.user?.type === "individual" && (
              <div className="flex lg:flex-col items-center lg:items-end lg:space-y-1">
                <PassionateLabel
                  userId={vehicle.userId}
                  userType={vehicle.user?.type}
                  variant="badge"
                />
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Details - Optimisé pour mobile */}
        <div className="flex flex-wrap gap-3 lg:gap-3 mb-3 lg:mb-4 text-sm lg:text-sm text-gray-600">
          {vehicle.year && vehicle.year > 0 && (
            <div className="flex items-center space-x-1.5 lg:space-x-2">
              <Calendar className="h-4 w-4 lg:h-4 lg:w-4 text-gray-400" />
              <span>{vehicle.year}</span>
            </div>
          )}

          {vehicle.mileage && vehicle.mileage > 0 && (
            <div className="flex items-center space-x-1.5 lg:space-x-2">
              <Gauge className="h-4 w-4 lg:h-4 lg:w-4 text-gray-400" />
              <span>{formatMileage(vehicle.mileage)}</span>
            </div>
          )}

          {vehicle.fuelType && (
            <div className="flex items-center space-x-1.5 lg:space-x-2">
              <Fuel className="h-4 w-4 lg:h-4 lg:w-4 text-gray-400" />
              <span className="truncate">{translateFuelType(vehicle.fuelType)}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1.5 lg:space-x-2 pt-3 lg:pt-4 border-t border-gray-100 text-sm lg:text-sm text-gray-600">
          <MapPin className="h-4 w-4 lg:h-4 lg:w-4 text-gray-400" />
          <span className="truncate">{vehicle.location}</span>
        </div>
      </div>
    </div>
  );
};

export const VehicleCard = React.memo(VehicleCardComponent);
