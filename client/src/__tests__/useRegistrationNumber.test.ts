import { renderHook } from "@testing-library/react";

import { useRegistrationNumber } from "@/hooks/useRegistrationNumber";

describe("useRegistrationNumber", () => {
  it("formats SIV registration numbers", () => {
    const { result } = renderHook(() => useRegistrationNumber());

    expect(result.current.formatRegistrationNumber("aa123aa")).toBe(
      "AA-123-AA",
    );
  });

  it("formats FNI registration numbers", () => {
    const { result } = renderHook(() => useRegistrationNumber());

    expect(result.current.formatRegistrationNumber("1234ab56")).toBe(
      "1234 AB 56",
    );
  });

  it("validates invalid input", () => {
    const { result } = renderHook(() => useRegistrationNumber());

    expect(result.current.validateRegistrationNumber("123")).toEqual({
      isValid: false,
      message:
        "Format invalide. Utilisez le format SIV (AA-123-AA) ou FNI (1234 AB 56)",
    });
  });
});
