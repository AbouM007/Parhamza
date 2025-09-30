import React from 'react';
import { CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard: () => void;
  onBoostListing?: () => void;
  vehicleId?: string;
  vehicleTitle?: string;
  listingType: 'sell' | 'search';
}

export const PublishSuccessModal: React.FC<PublishSuccessModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDashboard,
  onBoostListing,
  vehicleId,
  vehicleTitle,
  listingType
}) => {
  if (!isOpen) return null;

  const isSearch = listingType === 'search';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center transform animate-in fade-in zoom-in duration-300">
        {/* Icône de succès - Color scheme du formulaire */}
        <div className="mx-auto w-16 h-16 bg-primary-bolt-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-primary-bolt-500" />
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {isSearch ? 'Recherche publiée !' : 'Annonce publiée !'}
        </h2>

        {/* Message principal */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Votre {isSearch ? 'recherche' : 'annonce'} a été reçue avec succès et sera validée dans quelques instants.
        </p>

        {/* Informations supplémentaires - Color scheme du formulaire */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-center text-gray-700 mb-2">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Validation en cours</span>
          </div>
          <p className="text-sm text-gray-600">
            Notre équipe vérifie votre {isSearch ? 'recherche' : 'annonce'} pour s'assurer qu'elle respecte nos conditions.
            Vous recevrez une notification dès qu'elle sera en ligne.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          {/* Bouton Booster (principal) - uniquement pour les annonces de vente */}
          {!isSearch && vehicleId && onBoostListing && (
            <button
              onClick={onBoostListing}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              data-testid="button-boost-new-listing"
            >
              <Zap className="w-5 h-5 mr-2" />
              <span>Booster cette annonce</span>
            </button>
          )}
          
          {/* Bouton Voir mes annonces (secondaire) */}
          <button
            onClick={onNavigateToDashboard}
            className="w-full bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
            data-testid="button-view-dashboard"
          >
            <span>Voir mes annonces</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          {/* Lien Continuer à naviguer (discret) */}
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
            data-testid="button-continue-browsing"
          >
            Continuer à naviguer
          </button>
        </div>
      </div>
    </div>
  );
};
