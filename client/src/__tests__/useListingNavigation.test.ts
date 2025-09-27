import { act, renderHook } from "@testing-library/react";

import { useListingNavigation } from "@/hooks/useListingNavigation";

describe("useListingNavigation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("auto advances from step 1 to 2 when listing type is selected", () => {
    const initialProps = {
      totalSteps: 12,
      formState: {
        listingType: "" as const,
        category: "",
        subcategory: "",
        condition: undefined,
      },
      needsConditionStep: () => false,
      isSearchForParts: () => false,
      isServiceCategory: () => false,
      isSearchListing: () => false,
    };

    const { result, rerender } = renderHook(
      (props) => useListingNavigation(props),
      { initialProps },
    );

    act(() => {
      rerender({
        ...initialProps,
        formState: { ...initialProps.formState, listingType: "sale" },
      });
      jest.advanceTimersByTime(300);
    });

    expect(result.current.currentStep).toBe(2);
  });

  it("moves to condition step when required", () => {
    const props = {
      totalSteps: 12,
      formState: {
        listingType: "sale" as const,
        category: "voiture-utilitaire",
        subcategory: "voiture",
        condition: undefined,
      },
      needsConditionStep: () => true,
      isSearchForParts: () => false,
      isServiceCategory: () => false,
      isSearchListing: () => false,
    };

    const { result } = renderHook(() => useListingNavigation(props));

    act(() => {
      result.current.setCurrentStep(3);
      result.current.goToNextStep();
    });

    expect(result.current.currentStep).toBe(4);
  });
});
