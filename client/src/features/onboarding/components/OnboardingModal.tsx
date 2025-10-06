import type { PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { OnboardingState } from "../types";

interface OnboardingModalProps extends PropsWithChildren {
  isOpen: boolean;
  state: OnboardingState;
  onClose: () => void;
}

export const OnboardingModal = ({
  isOpen,
  state,
  onClose,
  children,
}: OnboardingModalProps) => {
  if (!isOpen) {
    return null;
  }

  // TODO: Replace with design system modal implementation
  const content = (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-3xl rounded-lg bg-white p-4 sm:p-6 md:p-8 shadow-xl my-8">
          <header className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Onboarding</h2>
            <button type="button" onClick={onClose} className="text-sm text-gray-500">
              Fermer
            </button>
          </header>
          <section aria-live="polite" data-state={state}>
            {children}
          </section>
        </div>
      </div>
    </div>
  );

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return portalTarget ? createPortal(content, portalTarget) : content;
};