import { useCallback, useEffect, useState } from "react";

import type { ListingTypeValue } from "@/components/create-listing/ListingTypeStep";

export interface ListingNavigationState {
  listingType: ListingTypeValue | "";
  category: string;
  subcategory: string;
  condition?: string;
}

interface UseListingNavigationOptions {
  totalSteps: number;
  formState: ListingNavigationState;
  needsConditionStep: () => boolean;
  isSearchForParts: () => boolean;
  isServiceCategory: () => boolean;
  isSearchListing: () => boolean;
}

export const useListingNavigation = ({
  totalSteps,
  formState,
  needsConditionStep,
  isSearchForParts,
  isServiceCategory,
  isSearchListing,
}: UseListingNavigationOptions) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  useEffect(() => {
    if (!autoAdvanceEnabled) {
      return;
    }

    if (currentStep === 1 && formState.listingType) {
      const timeout = setTimeout(() => setCurrentStep(2), 300);
      return () => clearTimeout(timeout);
    }
  }, [autoAdvanceEnabled, currentStep, formState.listingType]);

  useEffect(() => {
    if (!autoAdvanceEnabled) {
      return;
    }

    if (currentStep === 2 && formState.category) {
      const timeout = setTimeout(() => setCurrentStep(3), 300);
      return () => clearTimeout(timeout);
    }
  }, [autoAdvanceEnabled, currentStep, formState.category]);

  useEffect(() => {
    if (!autoAdvanceEnabled) {
      return;
    }

    if (currentStep === 3 && formState.subcategory) {
      const nextStep = needsConditionStep() ? 4 : 5;
      const timeout = setTimeout(() => setCurrentStep(nextStep), 300);
      return () => clearTimeout(timeout);
    }
  }, [
    autoAdvanceEnabled,
    currentStep,
    formState.subcategory,
    needsConditionStep,
  ]);

  useEffect(() => {
    if (!autoAdvanceEnabled) {
      return;
    }

    if (currentStep === 4 && formState.condition && needsConditionStep()) {
      const timeout = setTimeout(() => setCurrentStep(5), 300);
      return () => clearTimeout(timeout);
    }
  }, [
    autoAdvanceEnabled,
    currentStep,
    formState.condition,
    needsConditionStep,
  ]);

  const goToNextStep = useCallback(() => {
    let nextStepNumber = currentStep + 1;

    if (currentStep === 2) {
      nextStepNumber = 3;
    } else if (currentStep === 3) {
      nextStepNumber = needsConditionStep() ? 4 : 5;
    } else if (currentStep === 4) {
      nextStepNumber = 5;
    } else {
      if (isSearchForParts()) {
        if (currentStep === 5) {
          nextStepNumber = 7;
        } else if (currentStep === 7) {
          nextStepNumber = 8;
        } else if (currentStep === 8) {
          nextStepNumber = 11;
        }
      } else if (isServiceCategory()) {
        if (currentStep === 5) {
          nextStepNumber = 7;
        }
      } else if (isSearchListing()) {
        if (currentStep === 8) {
          nextStepNumber = 10;
        }
      }
    }

    if (nextStepNumber <= totalSteps) {
      setCurrentStep(nextStepNumber);
    }
  }, [
    currentStep,
    totalSteps,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
    needsConditionStep,
  ]);

  const goToPreviousStep = useCallback(() => {
    let previousStepNumber = currentStep - 1;

    if (currentStep === 4 && !needsConditionStep()) {
      previousStepNumber = 3;
    } else if (currentStep === 5) {
      previousStepNumber = needsConditionStep() ? 4 : 3;
    } else {
      if (isSearchForParts()) {
        if (currentStep === 11) {
          previousStepNumber = 8;
        } else if (currentStep === 8) {
          previousStepNumber = 7;
        } else if (currentStep === 7) {
          previousStepNumber = 5;
        }
      } else if (isServiceCategory()) {
        if (currentStep === 7) {
          previousStepNumber = 5;
        }
      } else if (isSearchListing()) {
        if (currentStep === 10) {
          previousStepNumber = 8;
        }
      }
    }

    if (previousStepNumber >= 1) {
      setCurrentStep(previousStepNumber);
    }
  }, [
    currentStep,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
    needsConditionStep,
  ]);

  const enableAutoAdvance = useCallback(() => setAutoAdvanceEnabled(true), []);
  const disableAutoAdvance = useCallback(() => setAutoAdvanceEnabled(false), []);

  return {
    autoAdvanceEnabled,
    currentStep,
    disableAutoAdvance,
    enableAutoAdvance,
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
  } as const;
};
