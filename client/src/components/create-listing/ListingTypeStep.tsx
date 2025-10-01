import { Check } from "lucide-react";
import { CTA_ICONS } from "@/data/categories";

export type ListingTypeValue = "sale" | "search";

interface ListingTypeStepProps {
  value: ListingTypeValue | "";
  onSelect: (value: ListingTypeValue) => void;
}

const OPTIONS: Array<{ id: ListingTypeValue; title: string; description: string; icon: string }> = [
  {
    id: "sale",
    title: "Je vends",
    description:
      "Déposer une annonce pour vendre un véhicule, une pièce détachée ou proposer un service",
    icon: CTA_ICONS.sell,
  },
  {
    id: "search",
    title: "Je cherche",
    description:
      "Publier une demande de recherche pour trouver un véhicule, une pièce ou un service spécifique",
    icon: CTA_ICONS.search,
  },
];

export const ListingTypeStep: React.FC<ListingTypeStepProps> = ({ value, onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Type d'annonce</h2>
        <p className="text-gray-600">Que souhaitez-vous faire ?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            type="button"
            className={`relative p-8 rounded-2xl border-2 transition-all duration-200 text-center ${
              value === option.id
                ? "border-primary-bolt-500 bg-primary-bolt-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                <img src={option.icon} alt={option.title} className="w-18 h-18" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
            <p className="text-sm text-gray-600">{option.description}</p>

            {value === option.id && (
              <div className="absolute top-4 right-4">
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
