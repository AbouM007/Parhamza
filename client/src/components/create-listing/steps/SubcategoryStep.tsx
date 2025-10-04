import { Check } from "lucide-react";

import type { CategoryDefinition } from "@/data/categories";

interface SubcategoryStepProps {
  category: CategoryDefinition;
  selectedSubcategoryId: string;
  onSelect: (subcategoryId: string) => void;
}

export const SubcategoryStep: React.FC<SubcategoryStepProps> = ({
  category,
  selectedSubcategoryId,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez une sous-famille
        </h2>
        <p className="text-gray-600">
          Précisez le type de {category.name.toLowerCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            onClick={() => onSelect(subcategory.id)}
            type="button"
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
              selectedSubcategoryId === subcategory.id
                ? "border-primary-bolt-500 bg-primary-bolt-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
            data-testid={`button-subcategory-${subcategory.id}`}
          >
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3">
              {subcategory.image ? (
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="h-14 w-14 object-contain"
                />
              ) : (
                <div
                  className={`w-12 h-12 ${subcategory.bgColor ?? "bg-gray-100"} rounded-xl flex items-center justify-center`}
                >
                  <div className={`h-6 w-6 ${subcategory.color}`}>⚪</div>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>

            {selectedSubcategoryId === subcategory.id && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-primary-bolt-500 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
