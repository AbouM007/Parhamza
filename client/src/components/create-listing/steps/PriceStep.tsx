interface PriceStepProps {
  price: number;
  onPriceChange: (value: number) => void;
  isSearchListing?: boolean;
}

export const PriceStep: React.FC<PriceStepProps> = ({
  price,
  onPriceChange,
  isSearchListing = false,
}) => {
  if (isSearchListing) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prix</h2>
          <p className="text-gray-600">
            Pour une recherche, le prix est optionnel
          </p>
        </div>

        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-600">
            Vous pouvez passer cette étape ou indiquer un budget maximum
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prix de vente</h2>
        <p className="text-gray-600">Indiquez le prix souhaité pour votre bien</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prix *
          </label>
          <div className="relative">
            <input
              type="number"
              value={price || ""}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              placeholder="0"
              min="0"
              step="100"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-bolt-500 focus:border-transparent text-lg"
              data-testid="input-price"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              €
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Conseil de prix
          </h3>
          <p className="text-sm text-blue-800">
            Un prix compétitif et réaliste augmente vos chances de vendre rapidement.
            Consultez des annonces similaires pour vous faire une idée du marché.
          </p>
        </div>
      </div>
    </div>
  );
};
