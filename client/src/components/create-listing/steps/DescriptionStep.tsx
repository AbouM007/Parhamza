interface DescriptionStepProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  isDamaged?: boolean;
  damageDetails?: {
    damageTypes?: string[];
    mechanicalState?: string;
    damageSeverity?: string;
  };
  onDamageDetailsChange?: (field: string, value: any) => void;
}

export const DescriptionStep: React.FC<DescriptionStepProps> = ({
  description,
  onDescriptionChange,
  isDamaged = false,
  damageDetails,
  onDamageDetailsChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Description</h2>
        <p className="text-gray-600">
          Décrivez votre {isDamaged ? "véhicule et ses dommages" : "annonce en détail"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description détaillée *
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Décrivez les caractéristiques, l'historique, l'état général..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent min-h-[150px]"
            maxLength={300}
            data-testid="textarea-description"
          />
          <p className="mt-2 text-sm text-gray-500">
            {description.length}/300 caractères (minimum 30)
          </p>
        </div>

        {isDamaged && onDamageDetailsChange && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informations sur les dommages
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de dommages
                </label>
                <select
                  value={damageDetails?.damageSeverity || ""}
                  onChange={(e) =>
                    onDamageDetailsChange("damageSeverity", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  data-testid="select-damage-severity"
                >
                  <option value="">Sélectionnez la gravité</option>
                  <option value="leger">Léger</option>
                  <option value="moyen">Moyen</option>
                  <option value="grave">Grave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  État mécanique
                </label>
                <select
                  value={damageDetails?.mechanicalState || ""}
                  onChange={(e) =>
                    onDamageDetailsChange("mechanicalState", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
                  data-testid="select-mechanical-state"
                >
                  <option value="">Sélectionnez l'état</option>
                  <option value="fonctionne">Fonctionne</option>
                  <option value="reparations_mineures">Réparations mineures nécessaires</option>
                  <option value="reparations_majeures">Réparations majeures nécessaires</option>
                  <option value="hs">Hors service</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
