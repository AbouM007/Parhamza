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
        flex flex-row lg:flex-col"
    >
      {/* Boost Badge */}
      {vehicle.isBoosted && (
        <div className="absolute top-1 left-1 lg:top-3 lg:left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-1.5 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
          <Crown className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
          <span className="hidden sm:inline text-[10px] lg:text-xs">Boosté</span>
        </div>
      )}

      {/* Image + Carrousel - Ultra compact sur mobile (80px), vertical sur desktop */}
      <div className="relative w-20 h-20 lg:w-full lg:h-48 bg-gray-200 overflow-hidden flex-shrink-0">
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
                <span className="text-lg lg:text-7xl font-bold text-white/30 transform rotate-[-20deg] select-none tracking-wider">
                  DEMO
                </span>
              </div>
            )}

            {/* Flèches - Cachées sur mobile, visibles sur desktop */}
            {vehicle.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="hidden lg:block absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-md p-2 transition"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={nextImage}
                  className="hidden lg:block absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full shadow-md p-2 transition"
                >
                  <ChevronRight size={20} />
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
        <div className="absolute top-1 right-1 lg:top-3 lg:right-3 z-10 flex items-center space-x-1 lg:space-x-2">
          {vehicle.isDemo && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-1.5 py-0.5 lg:px-3 lg:py-1 rounded-full text-[10px] lg:text-xs font-semibold flex items-center space-x-1 shadow-lg">
              <span>Démo</span>
            </div>
          )}
          <FavoriteButton
            vehicleId={vehicle.id}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 lg:p-2 rounded-full shadow-md backdrop-blur-sm"
            size="sm"
          />
        </div>
      </div>

      {/* Contenu - Ultra compact sur mobile */}
      <div className="p-2 lg:p-6 flex-1 min-w-0">
        {/* Title and Price */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-1 lg:mb-3">
          <h3 className="text-xs lg:text-lg font-semibold text-gray-900 line-clamp-1 lg:line-clamp-2 mb-1 lg:mb-0 lg:flex-1 lg:mr-4">
            {vehicle.title}
          </h3>
          <div className="flex items-center justify-between lg:block lg:text-right">
            <div className="text-sm lg:text-xl font-bold text-primary-bolt-500">
              {formatPrice(vehicle.price)}
            </div>
            {vehicle.user?.type === "professional" && (
              <div className="flex lg:flex-col items-center lg:items-end space-x-1 lg:space-x-0 lg:space-y-1">
                <div className="text-[10px] lg:text-xs text-orange-600 font-medium">PRO</div>
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

        {/* Vehicle Details - Seulement année sur mobile, complet sur desktop */}
        <div className="flex flex-wrap gap-1.5 lg:gap-3 mb-1 lg:mb-4 text-[10px] lg:text-sm text-gray-600">
          {vehicle.year && vehicle.year > 0 && (
            <div className="flex items-center space-x-1 lg:space-x-2">
              <Calendar className="h-2.5 w-2.5 lg:h-4 lg:w-4 text-gray-400" />
              <span>{vehicle.year}</span>
            </div>
          )}

          {/* Kilométrage - masqué sur mobile */}
          {vehicle.mileage && vehicle.mileage > 0 && (
            <div className="hidden lg:flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-gray-400" />
              <span>{formatMileage(vehicle.mileage)}</span>
            </div>
          )}

          {/* Carburant - masqué sur mobile */}
          {vehicle.fuelType && (
            <div className="hidden lg:flex items-center space-x-2">
              <Fuel className="h-4 w-4 text-gray-400" />
              <span className="truncate">{translateFuelType(vehicle.fuelType)}</span>
            </div>
          )}
        </div>

        {/* Location - Simplifié sur mobile */}
        <div className="flex items-center space-x-1 lg:space-x-2 lg:pt-4 lg:border-t lg:border-gray-100 text-[10px] lg:text-sm text-gray-600">
          <MapPin className="h-2.5 w-2.5 lg:h-4 lg:w-4 text-gray-400" />
          <span className="truncate">{vehicle.location}</span>
        </div>
      </div>
    </div>
  );
};

export const VehicleCard = React.memo(VehicleCardComponent);
