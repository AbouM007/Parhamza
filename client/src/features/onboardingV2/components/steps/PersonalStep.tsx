import { StepProps } from "../../types";

export const PersonalStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Informations personnelles</h3>
      <p className="text-sm text-gray-600">
        Les champs et validations seront ajoutés ultérieurement.
      </p>
      <pre className="rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(currentData.personal ?? {}, null, 2)}
      </pre>
      <div className="flex gap-2">
        {onBack ? (
          <button
            type="button"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700"
            onClick={onBack}
          >
            Retour
          </button>
        ) : null}
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => onComplete({ personal: currentData.personal })}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};
