import { AddressInput } from "../../AddressInput";

interface LocationStepProps {
  location: {
    city: string;
    postalCode: string;
  };
  onLocationChange: (field: "city" | "postalCode", value: string) => void;
}

export const LocationStep: React.FC<LocationStepProps> = ({
  location,
  onLocationChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Localisation</h2>
        <p className="text-gray-600">Où se trouve votre bien ?</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <AddressInput
          city={location.city}
          postalCode={location.postalCode}
          onCityChange={(value) => onLocationChange("city", value)}
          onPostalCodeChange={(value) => onLocationChange("postalCode", value)}
        />

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🔒 Protection de la vie privée
          </h3>
          <p className="text-sm text-blue-800">
            Seule votre ville et code postal seront affichés publiquement.
            Votre adresse complète reste confidentielle.
          </p>
        </div>
      </div>
    </div>
  );
};
