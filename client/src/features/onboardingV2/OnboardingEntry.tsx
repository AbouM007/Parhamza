import { useMemo } from "react";
import { OnboardingModal } from "./components/OnboardingModal";
import { ChoiceStep } from "./components/steps/ChoiceStep";
import { DocsStep } from "./components/steps/DocsStep";
import { PaymentStep } from "./components/steps/PaymentStep";
import { PersonalStep } from "./components/steps/PersonalStep";
import { ProfessionalStep } from "./components/steps/ProfessionalStep";
import { useOnboardingV2 } from "./hooks/useOnboardingV2";
import { OnboardingData, OnboardingState, StepProps, User } from "./types";
import { useAuth } from "@/contexts/AuthContext"; // ✅ importer le contexte auth


interface OnboardingEntryProps {
  user?: User | null;
  initialData?: OnboardingData;
  isEnabled?: boolean;
}

const ONBOARDING_V2_FEATURE_FLAG = true;

type OnboardingCheck =
  | { launch: false; reason: "completed" | "feature_disabled" | "no_user" | "not_authenticated" }
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

  if (user.type === "pending") {
    return { launch: true, reason: "pending" };
  }

  if (!user.profileCompleted) {
    return { launch: true, reason: "incomplete" };
  }

  if (user.type === "professional") {
    const validStates: OnboardingState[] = ["docs", "payment", "validation"];
    if (user.onboardingState && validStates.includes(user.onboardingState)) {
      return { launch: true, reason: "pro_onboarding" };
    }
  }

  return { launch: false, reason: "completed" };
};

const renderValidationStep = (props: StepProps & { onFinish: () => void }) => {
  const { currentData, onBack, onFinish } = props;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Validation en cours</h3>
      <p className="text-sm text-gray-600">
        Les contrôles automatiques et notifications seront branchés ici.
      </p>
      <pre className="rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(currentData, null, 2)}
      </pre>
      <div className="flex gap-2">
        {onBack ? (
          <button
            type="button"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700"
            onClick={onBack}
          >
            Retour
          </button>
        ) : null}
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={onFinish}
        >
          Terminer
        </button>
      </div>
    </div>
  );
};

export const OnboardingEntry = ({
  user = null,
  initialData,
  isEnabled,
}: OnboardingEntryProps) => {
  const featureEnabled = isEnabled ?? ONBOARDING_V2_FEATURE_FLAG;

  // ✅ CORRECT : Utiliser user et session de useAuth
  const { user: authUser, session } = useAuth();
  const isAuthenticated = !!session && !!authUser;
  const onboarding = useOnboardingV2({ user, initialData });
  
  const { currentState, data, advance, goBack, skip, isCompleted } = onboarding;

  const onboardingCheck = checkOnboarding(user, featureEnabled, isAuthenticated);
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
      case "validation":
        return renderValidationStep({
          ...commonProps,
          onFinish: () => advance(),
        });
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
