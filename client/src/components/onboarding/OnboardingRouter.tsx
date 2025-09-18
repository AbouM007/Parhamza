import React, { useState, useEffect } from "react";
import { ProfileStep, ProfessionalProfileData } from "./ProfileStep";
import { SubscriptionStep } from "./SubscriptionStep";
import { VerificationStep } from "./VerificationStep";
import { useAuth } from "../../hooks/useAuth";

interface OnboardingRouterProps {
  setShowProfileSetup: (value: boolean) => void;
}

export const OnboardingRouter: React.FC<OnboardingRouterProps> = ({
  setShowProfileSetup,
}) => {
  const { dbUser, refreshDbUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [savedFormData, setSavedFormData] = useState<any>({});

  /**
   * 🧩 Initialisation de l’étape selon le statut utilisateur
   */
  useEffect(() => {
    if (!dbUser) return;

    if (!dbUser.profile_completed) {
      setCurrentStep(1); // 👉 doit remplir son profil
    } else if (!dbUser.has_active_subscription) {
      setCurrentStep(2); // 👉 doit choisir/renouveler son plan
    } else if (dbUser.verification_status === "pending_docs") {
      setCurrentStep(3); // 👉 doit uploader KBIS + CIN
    } else {
      setShowProfileSetup(false); // ✅ tout est complet → fermer onboarding
    }
  }, [dbUser, setShowProfileSetup]);

  /**
   * Étape 1 → Étape 2
   */
  const handleProfileNext = async (data: ProfessionalProfileData) => {
    try {
      console.log("🔧 Sauvegarde profil professionnel:", data);

      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sb-access-token")}`,
        },
        body: JSON.stringify({
          ...data,
          type: "professional",
        }),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde profil");

      await refreshDbUser?.(); // 🔄 recharge les infos
      setSavedFormData((prev: any) => ({ ...prev, ...data }));
      setCurrentStep(2);
    } catch (err) {
      console.error("❌ Erreur sauvegarde profil:", err);
      alert("Erreur lors de la sauvegarde du profil");
    }
  };

  /**
   * Étape 2 → Stripe → Étape 3
   */
  const handleSubscriptionNext = async (plan: any) => {
    try {
      console.log("🛒 Choix du plan:", plan);

      const res = await fetch("/api/subscriptions/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sb-access-token")}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!res.ok) throw new Error("Erreur création session Stripe");

      const { sessionUrl } = await res.json();
      window.location.href = sessionUrl; // 👉 redirection Stripe
    } catch (err) {
      console.error("❌ Erreur abonnement:", err);
      alert("Erreur lors de la sélection du plan");
    }
  };

  /**
   * Étape 3 → Fin
   */
  const handleVerificationComplete = async () => {
    console.log("📄 Documents envoyés !");
    await refreshDbUser?.();
    setShowProfileSetup(false);
  };

  /**
   * Retour en arrière
   */
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  return (
    <div className="p-6">
      {currentStep === 1 && (
        <ProfileStep
          onNext={handleProfileNext}
          onCancel={() => setShowProfileSetup(false)}
        />
      )}

      {currentStep === 2 && (
        <SubscriptionStep onNext={handleSubscriptionNext} onBack={handleBack} />
      )}

      {currentStep === 3 && (
        <VerificationStep
          companyName={savedFormData?.companyName || dbUser?.company_name || ""}
          plan={savedFormData?.plan || dbUser?.subscription_plan || ""}
          onComplete={handleVerificationComplete}
          onBack={handleBack}
        />
      )}
    </div>
  );
};
