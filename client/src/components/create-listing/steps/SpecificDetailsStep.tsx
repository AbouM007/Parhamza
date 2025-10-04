import { getFieldsForSubcategory } from "../registry/specificDetailsRegistry";

interface SpecificDetailsStepProps {
  subcategory: string;
  specificDetails: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  isSearchListing?: boolean;
  isServiceCategory?: boolean;
}

export const SpecificDetailsStep: React.FC<SpecificDetailsStepProps> = ({
  subcategory,
  specificDetails,
  onUpdate,
  isSearchListing = false,
  isServiceCategory = false,
}) => {
  if (isSearchListing || isServiceCategory) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Détails spécifiques
          </h2>
          <p className="text-gray-600">
            {isSearchListing
              ? "Détails optionnels pour votre recherche"
              : "Configuration de votre service"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">
            Cette étape est optionnelle pour ce type d'annonce
          </p>
        </div>
      </div>
    );
  }

  const fields = getFieldsForSubcategory(subcategory);

  if (fields.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Détails spécifiques
          </h2>
          <p className="text-gray-600">Aucun détail spécifique requis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Détails spécifiques
        </h2>
        <p className="text-gray-600">Remplissez les informations techniques</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ Cette étape est en cours de refactorisation. Les champs
            détaillés seront disponibles prochainement. Vous pouvez continuer
            avec les informations de base.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.includes("brand") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marque *
              </label>
              <input
                type="text"
                value={specificDetails.brand || ""}
                onChange={(e) => onUpdate("brand", e.target.value)}
                placeholder="Ex: Renault"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                data-testid="input-brand"
              />
            </div>
          )}

          {fields.includes("model") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={specificDetails.model || ""}
                onChange={(e) => onUpdate("model", e.target.value)}
                placeholder="Ex: Clio"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                data-testid="input-model"
              />
            </div>
          )}

          {fields.includes("year") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Année *
              </label>
              <input
                type="number"
                value={specificDetails.year || ""}
                onChange={(e) => onUpdate("year", e.target.value)}
                placeholder="Ex: 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                data-testid="input-year"
              />
            </div>
          )}

          {fields.includes("mileage") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kilométrage *
              </label>
              <input
                type="number"
                value={specificDetails.mileage || ""}
                onChange={(e) => onUpdate("mileage", e.target.value)}
                placeholder="Ex: 50000"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                data-testid="input-mileage"
              />
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Les champs détaillés pour cette catégorie seront ajoutés dans
            une prochaine mise à jour. Pour l'instant, les informations de base
            suffisent pour publier votre annonce.
          </p>
        </div>
      </div>
    </div>
  );
};
