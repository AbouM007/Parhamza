import { CheckCircle2, X, Car } from "lucide-react";

interface VehicleDataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleData: {
    brand?: string;
    model?: string;
    year?: string;
    fuelType?: string;
    transmission?: string;
    color?: string;
    engineSize?: string;
    doors?: string;
    co2?: string;
    fiscalPower?: string;
  };
  registrationNumber: string;
}

export function VehicleDataPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  vehicleData,
  registrationNumber,
}: VehicleDataPreviewModalProps) {
  if (!isOpen) return null;

  const fuelTypeLabels: { [key: string]: string } = {
    gasoline: "Essence",
    diesel: "Diesel",
    electric: "Électrique",
    hybrid: "Hybride",
    gpl: "GPL",
  };

  const transmissionLabels: { [key: string]: string } = {
    manual: "Manuelle",
    automatic: "Automatique",
    "semi-automatic": "Semi-automatique",
  };

  const dataFields = [
    { label: "Marque", value: vehicleData.brand },
    { label: "Modèle", value: vehicleData.model },
    { label: "Année", value: vehicleData.year },
    {
      label: "Carburant",
      value: vehicleData.fuelType
        ? fuelTypeLabels[vehicleData.fuelType] || vehicleData.fuelType
        : undefined,
    },
    {
      label: "Transmission",
      value: vehicleData.transmission
        ? transmissionLabels[vehicleData.transmission] ||
          vehicleData.transmission
        : undefined,
    },
    { label: "Couleur", value: vehicleData.color },
    {
      label: "Cylindrée",
      value: vehicleData.engineSize ? `${vehicleData.engineSize} cm³` : undefined,
    },
    { label: "Portes", value: vehicleData.doors },
    {
      label: "CO2",
      value: vehicleData.co2 ? `${vehicleData.co2} g/km` : undefined,
    },
    {
      label: "Puissance fiscale",
      value: vehicleData.fiscalPower ? `${vehicleData.fiscalPower} CV` : undefined,
    },
  ];

  const availableFields = dataFields.filter((field) => field.value);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-bolt-100 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-bolt-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Données récupérées
                </h2>
                <p className="text-sm text-gray-500">
                  Plaque : {registrationNumber.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              data-testid="button-close-preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-primary-bolt-50 to-primary-bolt-100 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg text-primary-bolt-900 mb-1">
              {vehicleData.brand} {vehicleData.model}
            </h3>
            {vehicleData.year && (
              <p className="text-sm text-primary-bolt-700">
                Année : {vehicleData.year}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              {availableFields.length} champ{availableFields.length > 1 ? "s" : ""}{" "}
              disponible{availableFields.length > 1 ? "s" : ""} :
            </p>
            <div className="grid grid-cols-2 gap-3">
              {availableFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Vous pourrez modifier ces informations après le pré-remplissage.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              data-testid="button-cancel-autofill"
            >
              <X className="w-4 h-4 inline mr-2" />
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white rounded-xl transition-colors font-semibold shadow-lg hover:shadow-xl"
              data-testid="button-confirm-autofill"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Confirmer et remplir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
