interface TitleStepProps {
  title: string;
  onTitleChange: (value: string) => void;
  registrationNumber?: string;
  onRegistrationNumberChange?: (value: string) => void;
  needsRegistrationNumber?: boolean;
}

export const TitleStep: React.FC<TitleStepProps> = ({
  title,
  onTitleChange,
  registrationNumber,
  onRegistrationNumberChange,
  needsRegistrationNumber = false,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Titre de l'annonce</h2>
        <p className="text-gray-600">
          Donnez un titre clair et descriptif à votre annonce
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titre *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ex: BMW Serie 3 2020 en excellent état"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
            maxLength={50}
            data-testid="input-title"
          />
          <p className="mt-2 text-sm text-gray-500">
            {title.length}/50 caractères
          </p>
        </div>

        {needsRegistrationNumber && onRegistrationNumberChange && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro d'immatriculation (optionnel)
            </label>
            <input
              type="text"
              value={registrationNumber || ""}
              onChange={(e) => onRegistrationNumberChange(e.target.value.toUpperCase())}
              placeholder="Ex: AB-123-CD"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent uppercase"
              data-testid="input-registration-number"
            />
            <p className="mt-2 text-sm text-gray-500">
              Permet de récupérer automatiquement les données du véhicule
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
