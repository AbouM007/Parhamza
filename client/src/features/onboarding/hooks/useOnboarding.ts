import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INITIAL_ONBOARDING_STATE,
  canTransition,
  getAvailableTransitions,
  getNextState,
  isTerminalState,
} from "../utils/stateMachine";
import {
  OnboardingContext,
  OnboardingData,
  OnboardingState,
  StepProps,
} from "../types";
import { User } from "@/types";

interface UseOnboardingParams {
  user?: User | null;
  initialData?: OnboardingData;
}

export interface UseOnboardingResult {
  currentState: OnboardingState;
  context: OnboardingContext;
  data: OnboardingData;
  isCompleted: boolean;
  availableTransitions: ReturnType<typeof getAvailableTransitions>;
  advance: StepProps["onComplete"];
  goBack: () => void;
  restart: () => void;
  skip: () => void;
  canTransitionTo: (nextState: OnboardingState) => boolean;
}

export const useOnboarding = (
  params: UseOnboardingParams = {},
): UseOnboardingResult => {
  const { user = null, initialData = {} } = params;

  const [context, setContext] = useState<OnboardingContext>({
    user,
    data: initialData,
  });
  const [currentState, setCurrentState] = useState<OnboardingState>(
    INITIAL_ONBOARDING_STATE,
  );
  const [history, setHistory] = useState<OnboardingState[]>([]);

  useEffect(() => {
    setContext((previous) => ({
      ...previous,
      user,
    }));
  }, [user]);

  const availableTransitions = useMemo(
    () => getAvailableTransitions(currentState, context),
    [context, currentState],
  );

  const advance = useCallback(
    (partialData?: Partial<OnboardingData>) => {
      setContext((previous) => {
        const nextData = partialData
          ? { ...previous.data, ...partialData }
          : previous.data;

        const nextContext: OnboardingContext = {
          ...previous,
          data: nextData,
        };

        setCurrentState((state) => {
          const nextState = getNextState(state, nextContext);
          if (nextState !== state) {
            setHistory((prevHistory) => [...prevHistory, state]);
          }
          return nextState;
        });

        return nextContext;
      });
    },
    [setContext, setCurrentState, setHistory] // ✅ ajouter les dépendances
  );


  const goBack = useCallback(() => {
    setHistory((prevHistory) => {
      const previousStates = [...prevHistory];
      const previousState = previousStates.pop();
      if (previousState) {
        setCurrentState(previousState);
      }
      return previousStates;
    });
  }, []);

  const restart = useCallback(() => {
    setContext({
      user,
      data: initialData,
    });
    setCurrentState(INITIAL_ONBOARDING_STATE);
    setHistory([]);
  }, [initialData, user]);

  const skip = useCallback(() => {
    setCurrentState("completed");
  }, []);

  const canTransitionTo = useCallback(
    (nextState: OnboardingState) => canTransition(currentState, nextState, context),
    [context, currentState],
  );

  return {
    currentState,
    context,
    data: context.data,
    isCompleted: isTerminalState(currentState),
    availableTransitions,
    advance,
    goBack,
    restart,
    skip,
    canTransitionTo,
  };
};