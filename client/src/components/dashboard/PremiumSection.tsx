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
          Gérez votre abonnement et boostez vos annonces
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

      {/* Options de boost */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Options de boost</h2>
        <p className="text-gray-600 mb-6">Mettez vos annonces en avant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Daily Boost */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Remontée quotidienne
            </h3>
            <div className="text-4xl font-bold text-primary-bolt-500 mb-3">
              2€
            </div>
            <p className="text-gray-600">Remontée automatique pendant 24h</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Remontée en tête de liste</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Badge "Boosté"</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary-bolt-500 rounded-full"></div>
              <span className="font-medium">Visibilité accrue</span>
            </li>
          </ul>
        </div>

        {/* Weekly Premium */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8 relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8 mt-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Pack Hebdomadaire
            </h3>
            <div className="text-4xl font-bold text-orange-600 mb-3">4,99€</div>
            <p className="text-gray-600">Mise en avant pendant 7 jours</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Mise en avant 7 jours</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Badge "Boosté"</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="font-medium">Statistiques détaillées</span>
            </li>
          </ul>
        </div>

        {/* Monthly Pro */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Pack Pro Mensuel
            </h3>
            <div className="text-4xl font-bold text-purple-600 mb-3">
              19,99€
            </div>
            <p className="text-gray-600">Solution complète pour pros</p>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">10 annonces en avant</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">Statistiques avancées</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="font-medium">Support prioritaire</span>
            </li>
          </ul>
        </div>
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
