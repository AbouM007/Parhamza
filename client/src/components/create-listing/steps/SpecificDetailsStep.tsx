import { getFieldsForSubcategory, type FieldDescriptor } from "../registry/specificDetailsRegistry";

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-heading-specific-details">
            Détails spécifiques
          </h2>
          <p className="text-gray-600" data-testid="text-description-specific-details">
            {isSearchListing
              ? "Détails optionnels pour votre recherche"
              : "Configuration de votre service"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600" data-testid="text-optional-step">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-heading-specific-details">
            Détails spécifiques
          </h2>
          <p className="text-gray-600" data-testid="text-description-specific-details">
            Aucun détail spécifique requis
          </p>
        </div>
      </div>
    );
  }

  const renderField = (field: FieldDescriptor) => {
    const value = specificDetails[field.id] ?? "";

    switch (field.type) {
      case "text":
      case "number":
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label} {field.required && "*"}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => {
                if (field.type === "number") {
                  const val = e.target.value;
                  onUpdate(field.id, val === "" ? undefined : Number(val));
                } else {
                  onUpdate(field.id, e.target.value || undefined);
                }
              }}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
              data-testid={`input-${field.id}`}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label} {field.required && "*"}
            </label>
            <select
              value={value}
              onChange={(e) => onUpdate(field.id, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
              data-testid={`select-${field.id}`}
            >
              <option value="">Sélectionnez...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label} {field.required && "*"}
            </label>
            <textarea
              value={value}
              onChange={(e) => onUpdate(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent"
              data-testid={`textarea-${field.id}`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-heading-specific-details">
          Détails spécifiques
        </h2>
        <p className="text-gray-600" data-testid="text-description-specific-details">
          Remplissez les informations techniques
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(renderField)}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800" data-testid="text-info-fields">
            💡 Les champs marqués d'une * sont obligatoires
          </p>
        </div>
      </div>
    </div>
  );
};
