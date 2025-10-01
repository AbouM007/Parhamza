import { useMemo } from "react";
import { OnboardingModal } from "./components/OnboardingModal";
import { ChoiceStep } from "./components/steps/ChoiceStep";
import { DocsStep } from "./components/steps/DocsStep";
import { PaymentStep } from "./components/steps/PaymentStep";
import { PersonalStep } from "./components/steps/PersonalStep";
import { ProfessionalStep } from "./components/steps/ProfessionalStep";
import { useOnboarding } from "./hooks/useOnboarding";
import { OnboardingData, OnboardingState, StepProps, User } from "./types";
import { useAuth } from "@/contexts/AuthContext"; // ✅ importer le contexte auth

interface OnboardingEntryProps {
  user?: User | null;
  initialData?: OnboardingData;
  isEnabled?: boolean;
}

//const ONBOARDING_V2_FEATURE_FLAG = true;

type OnboardingCheck =
  | {
      launch: false;
      reason:
        | "completed"
        | "feature_disabled"
        | "no_user"
        | "not_authenticated";
    }
  | { launch: true; reason: "pending" | "incomplete" | "pro_onboarding" };

const checkOnboarding = (
  user: User | null,
  featureEnabled: boolean,
  isAuthenticated: boolean,
): OnboardingCheck => {
  if (!featureEnabled) {
    return { launch: false, reason: "feature_disabled" };
  }

  if (!user) {
    return { launch: false, reason: "no_user" };
  }

  if (!isAuthenticated) {
    return { launch: false, reason: "not_authenticated" };
  }

  // 🆕 Bypass onboarding si retour de Stripe (success_url)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    if (
      urlParams.has("session_id") ||
      pathname === "/success" ||
      pathname === "/stripe-success"
    ) {
      console.debug("[Onboarding] Bypass Stripe return");
      return { launch: false, reason: "completed" }; // ✅ type respecté
    }
  }

  if (user.type === "pending") {
    return { launch: true, reason: "pending" };
  }

  if (!user.profileCompleted) {
    return { launch: true, reason: "incomplete" };
  }

  if (user.type === "professional") {
    const validStates: OnboardingState[] = ["docs", "payment"];
    const userState = (user as any).onboardingState as
      | OnboardingState
      | undefined;
    if (userState && validStates.includes(userState)) {
      return { launch: true, reason: "pro_onboarding" };
    }
  }

  return { launch: false, reason: "completed" };
};

// ValidationStep supprimée - les documents sont maintenant uploadés directement dans DocsStep

export const OnboardingEntry = ({
  user = null,
  initialData,
  isEnabled,
}: OnboardingEntryProps) => {
  const featureEnabled = isEnabled ?? ONBOARDING_V2_FEATURE_FLAG;

  // ✅ CORRECT : Utiliser user et session de useAuth
  const { user: authUser, session } = useAuth();
  const isAuthenticated = !!session && !!authUser;
  const onboarding = useOnboarding({ user, initialData });

  const { currentState, data, advance, goBack, skip, isCompleted } = onboarding;

  const onboardingCheck = checkOnboarding(
    user,
    featureEnabled,
    isAuthenticated,
  );
  const shouldRender = onboardingCheck.launch;

  const step = useMemo(() => {
    const commonProps: StepProps = {
      currentData: data,
      onComplete: advance,
      onBack: goBack,
      onSkip: skip,
    };

    switch (currentState) {
      case "choice":
        return <ChoiceStep {...commonProps} />;
      case "personal":
        return <PersonalStep {...commonProps} />;
      case "professional":
        return <ProfessionalStep {...commonProps} />;
      case "docs":
        return <DocsStep {...commonProps} />;
      case "payment":
        return <PaymentStep {...commonProps} />;
      case "completed":
        return null;
      default:
        return <div>État inattendu: {currentState as OnboardingState}</div>;
    }
  }, [advance, currentState, data, goBack, skip]);

  if (!shouldRender || isCompleted) {
    return null;
  }

  return (
    <OnboardingModal isOpen={!isCompleted} state={currentState} onClose={skip}>
      {step}
    </OnboardingModal>
  );
};
