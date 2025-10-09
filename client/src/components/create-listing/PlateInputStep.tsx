import { useState } from 'react';
import { Search, Edit3, AlertCircle } from 'lucide-react';

interface PlateInputStepProps {
  registrationNumber: string;
  onRegistrationNumberChange: (value: string) => void;
  onSearchClick: () => void;
  onManualClick: () => void;
  isLoading?: boolean;
  error?: string;
}

export const PlateInputStep: React.FC<PlateInputStepProps> = ({
  registrationNumber,
  onRegistrationNumberChange,
  onSearchClick,
  onManualClick,
  isLoading = false,
  error,
}) => {
  const [localValue, setLocalValue] = useState(registrationNumber);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setLocalValue(value);
    onRegistrationNumberChange(value);
  };

  const handleSearchClick = () => {
    if (localValue.trim().length >= 5) {
      onSearchClick();
    }
  };

  const isValidPlate = localValue.trim().length >= 5;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Numéro d'immatriculation
        </h2>
        <p className="text-gray-600">
          Nous allons récupérer automatiquement les informations de votre véhicule
        </p>
      </div>

      {/* Champ plaque */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Plaque d'immatriculation
        </label>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="AA-123-BC ou FY067NE"
          className="w-full px-4 py-3 text-lg font-mono uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="input-registration-number"
        />
        
        {error && (
          <div className="mt-3 flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="space-y-4">
        {/* Bouton rechercher */}
        <button
          onClick={handleSearchClick}
          disabled={!isValidPlate || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          data-testid="button-search-vehicle-data"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Recherche en cours...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Rechercher les données du véhicule</span>
            </>
          )}
        </button>

        {/* Séparateur */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 text-gray-500">ou</span>
          </div>
        </div>

        {/* Bouton saisie manuelle */}
        <button
          onClick={onManualClick}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-6 py-4 rounded-xl font-semibold border-2 border-gray-300 transition-all duration-200"
          data-testid="button-manual-entry"
        >
          <Edit3 className="w-5 h-5" />
          <span>Saisir manuellement les informations</span>
        </button>
      </div>

      {/* Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce :</strong> La recherche automatique vous fait gagner du temps en pré-remplissant les caractéristiques techniques de votre véhicule.
        </p>
      </div>
    </div>
  );
};
