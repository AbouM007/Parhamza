import React, { useState } from 'react';
import { X, TrendingUp, Clock, Euro, Crown, Zap, Check } from 'lucide-react';
import { useBoostPlans } from '@/hooks/useBoostPlans';
import { BoostPlan } from '@shared/schema';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  annonceId: string;
  annonceTitle: string;
}

export const BoostModal: React.FC<BoostModalProps> = ({
  isOpen,
  onClose,
  annonceId,
  annonceTitle,
}) => {
  const { data: boostPlans, isLoading, error } = useBoostPlans();
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + ' €';
  };

  const getDurationText = (days: number) => {
    if (days === 1) return '1 jour';
    if (days === 7) return '1 semaine';
    if (days === 30) return '1 mois';
    return `${days} jours`;
  };

  const handleBoostPurchase = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/boost/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annonceId: parseInt(annonceId),
          planId: selectedPlan.id,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Rediriger vers Stripe Checkout
        window.location.href = url;
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la création de la session Stripe:', errorData);
        alert('Erreur lors de la création du paiement. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-orange-500" />
                <span>Booster votre annonce</span>
              </h2>
              <p className="text-gray-600 mt-1">
                Augmentez la visibilité de "{annonceTitle}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              data-testid="button-close-boost-modal"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits section */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Avantages du boost</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Apparition en tête de liste</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Crown className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Badge "Boosté" visible</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Plus de vues et contacts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Activation immédiate</span>
              </div>
            </div>
          </div>

          {/* Plans selection */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des plans...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Erreur lors du chargement des plans boost</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Choisissez votre durée de boost</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {boostPlans?.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="font-semibold text-gray-900">{plan.name}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{getDurationText(plan.durationDays)}</p>
                      <div className="text-2xl font-bold text-orange-600 flex items-center justify-center">
                        <Euro className="h-5 w-5 mr-1" />
                        {formatPrice(plan.priceCents)}
                      </div>
                      {selectedPlan?.id === plan.id && (
                        <div className="mt-2 flex items-center justify-center">
                          <div className="bg-orange-500 text-white p-1 rounded-full">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              data-testid="button-cancel-boost"
            >
              Annuler
            </button>
            <button
              onClick={handleBoostPurchase}
              disabled={!selectedPlan || isProcessing}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                selectedPlan && !isProcessing
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              data-testid="button-confirm-boost"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Redirection...</span>
                </div>
              ) : (
                `Booster pour ${selectedPlan ? formatPrice(selectedPlan.priceCents) : '--'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};