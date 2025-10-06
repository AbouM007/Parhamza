import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepButtonsProps {
  onBack?: () => void;
  onContinue: () => void;
  continueText?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
}

export const StepButtons = ({
  onBack,
  onContinue,
  continueText = "Continuer",
  continueDisabled = false,
  showBack = true,
}: StepButtonsProps) => {
  return (
    <div className="flex justify-between items-center mt-8">
      {showBack && onBack ? (
        <button
          onClick={onBack}
          type="button"
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
      ) : (
        <div />
      )}

      <button
        onClick={onContinue}
        disabled={continueDisabled}
        type="button"
        className="flex items-center space-x-2 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        data-testid="button-continue"
      >
        <span>{continueText}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
