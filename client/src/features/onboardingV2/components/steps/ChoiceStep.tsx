import { StepProps } from "../../types";

export const ChoiceStep = ({
  currentData,
  onComplete,
  onSkip,
}: StepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bienvenue sur l'onboarding</h3>
      <p className="text-sm text-gray-600">
        Cette étape permettra à l'utilisateur de choisir son parcours. Les actions
        réelles seront intégrées ultérieurement.
      </p>
      <pre className="rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(currentData, null, 2)}
      </pre>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => onComplete()}
        >
          Continuer
        </button>
        {onSkip ? (
          <button
            type="button"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700"
            onClick={onSkip}
          >
            Ignorer
          </button>
        ) : null}
      </div>
    </div>
  );
};