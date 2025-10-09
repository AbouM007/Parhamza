import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Edit2 } from 'lucide-react';

interface VehicleAPIData {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  power?: string | null;
  engineSize?: string | null;
  doors?: string | null;
  bodyType?: string | null;
  color?: string | null;
  co2?: number | null;
  fiscalHorsepower?: number | null;
  cylinders?: string | null;
  genreVCG?: string | null;
}

interface DataValidationStepProps {
  apiData: VehicleAPIData;
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  brands: string[];
  models: string[];
  fuelTypes: Array<{ value: string; label: string }>;
  transmissionTypes: Array<{ value: string; label: string }>;
  colors: string[];
  doors: string[];
  bodyTypes: string[];
  equipmentOptions: string[];
  emissionClasses?: Array<{ value: string; label: string }>;
  onToggleEquipment: (equipment: string) => void;
}

export const DataValidationStep: React.FC<DataValidationStepProps> = ({
  apiData,
  formData,
  onFieldChange,
  brands,
  models,
  fuelTypes,
  transmissionTypes,
  colors,
  doors,
  bodyTypes,
  equipmentOptions,
  emissionClasses,
  onToggleEquipment,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  // Initialiser les champs depuis l'API au montage
  useEffect(() => {
    if (apiData.brand && !formData.brand) onFieldChange('brand', apiData.brand);
    if (apiData.model && !formData.model) onFieldChange('model', apiData.model);
    if (apiData.year && !formData.year) onFieldChange('year', apiData.year);
    if (apiData.fuel && !formData.fuelType) onFieldChange('fuelType', apiData.fuel);
    if (apiData.transmission && !formData.transmission) onFieldChange('transmission', apiData.transmission);
    if (apiData.power && !formData.power) {
      const powerValue = parseInt(apiData.power);
      if (!isNaN(powerValue)) onFieldChange('power', powerValue);
    }
    if (apiData.engineSize && !formData.engineSize) onFieldChange('engineSize', apiData.engineSize);
    if (apiData.doors && !formData.doors) onFieldChange('doors', apiData.doors);
    if (apiData.bodyType && !formData.bodyType) onFieldChange('bodyType', apiData.bodyType);
    if (apiData.color && !formData.color) onFieldChange('color', apiData.color);
  }, [apiData]);

  const renderField = (
    label: string,
    field: string,
    value: any,
    type: 'text' | 'select' | 'number' = 'text',
    options?: Array<{ value: string; label: string } | string>
  ) => {
    const hasValue = value && value !== '';
    const isFromAPI = apiData[field as keyof VehicleAPIData];

    return (
      <div className="space-y-2" data-testid={`field-${field}`}>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>{label}</span>
          {hasValue ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          )}
        </label>

        {type === 'select' && options && Array.isArray(options) ? (
          <select
            value={value || ''}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasValue ? 'border-gray-300' : 'border-amber-300 bg-amber-50'
            }`}
            data-testid={`select-${field}`}
          >
            <option value="">Sélectionnez...</option>
            {options.map((opt, index) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={`${field}-${optValue}-${index}`} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onFieldChange(field, type === 'number' ? parseInt(e.target.value) || '' : e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasValue ? 'border-gray-300' : 'border-amber-300 bg-amber-50'
            }`}
            placeholder={isFromAPI ? 'Valeur de l\'API' : 'À compléter'}
            data-testid={`input-${field}`}
          />
        )}

        {isFromAPI && (
          <p className="text-xs text-gray-500">
            ✓ Récupéré automatiquement
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vérifiez les informations
        </h2>
        {apiData.brand && apiData.model && (
          <p className="text-xl font-semibold text-teal-600 mb-2">
            {apiData.brand} {apiData.model}
          </p>
        )}
        <p className="text-gray-600">
          Les données ont été récupérées automatiquement. Vérifiez et complétez si nécessaire.
        </p>
      </div>

      {/* Grille de champs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('Marque', 'brand', formData.brand, 'select', brands)}
          {renderField('Modèle', 'model', formData.model, 'select', models)}
          {renderField('Année', 'year', formData.year, 'number')}
          {renderField('Carburant', 'fuelType', formData.fuelType, 'select', fuelTypes)}
          {renderField('Transmission', 'transmission', formData.transmission, 'select', transmissionTypes)}
          {renderField('Puissance (CH)', 'power', formData.power, 'number')}
          {renderField('Cylindrée', 'engineSize', formData.engineSize)}
          {renderField('Portes', 'doors', formData.doors, 'select', doors)}
          {renderField('Type de carrosserie', 'bodyType', formData.bodyType, 'select', bodyTypes)}
          {renderField('Couleur', 'color', formData.color, 'select', colors)}
          {renderField('Kilométrage (km)', 'mileage', formData.mileage, 'number')}
          {emissionClasses && renderField('Classe d\'émission', 'emissionClass', formData.emissionClass, 'select', emissionClasses)}
        </div>

        {/* Équipements/Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Équipements et options
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez les équipements présents sur votre véhicule
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {equipmentOptions.map((equipment) => (
              <label
                key={equipment}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                data-testid={`equipment-${equipment}`}
              >
                <input
                  type="checkbox"
                  checked={formData.equipment?.includes(equipment) || false}
                  onChange={() => onToggleEquipment(equipment)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{equipment}</span>
              </label>
            ))}
          </div>
          {formData.equipment && formData.equipment.length > 0 && (
            <p className="mt-3 text-sm text-teal-600">
              ✓ {formData.equipment.length} équipement{formData.equipment.length > 1 ? 's' : ''} sélectionné{formData.equipment.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Information */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce :</strong> Les champs marqués ✓ ont été récupérés automatiquement. Vous pouvez les modifier si nécessaire.
        </p>
      </div>
    </div>
  );
};
