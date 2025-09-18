import React, { useState } from "react";
import { ProfileStep, ProfessionalProfileData } from "./ProfileStep";
import { SubscriptionStep } from "./SubscriptionStep";

interface OnboardingRouterProps {
  setShowProfileSetup: (value: boolean) => void;
}

export const OnboardingRouter: React.FC<OnboardingRouterProps> = ({
  setShowProfileSetup,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedFormData, setSavedFormData] = useState<any>({});

  // Étape 1 → Étape 2
  const handleProfileNext = (data: ProfessionalProfileData) => {
    setSavedFormData(data);
    setCurrentStep(2);
  };

  // Étape 2 → Fin (Stripe redirection se fait dans SubscriptionStep)
  const handleSubscriptionComplete = () => {
    setShowProfileSetup(false); // ferme le modal après paiement
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
        <SubscriptionStep
          onBack={() => setCurrentStep(1)}
          onComplete={handleSubscriptionComplete}
        />
      )}
    </div>
  );
};
