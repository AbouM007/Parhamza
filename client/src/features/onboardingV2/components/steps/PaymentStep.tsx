import { useEffect, useState } from "react";
import { Check, Star, Loader } from "lucide-react";
import { StepButtons } from "../shared/StepButtons";
import { StepProps } from "../../types";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  max_listings: number | null;
  features?: string[];
}

export const PaymentStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  const { session } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Charger les plans d'abonnement
  const loadSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch("/api/subscriptions/plans");
      if (!response.ok) throw new Error("Erreur chargement plans");
      const plans = await response.json();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error("❌ Erreur chargement plans:", error);
      alert("Erreur lors du chargement des plans d'abonnement");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  // Sélectionner un plan → Stripe
  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    setIsCreatingCheckout(true);
    try {
      if (!session?.user?.email) {
        throw new Error("Email utilisateur manquant");
      }

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
            userEmail: session.user.email,
          }),
        }
      );

      if (!response.ok) throw new Error("Erreur création session Stripe");

      const { sessionUrl } = await response.json();
      
      // Sauvegarder l'info du plan sélectionné avant redirection
      onComplete({ 
        payment: { 
          planId: plan.id,
          planName: plan.name,
          redirecting: true 
        } 
      });
      
      // Redirection vers Stripe
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("❌ Erreur checkout Stripe:", error);
      alert("Erreur lors de la création de la session Stripe");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // Option pour sauter (mode test uniquement)
  const handleSkip = () => {
    onComplete({ payment: { skipped: true } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez votre abonnement
        </h2>
        <p className="text-gray-600">
          Sélectionnez le plan qui correspond à vos besoins professionnels
        </p>
      </div>

      {/* Plans Grid */}
      {isLoadingPlans ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader className="animate-spin h-6 w-6" />
            <span>Chargement des plans...</span>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                index === 1
                  ? "border-teal-500"
                  : "border-gray-200 hover:border-teal-300"
              }`}
              data-testid={`plan-card-${plan.id}`}
            >
              {/* Badge Populaire */}
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="inline h-3 w-3 mr-1" />
                    Populaire
                  </span>
                </div>
              )}

              {/* Header */}
              <div
                className={`p-6 ${index === 1 ? "bg-teal-50" : "bg-white"}`}
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-bold text-teal-600 mb-1">
                  {plan.price_monthly}€
                  <span className="text-sm text-gray-500 font-normal">
                    /mois
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {plan.max_listings
                    ? `${plan.max_listings} annonces/mois`
                    : "Annonces illimitées"}
                </p>
              </div>

              {/* Features */}
              <div className="border-t px-6 py-4 bg-white">
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">
                      {plan.max_listings
                        ? `${plan.max_listings} annonces/mois`
                        : "Annonces illimitées"}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Badge PRO</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Page boutique dédiée</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>
              </div>

              {/* Bouton */}
              <div className="border-t p-6 bg-white">
                <button
                  onClick={() => handlePlanSelection(plan)}
                  disabled={isCreatingCheckout}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {isCreatingCheckout ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="animate-spin h-4 w-4" />
                      Redirection...
                    </span>
                  ) : (
                    "Choisir ce plan"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Paiement sécurisé :</strong> Vous serez redirigé vers Stripe
          pour finaliser votre paiement en toute sécurité. Aucune donnée
          bancaire n'est stockée sur nos serveurs.
        </p>
      </div>

      {/* Navigation Buttons */}
      <StepButtons
        onBack={onBack}
        backLabel="Retour aux documents"
        hideBack={false}
      />

      {/* Skip Button (Dev Only) */}
      {import.meta.env.DEV && (
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            data-testid="button-skip-payment"
          >
            Passer cette étape (dev mode)
          </button>
        </div>
      )}
    </div>
  );
};