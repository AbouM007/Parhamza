import { User } from "@/types";

// Réexporter User pour les autres fichiers du module
export type { User };

export type OnboardingState =
  | "choice"
  | "personal"
  | "professional"
  | "docs"
  | "payment"
  | "validation"
  | "completed";

// onboardingV2/types/index.ts
export interface OnboardingUser {  // ← Renommer
  id: string;
  email: string;
  type: "pending" | "individual" | "professional" | "admin" | null;
  profileCompleted?: boolean;
  onboardingState?: OnboardingState;
  metadata?: Record<string, unknown>;
}

export interface OnboardingData {
  accountType?: "individual" | "professional";
  personal?: Record<string, unknown>;
  professional?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  payment?: Record<string, unknown>;
}

export interface OnboardingContext {
  user: User | null;
  data: OnboardingData;
}

export interface StateTransition {
  from: OnboardingState;
  to: OnboardingState;
  guard?: (context: OnboardingContext) => boolean;
}

export interface StepProps {
  currentData: OnboardingData;
  onComplete: (data?: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
}