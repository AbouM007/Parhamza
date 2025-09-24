import React from "react";
import { X, AlertCircle, Crown, ArrowRight } from "lucide-react";

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
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Redirection par défaut vers la page des abonnements
      window.location.href = "/subscription-purchase";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Limite d'annonces atteinte
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
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Vous avez publié{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {quotaInfo.used}/{quotaInfo.maxListings} annonces gratuites
              </span>{" "}
              ce mois.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Pour continuer à vendre, passez en{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                Passionné
              </span>{" "}
              !
            </p>
          </div>

          {/* Benefits preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Avantages Passionné
              </span>
            </div>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Plus d'Annonces publiées
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Choisissez le pack qui vous convient
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Badge spécial "Passionné" Visible
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Plus de crédibilité
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
              Fermer
            </button>
            <button
              onClick={handleUpgradeClick}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              data-testid="button-upgrade-passionate"
            >
              <Crown className="h-4 w-4" />
              Passer Passionné
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Secondary action */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              data-testid="link-manage-listings"
            >
              Gérer mes annonces existantes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
