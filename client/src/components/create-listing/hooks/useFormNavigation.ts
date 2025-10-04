import { useCallback } from "react";
import { FormData } from "../types";
import { CATEGORIES } from "@/data/categories";
import { COUNTRY_CODES } from "@/data/contact";
import { useListingNavigation } from "@/hooks/useListingNavigation";

interface UseFormNavigationOptions {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  totalSteps?: number;
}

export const useFormNavigation = ({
  formData,
  setFormData,
  totalSteps = 12,
}: UseFormNavigationOptions) => {
  const getSelectedCategory = useCallback(() => {
    return CATEGORIES.find((cat) => cat.id === formData.category);
  }, [formData.category]);

  const needsConditionStep = useCallback((): boolean => {
    const category = getSelectedCategory();
    return !!(
      category?.isMaterial &&
      category?.id !== "services" &&
      category?.id !== "pieces"
    );
  }, [getSelectedCategory]);

  const isSearchForParts = useCallback(() => {
    return (
      formData.listingType === "search" && formData.category === "spare-parts"
    );
  }, [formData.listingType, formData.category]);

  const isServiceCategory = useCallback(() => {
    return formData.category === "services";
  }, [formData.category]);

  const isSearchListing = useCallback(() => {
    return formData.listingType === "search";
  }, [formData.listingType]);

  const {
    autoAdvanceEnabled,
    currentStep,
    disableAutoAdvance,
    enableAutoAdvance,
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
  } = useListingNavigation({
    totalSteps,
    formState: {
      listingType: formData.listingType,
      category: formData.category,
      subcategory: formData.subcategory,
      condition: formData.condition,
    },
    needsConditionStep,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
  });

  const validatePhoneNumber = useCallback(
    (phone: string): { isValid: boolean; message: string } => {
      if (!phone)
        return {
          isValid: false,
          message: "Le numéro de téléphone est requis",
        };

      if (!phone.startsWith("+")) {
        return {
          isValid: false,
          message:
            "Le numéro doit commencer par un indicatif international (+33, +1, +44, etc.)",
        };
      }

      const cleaned = phone.replace(/[^\d]/g, "");

      for (const country of COUNTRY_CODES) {
        const countryCode = country.code.replace("+", "");
        if (cleaned.startsWith(countryCode)) {
          const withoutPrefix = cleaned.slice(countryCode.length);

          if (country.code === "+33") {
            if (withoutPrefix.length === 9) {
              const firstDigit = withoutPrefix.charAt(0);
              const validPrefixes = [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
              ];
              if (validPrefixes.includes(firstDigit)) {
                return {
                  isValid: true,
                  message: `Numéro valide (${country.name})`,
                };
              }
            }
          } else {
            if (
              withoutPrefix.length >= country.length - 1 &&
              withoutPrefix.length <= country.length + 1
            ) {
              return {
                isValid: true,
                message: `Numéro valide (${country.name})`,
              };
            }
          }
        }
      }

      if (cleaned.length >= 8 && cleaned.length <= 15) {
        return { isValid: true, message: "Format international valide" };
      }

      return {
        isValid: false,
        message:
          "Format invalide. Utilisez un indicatif international (ex: +33 6 12 34 56 78)",
      };
    },
    [],
  );

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return formData.listingType !== "";
      case 2:
        return formData.category !== "";
      case 3:
        return formData.subcategory !== "";
      case 4:
        if (needsConditionStep()) {
          return formData.condition !== undefined;
        }
        return true;
      case 5:
        return formData.title.trim() !== "";
      case 6:
        if (isSearchForParts() || isServiceCategory()) {
          return true;
        }
        if (
          formData.subcategory === "piece-moto" ||
          formData.subcategory === "piece-voiture" ||
          formData.subcategory === "autre-piece"
        ) {
          return !!(
            formData.specificDetails.partCategory &&
            formData.specificDetails.partCondition
          );
        }
        if (
          formData.subcategory === "reparation" ||
          formData.subcategory === "remorquage" ||
          formData.subcategory === "entretien" ||
          formData.subcategory === "autre-service"
        ) {
          return !!(
            formData.specificDetails.serviceType &&
            formData.specificDetails.serviceArea
          );
        }
        if (formData.subcategory === "voiture") {
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year &&
            formData.specificDetails.mileage &&
            formData.specificDetails.fuelType &&
            formData.specificDetails.vehicleType &&
            formData.specificDetails.transmission
          );
        }
        if (formData.subcategory === "utilitaire") {
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year &&
            formData.specificDetails.mileage &&
            formData.specificDetails.fuelType &&
            formData.specificDetails.utilityType &&
            formData.specificDetails.transmission
          );
        }
        if (
          formData.subcategory === "moto" ||
          formData.subcategory === "scooter"
        ) {
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year &&
            formData.specificDetails.mileage &&
            formData.specificDetails.motorcycleType
          );
        }
        if (formData.subcategory === "caravane") {
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year &&
            formData.specificDetails.caravanType &&
            formData.specificDetails.sleeps
          );
        }
        if (formData.subcategory === "remorque") {
          return !!formData.specificDetails.trailerType;
        }
        if (formData.subcategory === "bateau") {
          return !!(
            formData.specificDetails.brand &&
            formData.specificDetails.model &&
            formData.specificDetails.year &&
            formData.specificDetails.boatType &&
            formData.specificDetails.length
          );
        }
        return !!(
          formData.specificDetails.brand &&
          formData.specificDetails.model &&
          formData.specificDetails.year
        );
      case 7:
        return formData.description.trim().length >= 30;
      case 8:
        return true;
      case 9:
        if (isSearchForParts() || isSearchListing()) {
          return true;
        }
        return formData.price > 0;
      case 10:
        if (isSearchForParts()) {
          return true;
        }
        return (
          formData.location.city !== "" && formData.location.postalCode !== ""
        );
      case 11:
        return (
          formData.contact.phone !== "" &&
          validatePhoneNumber(formData.contact.phone).isValid
        );
      case 12:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    formData,
    needsConditionStep,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
    validatePhoneNumber,
  ]);

  const nextStepHandler = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const prevStepHandler = useCallback(() => {
    disableAutoAdvance();

    switch (currentStep) {
      case 2:
        setFormData((prev) => ({ ...prev, listingType: "" }));
        break;
      case 3:
        setFormData((prev) => ({ ...prev, category: "" }));
        break;
      case 4:
        setFormData((prev) => ({
          ...prev,
          subcategory: "",
          condition: undefined,
        }));
        break;
      case 5:
        if (needsConditionStep()) {
          setFormData((prev) => ({ ...prev, condition: undefined }));
        } else {
          setFormData((prev) => ({ ...prev, subcategory: "" }));
        }
        break;
    }

    goToPreviousStep();

    setTimeout(() => {
      enableAutoAdvance();
    }, 500);
  }, [
    currentStep,
    needsConditionStep,
    setFormData,
    goToPreviousStep,
    disableAutoAdvance,
    enableAutoAdvance,
  ]);

  return {
    currentStep,
    setCurrentStep,
    totalSteps,
    canProceed,
    nextStepHandler,
    prevStepHandler,
    autoAdvanceEnabled,
    enableAutoAdvance,
    disableAutoAdvance,
    needsConditionStep,
    isSearchForParts,
    isServiceCategory,
    isSearchListing,
    validatePhoneNumber,
    getSelectedCategory,
  };
};
