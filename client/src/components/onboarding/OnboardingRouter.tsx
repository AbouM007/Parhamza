import React, { useState } from "react";
import { ProfileStep, ProfessionalProfileData } from "./ProfileStep";
import { VerificationStep } from "./VerificationStep";
import { SubscriptionStep } from "./SubscriptionStep";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingRouterProps {
  setShowProfileSetup: (value: boolean) => void;
}

export const OnboardingRouter: React.FC<OnboardingRouterProps> = ({
  setShowProfileSetup,
}) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [savedFormData, setSavedFormData] = useState<any>({});

  // Étape 1 → Étape 2 (ProfileStep → VerificationStep)
  const handleProfileNext = (data: ProfessionalProfileData) => {
    setSavedFormData(data);
    setCurrentStep(2);
  };

  // Étape 2 → Étape 3 (VerificationStep → SubscriptionStep)
  const handleVerificationComplete = () => {
    setCurrentStep(3);
  };

  // Étape 3 → Fin (Stripe redirection se fait dans SubscriptionStep)
  const handleSubscriptionComplete = () => {
    setShowProfileSetup(false); // ferme le modal après paiement
  };

  return (
    <div className="p-6">
      {currentStep === 1 && (
        <ProfileStep
          onNext={handleProfileNext}
          onCancel={() => setShowProfileSetup(false)}
          initialData={{
            name: profile?.name,
            email: profile?.email,
            phone: profile?.phone,
            companyName: profile?.companyName,
          }}
        />
      )}

      {currentStep === 2 && (
        <VerificationStep
          onBack={() => setCurrentStep(1)}
          onComplete={handleVerificationComplete}
        />
      )}

      {currentStep === 3 && (
        <SubscriptionStep
          onBack={() => setCurrentStep(2)}
          onComplete={handleSubscriptionComplete}
        />
      )}
    </div>
  );
};
