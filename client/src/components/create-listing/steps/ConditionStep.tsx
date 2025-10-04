import { Check } from "lucide-react";

type ConditionValue =
  | "neuf"
  | "occasion"
  | "damaged"
  | "tres_bon_etat"
  | "bon_etat"
  | "etat_moyen"
  | "pour_pieces";

interface ConditionStepProps {
  value: ConditionValue | undefined;
  onSelect: (value: ConditionValue) => void;
}

const OPTIONS: Array<{ id: ConditionValue; title: string; description: string }> = [
  {
    id: "neuf",
    title: "Neuf",
    description: "Véhicule neuf ou jamais utilisé",
  },
  {
    id: "tres_bon_etat",
    title: "Très bon état",
    description: "Véhicule en excellent état, bien entretenu",
  },
  {
    id: "bon_etat",
    title: "Bon état",
    description: "Véhicule en bon état général",
  },
  {
    id: "etat_moyen",
    title: "État moyen",
    description: "Véhicule fonctionnel avec quelques défauts",
  },
  {
    id: "damaged",
    title: "Accidenté / Endommagé",
    description: "Véhicule ayant subi des dommages",
  },
  {
    id: "pour_pieces",
    title: "Pour pièces",
    description: "Véhicule destiné à être démantelé",
  },
];

export const ConditionStep: React.FC<ConditionStepProps> = ({ value, onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">État du bien</h2>
        <p className="text-gray-600">Sélectionnez l'état général du véhicule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            type="button"
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              value === option.id
                ? "border-primary-bolt-500 bg-primary-bolt-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
            data-testid={`button-condition-${option.id}`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
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
