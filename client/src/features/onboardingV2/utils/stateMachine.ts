import { OnboardingContext, OnboardingState, StateTransition } from "../types";

export const INITIAL_ONBOARDING_STATE: OnboardingState = "choice";

const transitions: StateTransition[] = [
  {
    from: "choice",
    to: "personal",
    guard: (context) => context.data.accountType == "individual",
  },
  {
    from: "choice",
    to: "professional",
    guard: (context) => context.data.accountType === "professional",
  },
  {
    from: "personal",
    to: "completed",
  },
  {
    from: "professional",
    to: "docs",
  },
  {
    from: "docs",
    to: "payment",
    guard: (context) => context.user?.type === "professional",
  },
  {
    from: "docs",
    to: "completed",
  },
  {
    from: "payment",
    to: "completed",
  },
];

export const getAvailableTransitions = (
  state: OnboardingState,
  context: OnboardingContext,
): StateTransition[] =>
  transitions.filter(
    (transition) =>
      transition.from === state && (transition.guard?.(context) ?? true),
  );

export const canTransition = (
  from: OnboardingState,
  to: OnboardingState,
  context: OnboardingContext,
): boolean =>
  getAvailableTransitions(from, context).some(
    (transition) => transition.to === to,
  );

export const getNextState = (
  state: OnboardingState,
  context: OnboardingContext,
): OnboardingState => getAvailableTransitions(state, context)[0]?.to ?? state;

export const isTerminalState = (state: OnboardingState): boolean =>
  state === "completed";

export const resetContext = (
  context: OnboardingContext,
): OnboardingContext => ({
  ...context,
  data: {},
});
