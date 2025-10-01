export interface RegistrationValidationResult {
  isValid: boolean;
  message: string;
}

export const useRegistrationNumber = () => {
  const validateRegistrationNumber = (
    regNumber: string,
  ): RegistrationValidationResult => {
    if (!regNumber) return { isValid: true, message: "" };

    const cleaned = regNumber.replace(/[\s-]/g, "").toUpperCase();

    const sivPattern = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    const fniPattern = /^[0-9]{1,4}[A-Z]{1,3}[0-9]{1,3}$/;

    if (sivPattern.test(cleaned)) {
      return { isValid: true, message: "Format SIV valide (AA-123-AA)" };
    }

    if (fniPattern.test(cleaned)) {
      return { isValid: true, message: "Format FNI valide (1234 AB 56)" };
    }

    return {
      isValid: false,
      message:
        "Format invalide. Utilisez le format SIV (AA-123-AA) ou FNI (1234 AB 56)",
    };
  };

  const formatRegistrationNumber = (value: string): string => {
    if (!value) return "";

    const cleaned = value.replace(/[\s-]/g, "").toUpperCase();

    if (cleaned.length >= 5) {
      const sivPattern = /^([A-Z]{2})([0-9]{3})([A-Z]{0,2}).*$/;
      const match = cleaned.match(sivPattern);
      if (match) {
        const [, letters1, numbers, letters2] = match;
        if (letters2.length === 2) {
          return `${letters1}-${numbers}-${letters2}`;
        }
        if (letters2.length === 1) {
          return `${letters1}-${numbers}-${letters2}`;
        }
        return `${letters1}-${numbers}`;
      }
    }

    if (cleaned.length >= 6) {
      const fniPattern = /^([0-9]{1,4})([A-Z]{1,3})([0-9]{1,3}).*$/;
      const match = cleaned.match(fniPattern);
      if (match) {
        const [, numbers1, letters, numbers2] = match;
        return `${numbers1} ${letters} ${numbers2}`;
      }
    }

    return cleaned;
  };

  return { formatRegistrationNumber, validateRegistrationNumber } as const;
};
