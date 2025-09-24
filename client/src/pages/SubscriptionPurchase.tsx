import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PlanSelector } from '@/components/PlanSelector';

// Les interfaces et constantes sont maintenant dans PlanSelector

interface SubscriptionPurchaseProps {
  onBack: () => void;
}

export default function SubscriptionPurchase({ onBack }: SubscriptionPurchaseProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Choisissez votre abonnement</h1>
              <p className="text-gray-600 mt-2">Sélectionnez le plan qui correspond à vos besoins</p>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Utilisation du composant PlanSelector réutilisable */}
        <PlanSelector
          mode="expanded"
          showGeneralBenefits={true}
          className=""
        />

        {/* FAQ */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Questions fréquentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-gray-600 text-sm">
                Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. 
                Les changements prennent effet immédiatement.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Que se passe-t-il si j'annule ?</h3>
              <p className="text-gray-600 text-sm">
                Vous gardez l'accès aux fonctionnalités pro jusqu'à la fin de votre période payée, 
                puis votre compte redevient particulier.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Y a-t-il des frais cachés ?</h3>
              <p className="text-gray-600 text-sm">
                Non, le prix affiché est le prix final. Aucun frais d'installation ou 
                de configuration supplémentaire.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Support client inclus ?</h3>
              <p className="text-gray-600 text-sm">
                Oui, tous les plans incluent le support par email. Les plans Business et Premium 
                incluent aussi le support téléphonique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}