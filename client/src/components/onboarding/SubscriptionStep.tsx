import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Check, Star } from "lucide-react";

interface SubscriptionStepProps {
  onBack: () => void;
  onComplete: () => void;
}

export const SubscriptionStep: React.FC<SubscriptionStepProps> = ({
  onBack,
  onComplete,
}) => {
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Charger les plans d’abonnement
  const loadSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch("/api/subscriptions/plans");
      if (!response.ok) throw new Error("Erreur chargement plans");
      const plans = await response.json();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error("❌ Erreur chargement plans:", error);
      alert("Erreur lors du chargement des plans d’abonnement");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  // Sélectionner un plan → Stripe
  const handlePlanSelection = async (plan: any) => {
    setIsCreatingCheckout(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) throw new Error("Email utilisateur manquant");

      const response = await fetch(
        "/api/subscriptions/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`, // ✅ ajoute ça
          },
          body: JSON.stringify({
            planId: plan.id,
            userEmail: session.user.email,
          }),
        },
      );

      if (!response.ok) throw new Error("Erreur création session Stripe");

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl; // ✅ redirection immédiate
      //onComplete();
    } catch (error) {
      console.error("❌ Erreur checkout Stripe:", error);
      alert("Erreur lors de la création de la session Stripe");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Choisissez votre abonnement
      </h2>

      {isLoadingPlans ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                index === 1
                  ? "border-green-500"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              {/* Badge Populaire */}
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="inline h-3 w-3 mr-1" />
                    Populaire
                  </span>
                </div>
              )}

              {/* Header */}
              <div
                className={`p-6 ${index === 1 ? "bg-green-50" : "bg-white"}`}
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-bold text-green-600 mb-1">
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
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.max_listings
                        ? `${plan.max_listings} annonces/mois`
                        : "Annonces illimitées"}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Badge PRO</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Page boutique dédiée</span>
                  </li>
                </ul>
              </div>

              {/* Bouton */}
              <div className="border-t p-6 bg-white">
                <button
                  onClick={() => handlePlanSelection(plan)}
                  disabled={isCreatingCheckout}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreatingCheckout ? "Redirection..." : "Choisir ce plan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton retour */}
      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
        >
          Retour
        </button>
      </div>
    </div>
  );
};
