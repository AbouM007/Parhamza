import React, { useState } from "react";
import { X, AlertCircle, Crown, ArrowRight, Zap } from "lucide-react";
import { PlanSelector } from "./PlanSelector";

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaInfo: {
    used: number;
    maxListings: number | null;
    message?: string;
  };
  onUpgrade?: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  quotaInfo,
  onUpgrade,
}) => {
  const [showPlans, setShowPlans] = useState(false);

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onClose();
      onUpgrade();
    } else {
      // Afficher la sélection de plans directement dans le modal
      setShowPlans(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-all duration-300 ${
          showPlans
            ? "w-full max-w-sm sm:max-w-3xl lg:max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto"
            : "max-w-md w-full"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl ${
            showPlans ? "p-3 sm:p-4" : "p-6"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full transition-colors ${
                showPlans
                  ? "bg-primary-bolt-100 dark:bg-primary-bolt-900"
                  : "bg-primary-bolt-100 dark:bg-primary-bolt-900"
              }`}
            >
              {showPlans ? (
                <Zap className="h-6 w-6 text-primary-bolt-600 dark:text-primary-bolt-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-primary-bolt-600 dark:text-primary-bolt-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {showPlans
                ? "Choisissez votre abonnement"
                : "Limite d'annonces atteinte"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-close-quota-modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className={showPlans ? "p-2 sm:p-4" : "p-6"}>
          {!showPlans ? (
            <>
              {/* Intro message */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Vous avez publié{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {quotaInfo.used}/{quotaInfo.maxListings} annonces
                  </span>{" "}
                  ce mois.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Débloquez{" "}
                  <span className="font-bold text-primary-bolt-600 dark:text-primary-bolt-400">
                    plus d'annonces
                  </span>{" "}
                  avec nos abonnements !
                </p>
              </div>

              {/* Benefits preview */}
              <div className="bg-gradient-to-r from-primary-bolt-50 to-primary-bolt-100 dark:from-primary-bolt-900/20 dark:to-primary-bolt-800/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-primary-bolt-600 dark:text-primary-bolt-400" />
                  <span className="font-semibold text-primary-bolt-900 dark:text-primary-bolt-100">
                    Avantages des Abonnements
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-primary-bolt-700 dark:text-primary-bolt-200">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-bolt-600 rounded-full"></span>
                    Plus d'annonces publiées chaque mois
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-bolt-600 rounded-full"></span>
                    Badge de confiance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-bolt-600 rounded-full"></span>
                    Visibilité prioritaire
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-bolt-600 rounded-full"></span>
                    Statistiques avancées
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid="button-close-quota"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleUpgradeClick}
                  className="flex-2 py-3 px-6 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 text-white rounded-lg hover:from-primary-bolt-600 hover:to-primary-bolt-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  data-testid="button-see-plans"
                >
                  <Zap className="h-4 w-4" />
                  Voir les plans
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Plans selector */}
              <div className="mb-4 text-center">
                <p className="text-gray-600 dark:text-gray-300">
                  Sélectionnez le plan qui correspond à vos besoins et commencez
                  à publier plus d'annonces !
                </p>
              </div>

              <PlanSelector mode="compact" maxPlansDisplayed={3} />

              {/* Back button */}
              <div className="mt-6 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowPlans(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                  data-testid="button-back-to-quota"
                >
                  ← Retour au message de quota
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
