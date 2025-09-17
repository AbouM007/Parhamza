import React, { useState, useEffect } from 'react';
import { 
  Crown, Check, Star, TrendingUp, Award, Calendar, 
  Euro, CreditCard, ArrowLeft, Shield, Building2,
  MessageCircle, BarChart3, Zap
} from 'lucide-react';
// Plus besoin des imports Stripe Elements car on utilise Stripe Checkout
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

// Plus besoin d'initialiser Stripe côté client

interface SubscriptionPlan {
  id: number;
  name: string;
  price_monthly: number;
  max_listings: number | null;
  features: Record<string, boolean>;
  stripe_price_id: string;
  is_active: boolean;
  popular?: boolean;
  color?: {
    primary: string;
    secondary: string;
    bg: string;
  };
}

// Couleurs des plans pour l'affichage
const PLAN_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  'starter': {
    primary: 'text-blue-600',
    secondary: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  'business': {
    primary: 'text-orange-600',
    secondary: 'text-orange-700',
    bg: 'bg-orange-50'
  },
  'premium': {
    primary: 'text-purple-600',
    secondary: 'text-purple-700',
    bg: 'bg-purple-50'
  }
};

// Fonction pour convertir les features en liste lisible
const getFeaturesList = (features: Record<string, boolean>): string[] => {
  const featureMap: Record<string, string> = {
    'basic_stats': 'Statistiques de base',
    'advanced_stats': 'Statistiques avancées',
    'pro_dashboard': 'Tableau de bord professionnel',
    'badge_verified': 'Badge professionnel vérifié',
    'priority_search': 'Remontée dans les recherches',
    'push_notifications': 'Notifications push',
    'api_access': 'Accès API',
    'unlimited_listings': 'Annonces illimitées',
    'popular': 'Plan recommandé'
  };

  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => featureMap[key] || key)
    .filter(feature => feature !== 'Plan recommandé'); // Exclure "popular" des features
};

// PaymentForm supprimé car nous utilisons maintenant Stripe Checkout

interface SubscriptionPurchaseProps {
  onBack: () => void;
}

export default function SubscriptionPurchase({ onBack }: SubscriptionPurchaseProps) {
  const { user, dbUser } = useAuth();
  const [preparingPayment, setPreparingPayment] = useState(false);

  // Récupération des plans depuis l'API
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
    staleTime: 60000, // 1 minute
  });

  // Récupération de l'abonnement actuel
  const { data: currentSubscription } = useQuery<{
    isActive: boolean;
    planName: string | number;
    planType: number;
    expiresAt: string | null;
    status: string;
    cancelAtPeriodEnd: boolean;
  }>({
    queryKey: [`/api/subscriptions/status/${dbUser?.id}`],
    enabled: !!dbUser?.id && dbUser?.type === 'professional',
    staleTime: 30000, // 30 secondes
  });

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    // Vérifier si c'est le plan actuel
    if (currentSubscription && currentSubscription.planName === plan.id) {
      return; // Empêcher la sélection du plan actuel
    }
    
    setPreparingPayment(true);
    
    try {
      if (!user?.email) {
        throw new Error('Email utilisateur manquant');
      }

      // Utiliser l'API de checkout existante qui fonctionne
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          userEmail: user.email
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de création de session de paiement');
      }

      // Rediriger vers Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('URL de session manquante');
      }
    } catch (error) {
      console.error('Erreur lors de la préparation du paiement:', error);
      alert('Erreur lors de la préparation du paiement. Veuillez réessayer.');
    } finally {
      setPreparingPayment(false);
    }
  };

  // Plus besoin de ces handlers car nous redirigeons vers Stripe

  // Plus besoin d'affichage de succès car c'est géré par la page /success

  // Plus besoin de formulaire de paiement car on utilise Stripe Checkout

  if (preparingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-bolt-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Préparation du paiement...</h2>
          <p className="text-gray-600">Veuillez patienter</p>
        </div>
      </div>
    );
  }

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
        {/* Avantages généraux */}
        <div className="text-center mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Boutique dédiée</h3>
              <p className="text-gray-600 text-sm">Votre propre page boutique personnalisée</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Visibilité premium</h3>
              <p className="text-gray-600 text-sm">Vos annonces remontent automatiquement</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Badge vérifié</h3>
              <p className="text-gray-600 text-sm">Statut professionnel certifié</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Statistiques</h3>
              <p className="text-gray-600 text-sm">Suivez les performances de vos annonces</p>
            </div>
          </div>
        </div>

        {/* Plans d'abonnement */}
        {plansLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-bolt-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans?.map((plan) => {
              const isCurrentPlan = currentSubscription && (
                currentSubscription.planName === plan.id || 
                currentSubscription.planName === plan.id.toString()
              );
              
              // Déterminer les couleurs du plan
              const planKey = plan.name.toLowerCase().includes('starter') ? 'starter' :
                            plan.name.toLowerCase().includes('business') ? 'business' : 'premium';
              const planColor = PLAN_COLORS[planKey] || PLAN_COLORS.starter;
              
              // Plan populaire basé sur les features
              const isPopular = plan.features.popular || planKey === 'business';
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative transition-all duration-300 ${
                    isCurrentPlan
                      ? 'border-green-300 bg-green-50 opacity-75'
                      : isPopular 
                        ? 'border-orange-300 scale-105 transform hover:scale-105' 
                        : 'border-gray-200 hover:border-gray-300 transform hover:scale-105'
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Check className="h-4 w-4" />
                        <span>Plan actuel</span>
                      </span>
                    </div>
                  )}
                  
                  {!isCurrentPlan && isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>Plus populaire</span>
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${planColor.primary}`}>
                      {plan.name}
                    </h3>
                    <div className={`text-5xl font-bold mb-2 ${planColor.primary}`}>
                      {plan.price_monthly.toFixed(2)}€
                    </div>
                    <p className="text-gray-600">par mois</p>
                    <p className={`text-sm font-medium ${planColor.secondary} mt-2`}>
                      {plan.max_listings === null || plan.max_listings === -1 ? 'Annonces illimitées' : `${plan.max_listings} annonces max`}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {getFeaturesList(plan.features).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className={`h-5 w-5 ${planColor.primary} flex-shrink-0 mt-0.5`} />
                        <span className={`text-gray-700 ${isCurrentPlan ? 'opacity-75' : ''}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-4 px-6 rounded-xl font-bold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isPopular
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : `${planColor.primary.replace('text-', 'bg-')} hover:opacity-90 text-white`
                    }`}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isCurrentPlan ? (
                        <>
                          <Check className="h-5 w-5" />
                          <span>Plan actuel</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>Choisir ce plan</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

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