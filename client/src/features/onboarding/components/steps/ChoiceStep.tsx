import { useState } from "react";
import { User, Building2 } from "lucide-react";
import { StepProps } from "../../types";
import { StepButtons } from "../shared/StepButtons";

type AccountType = "individual" | "professional";

export const ChoiceStep = ({
  currentData,
  onComplete,
  onSkip,
}: StepProps) => {
  const [selectedType, setSelectedType] = useState<AccountType | null>(
    currentData?.accountType as AccountType || null
  );

  const handleContinue = () => {
    if (selectedType) {
      onComplete({ accountType: selectedType });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Choisissez votre type de compte
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sélectionnez le type de compte qui correspond à votre utilisation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte Compte Individuel */}
        <button
          type="button"
          onClick={() => setSelectedType("individual")}
          className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
            selectedType === "individual"
              ? "border-primary-bolt-500 bg-primary-bolt-50 shadow-lg"
              : "border-gray-300 hover:border-gray-400 hover:shadow-md"
          }`}
          data-testid="button-account-individual"
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-lg ${
                selectedType === "individual"
                  ? "bg-primary-bolt-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Compte Individuel
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Pour les particuliers qui souhaitent acheter ou vendre
                occasionnellement
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-500">
                <li>• 5 annonces gratuites</li>
                <li>• Accès aux services de base</li>
                <li>• Messagerie directe</li>
              </ul>
              <div><br></br><p>Gratuit</p></div>
            </div>
          </div>
          {selectedType === "individual" && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary-bolt-500 text-white rounded-full p-1">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* Carte Compte Professionnel */}
        <button
          type="button"
          onClick={() => setSelectedType("professional")}
          className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
            selectedType === "professional"
              ? "border-primary-bolt-500 bg-primary-bolt-50 shadow-lg"
              : "border-gray-300 hover:border-gray-400 hover:shadow-md"
          }`}
          data-testid="button-account-professional"
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-lg ${
                selectedType === "professional"
                  ? "bg-primary-bolt-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Compte Professionnel
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Pour les entreprises et professionnels du secteur automobile
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-500">
                <li>• Annonces illimitées (selon abonnement)</li>
                <li>• Page Boutique PRO</li>
                <li>• Badge de Confiance</li>                
                <li>• Outils de gestion avancés</li>
              </ul>
              <div><br></br><p>A partir de 19,90 €/Mois</p></div>
              
            </div>
          </div>
          {selectedType === "professional" && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary-bolt-500 text-white rounded-full p-1">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>
      </div>

      <StepButtons
        onContinue={handleContinue}
        continueDisabled={!selectedType}
        showBack={false}
      />

      {onSkip && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            data-testid="button-skip-onboarding"
          >
            Ignorer pour le moment
          </button>
        </div>
      )}
    </div>
  );
};
