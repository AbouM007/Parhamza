import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            userEmail: session.user.email,
          }),
        },
      );

      if (!response.ok) throw new Error("Erreur création session Stripe");

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl; // ✅ redirection immédiate
      onComplete();
    } catch (error) {
      console.error("❌ Erreur checkout Stripe:", error);
      alert("Erreur lors de la création de la session Stripe");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Choisissez un abonnement</h2>

      {isLoadingPlans ? (
        <p>Chargement des plans...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className="border p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-2xl font-semibold text-green-600">
                {plan.price_monthly} €/mois
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {plan.max_listings
                  ? `${plan.max_listings} annonces/mois`
                  : "Annonces illimitées"}
              </p>
              <button
                onClick={() => handlePlanSelection(plan)}
                disabled={isCreatingCheckout}
                className="w-full bg-green-600 text-white py-2 px-4 mt-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isCreatingCheckout
                  ? "Redirection..."
                  : "Choisir ce plan et payer"}
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-6 px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
      >
        Retour
      </button>
    </div>
  );
};
