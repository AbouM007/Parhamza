import type { FormData as ListingFormData } from "../types";

interface SummaryStepProps {
  formData: ListingFormData;
  onPublish: () => void;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  formData,
  onPublish,
}) => {
  const getPhotoUrl = (photo: File | string): string => {
    if (typeof photo === "string") {
      return photo;
    }
    return URL.createObjectURL(photo);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Récapitulatif de votre annonce
        </h2>
        <p className="text-gray-600">
          Vérifiez les informations avant de publier
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations générales
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Type d'annonce:</span>
              <span className="ml-2 font-medium">
                {formData.listingType === "sale" ? "Vente" : "Recherche"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Catégorie:</span>
              <span className="ml-2 font-medium">{formData.category}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Titre:</span>
              <span className="ml-2 font-medium">{formData.title}</span>
            </div>
            {formData.condition && (
              <div>
                <span className="text-sm text-gray-600">État:</span>
                <span className="ml-2 font-medium">{formData.condition}</span>
              </div>
            )}
          </div>
        </div>

        {formData.description && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Description
            </h3>
            <p className="text-gray-700">{formData.description}</p>
          </div>
        )}

        {formData.photos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Photos ({formData.photos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={getPhotoUrl(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {formData.price > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prix</h3>
            <p className="text-2xl font-bold text-primary-bolt-500">
              {formData.price.toLocaleString("fr-FR")} €
            </p>
          </div>
        )}

        {formData.location.city && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Localisation
            </h3>
            <p className="text-gray-700">
              {formData.location.city} ({formData.location.postalCode})
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
          <div className="space-y-2">
            {formData.contact.showPhone && formData.contact.phone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Téléphone:</span>
                <span className="font-medium">{formData.contact.phone}</span>
              </div>
            )}
            {formData.contact.showWhatsapp && formData.contact.whatsapp && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">WhatsApp:</span>
                <span className="font-medium">{formData.contact.whatsapp}</span>
              </div>
            )}
            {formData.contact.showInternal && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Messagerie interne activée
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onPublish}
          className="w-full py-4 bg-primary-bolt-500 text-white font-semibold rounded-lg hover:bg-primary-bolt-600 transition-colors text-lg"
          data-testid="button-publish"
        >
          Publier l'annonce
        </button>
      </div>
    </div>
  );
};
