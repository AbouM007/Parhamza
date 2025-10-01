import { Check } from "lucide-react";

import type { CategoryDefinition } from "@/data/categories";

interface CategoryStepProps {
  categories: CategoryDefinition[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  listingType: "sale" | "search" | "";
}

export const CategoryStep: React.FC<CategoryStepProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  listingType,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez une catégorie
        </h2>
        <p className="text-gray-600">
          Sélectionnez la catégorie qui correspond le mieux à votre {listingType === "sale" ? "annonce" : "recherche"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              type="button"
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedCategoryId === category.id
                  ? "border-primary-bolt-500 bg-primary-bolt-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${category.color} shadow-lg flex items-center justify-center`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.subcategories.map((sub) => sub.name).join(", ")}
                  </p>
                </div>
              </div>

              {selectedCategoryId === category.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary-bolt-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
