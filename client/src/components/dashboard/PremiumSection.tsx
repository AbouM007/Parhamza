import { Crown } from "lucide-react";
import { PlanSelector } from "@/components/PlanSelector";

interface PremiumSectionProps {
  premiumListings: number;
}

export const PremiumSection = ({ premiumListings }: PremiumSectionProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Options Premium</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Gérez votre abonnement et boostez votre activité
        </p>
      </div>

      {/* Plans d'abonnement */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Plans d'abonnement</h2>
        <PlanSelector 
          mode="compact"
          showHeader={false}
          className="mb-8"
        />
      </div>

      

      {/* Current Premium Status */}
      {premiumListings > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-full shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-orange-900">
                  Statut Premium Actif
                </h3>
                <p className="text-orange-700 text-lg">
                  Vous avez {premiumListings} annonce
                  {premiumListings > 1 ? "s" : ""} premium active
                  {premiumListings > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              Gérer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
