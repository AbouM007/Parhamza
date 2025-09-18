import React, { useEffect, useState } from "react";

interface SubscriptionStepProps {
  onNext: (plan: any) => void; // ✅ appelé quand un plan est choisi
  onBack: () => void; // ✅ retour en arrière
}

export const SubscriptionStep: React.FC<SubscriptionStepProps> = ({
  onNext,
  onBack,
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

  // Sélection d’un plan
  const handlePlanSelection = (plan: any) => {
    setIsCreatingCheckout(true);
    try {
      onNext(plan); // ✅ transmet au OnboardingRouter
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Étape 2 : Choisir un abonnement</h2>

      {isLoadingPlans ? (
        <p>Chargement des plans...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-4 hover:shadow-lg transition"
            >
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-green-600 font-semibold">
                {plan.price_monthly} €/mois
              </p>
              <button
                onClick={() => handlePlanSelection(plan)}
                disabled={isCreatingCheckout}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isCreatingCheckout ? "Redirection..." : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
};
