import React, { useState } from "react";
import {
  Crown,
  Check,
  Star,
  TrendingUp,
  Award,
  Calendar,
  Euro,
  CreditCard,
  Shield,
  Building2,
  MessageCircle,
  BarChart3,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export interface SubscriptionPlan {
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

interface PlanSelectorProps {
  mode?: "compact" | "expanded";
  onPlanSelect?: (planId: number) => void;
  showHeader?: boolean;
  maxPlansDisplayed?: number;
  showGeneralBenefits?: boolean;
  className?: string;
}

// Couleurs des plans pour l'affichage
const PLAN_COLORS: Record<
  string,
  { primary: string; secondary: string; bg: string }
> = {
  starter: {
    primary: "text-blue-600",
    secondary: "text-blue-700",
    bg: "bg-blue-50",
  },
  business: {
    primary: "text-orange-600",
    secondary: "text-orange-700",
    bg: "bg-orange-50",
  },
  premium: {
    primary: "text-purple-600",
    secondary: "text-purple-700",
    bg: "bg-purple-50",
  },
};

// Fonction pour convertir les features en liste lisible
const getFeaturesList = (features: Record<string, boolean>): string[] => {
  const featureMap: Record<string, string> = {
    basic_stats: "Statistiques de base",
    advanced_stats: "Statistiques avancées",
    pro_dashboard: "Tableau de bord professionnel",
    badge_verified: "Badge de confiance",
    priority_search: "Remontée dans les recherches",
    push_notifications: "Notifications push",
    api_access: "Accès API",
    unlimited_listings: "Annonces illimitées",
    popular: "Plan recommandé",
  };

  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => featureMap[key] || key)
    .filter((feature) => feature !== "Plan recommandé");
};

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  mode = "expanded",
  onPlanSelect,
  showHeader = false,
  maxPlansDisplayed,
  showGeneralBenefits = false,
  className = "",
}) => {
  const { user, profile, session } = useAuth();
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Récupération des plans depuis l'API
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>(
    {
      queryKey: ["/api/subscriptions/plans"],
      staleTime: 60000, // 1 minute
    },
  );

  // Récupération de l'abonnement actuel
  const { data: currentSubscription } = useQuery<{
    isActive: boolean;
    planName: string | number;
    planType: number;
    expiresAt: string | null;
    status: string;
    cancelAtPeriodEnd: boolean;
  }>({
    queryKey: [`/api/subscriptions/status/${profile?.id}`],
    enabled: !!profile?.id && profile?.type === "professional",
    staleTime: 30000,
  });

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    // Vérifier si c'est le plan actuel
    if (currentSubscription && currentSubscription.planName === plan.id) {
      return;
    }

    setSelectedPlanId(plan.id);
    setPreparingPayment(true);

    try {
      if (!user?.email) {
        throw new Error("Email utilisateur manquant");
      }

      if (!session?.access_token) {
        throw new Error("Token d'authentification manquant");
      }

      // Callback personnalisé si fourni
      if (onPlanSelect) {
        onPlanSelect(plan.id);
        return;
      }

      // Sinon, utiliser l'API de checkout Stripe
      const response = await fetch(
        "/api/subscriptions/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            planId: plan.id,
            userEmail: user.email,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Erreur de création de session de paiement",
        );
      }

      // Rediriger vers Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error("URL de session manquante");
      }
    } catch (error) {
      console.error("Erreur lors de la préparation du paiement:", error);
      alert("Erreur lors de la préparation du paiement. Veuillez réessayer.");
    } finally {
      setPreparingPayment(false);
      setSelectedPlanId(null);
    }
  };

  // Filtrer les plans si nécessaire
  const displayedPlans = maxPlansDisplayed
    ? plans?.slice(0, maxPlansDisplayed)
    : plans;

  // Mode compact pour les modals
  const isCompactMode = mode === "compact";

  if (plansLoading) {
    return (
      <div
        className={`text-center ${isCompactMode ? "py-8" : "py-12"} ${className}`}
      >
        <div
          className={`animate-spin ${isCompactMode ? "w-8 h-8" : "w-12 h-12"} border-4 border-primary-bolt-500 border-t-transparent rounded-full mx-auto mb-4`}
        ></div>
        <p className="text-gray-600">Chargement des plans...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header optionnel */}
      {showHeader && (
        <div className="text-center mb-8">
          <h2
            className={`font-bold text-gray-900 mb-2 ${isCompactMode ? "text-xl" : "text-3xl"}`}
          >
            Choisissez votre abonnement
          </h2>
          <p className="text-gray-600">
            Sélectionnez le plan qui correspond à vos besoins
          </p>
        </div>
      )}

      {/* Avantages généraux (mode expanded uniquement) */}
      {showGeneralBenefits && !isCompactMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Boutique dédiée</h3>
            <p className="text-gray-600 text-sm">
              Votre propre page boutique personnalisée
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Visibilité premium</h3>
            <p className="text-gray-600 text-sm">
              Vos annonces remontent automatiquement
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Badge vérifié</h3>
            <p className="text-gray-600 text-sm">
              Statut professionnel certifié
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Statistiques</h3>
            <p className="text-gray-600 text-sm">
              Suivez les performances de vos annonces
            </p>
          </div>
        </div>
      )}

      {/* Plans d'abonnement */}
      <div
        className={`grid gap-6 ${
          isCompactMode
            ? "grid-cols-1 lg:grid-cols-3" // Horizontal sur desktop même en compact
            : "grid-cols-1 lg:grid-cols-3"
        }`}
      >
        {displayedPlans?.map((plan) => {
          const isCurrentPlan =
            currentSubscription &&
            (currentSubscription.planName === plan.id ||
              currentSubscription.planName === plan.id.toString());

          // Déterminer les couleurs du plan
          const planKey = plan.name.toLowerCase().includes("starter")
            ? "starter"
            : plan.name.toLowerCase().includes("business")
              ? "business"
              : "premium";
          const planColor = PLAN_COLORS[planKey] || PLAN_COLORS.starter;

          // Plan populaire
          const isPopular = plan.features.popular || planKey === "business";

          const isLoading = preparingPayment && selectedPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 relative transition-all duration-300 ${
                isCompactMode ? "p-4" : "p-8"
              } ${
                isCurrentPlan
                  ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                  : isPopular
                    ? "border-orange-300 scale-105 transform hover:scale-105"
                    : "border-gray-200 hover:border-gray-300 transform hover:scale-105"
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
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

              <div className={`text-center ${isCompactMode ? "mb-4" : "mb-8"}`}>
                <h3
                  className={`font-bold mb-2 ${planColor.primary} ${
                    isCompactMode ? "text-lg" : "text-2xl"
                  }`}
                >
                  {plan.name}
                </h3>
                <div
                  className={`font-bold mb-1 ${planColor.primary} ${
                    isCompactMode ? "text-2xl" : "text-5xl"
                  }`}
                >
                  {plan.price_monthly.toFixed(2)}€
                </div>
                <p
                  className={`text-gray-600 ${isCompactMode ? "text-sm" : ""}`}
                >
                  par mois
                </p>
                <p
                  className={`text-xs font-medium ${planColor.secondary} mt-1`}
                >
                  {plan.max_listings === null || plan.max_listings === -1
                    ? "Annonces illimitées"
                    : `${plan.max_listings} annonces max`}
                </p>
              </div>

              <ul className={`space-y-3 ${isCompactMode ? "mb-6" : "mb-8"}`}>
                {getFeaturesList(plan.features)
                  .slice(0, isCompactMode ? 3 : undefined) // Limiter les features en mode compact
                  .map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check
                        className={`h-5 w-5 ${planColor.primary} flex-shrink-0 mt-0.5`}
                      />
                      <span
                        className={`text-gray-700 ${isCompactMode ? "text-sm" : ""} ${
                          isCurrentPlan ? "opacity-75" : ""
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                {isCompactMode && getFeaturesList(plan.features).length > 3 && (
                  <li className="flex items-start space-x-3">
                    <Check
                      className={`h-5 w-5 ${planColor.primary} flex-shrink-0 mt-0.5`}
                    />
                    <span className="text-gray-500 text-sm">
                      +{getFeaturesList(plan.features).length - 3} autres
                      avantages
                    </span>
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full rounded-xl font-bold transition-all duration-200 ${
                  isCompactMode ? "py-2 px-4 text-sm" : "py-3 px-6"
                } ${
                  isCurrentPlan
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isPopular
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : `${planColor.primary.replace("text-", "bg-")} hover:opacity-90 text-white`
                }`}
                data-testid={`button-select-plan-${plan.id}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Préparation...</span>
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Plan actuel</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Choisir ce plan</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
