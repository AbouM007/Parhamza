import { Camera, X, EyeOff } from "lucide-react";

interface PhotosStepProps {
  photos: (File | string)[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onBlurPlate?: (index: number) => void;
  blurredImages?: Set<number>;
}

export const PhotosStep: React.FC<PhotosStepProps> = ({
  photos,
  onPhotoUpload,
  onRemovePhoto,
  onBlurPlate,
  blurredImages = new Set(),
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos</h2>
        <p className="text-gray-600">
          Ajoutez jusqu'à 4 photos de qualité (optionnel)
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
            >
              <img
                src={getPhotoUrl(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {onBlurPlate && !blurredImages.has(index) && (
                  <button
                    type="button"
                    onClick={() => onBlurPlate(index)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    title="Flouter la plaque"
                    data-testid={`button-blur-plate-${index}`}
                  >
                    <EyeOff className="h-4 w-4 text-gray-700" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  data-testid={`button-remove-photo-${index}`}
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
              {blurredImages.has(index) && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                  Plaque floutée
                </div>
              )}
            </div>
          ))}

          {photos.length < 4 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-bolt-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">Ajouter</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotoUpload}
                className="hidden"
                data-testid="input-photo-upload"
              />
            </label>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center">
          {photos.length}/4 photos • Les photos de qualité attirent plus d'acheteurs
        </p>
      </div>
    </div>
  );
};
