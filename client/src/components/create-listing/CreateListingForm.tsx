import { CATEGORIES } from "@/data/categories";

import { useFormData } from "./hooks/useFormData";
import { useFormNavigation } from "./hooks/useFormNavigation";
import { useFormSubmission } from "./hooks/useFormSubmission";
import type { CreateListingFormProps } from "./types";

import { ListingTypeStep } from "./ListingTypeStep";
import { CategoryStep } from "./CategoryStep";
import { SubcategoryStep } from "./steps/SubcategoryStep";
import { ConditionStep } from "./steps/ConditionStep";
import { TitleStep } from "./steps/TitleStep";
import { SpecificDetailsStep } from "./steps/SpecificDetailsStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { PhotosStep } from "./steps/PhotosStep";
import { PriceStep } from "./steps/PriceStep";
import { LocationStep } from "./steps/LocationStep";
import { ContactStep } from "./steps/ContactStep";
import { SummaryStep } from "./steps/SummaryStep";
import { PublishSuccessModal } from "../PublishSuccessModal";
import { BoostModal } from "../BoostModal";
import { PlateBlurModal } from "../PlateBlurModal";
import { useQuota } from "@/hooks/useQuota";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export const CreateListingForm: React.FC<CreateListingFormProps> = ({
  onSuccess,
}) => {
  const { profile } = useAuth();
  const { data: quotaInfo } = useQuota(profile?.id);

  const {
    formData,
    setFormData,
    updateFormData,
    updateSpecificDetails,
  } = useFormData();

  const {
    currentStep,
    totalSteps,
    canProceed,
    nextStepHandler,
    prevStepHandler,
  } = useFormNavigation({ formData, setFormData });

  const {
    showSuccessModal,
    setShowSuccessModal,
    showBoostModal,
    setShowBoostModal,
    createdVehicle,
    blurredImages,
    plateBlurModal,
    setPlateBlurModal,
    handlePhotoUpload,
    removePhoto,
    handleBlurPlate,
    handleApplyMask,
    publishListing,
    handleBoostListing,
  } = useFormSubmission({ formData, setFormData, onSuccess });

  const selectedCategory = CATEGORIES.find((c) => c.id === formData.category);

  const handleLocationChange = (
    field: "city" | "postalCode",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleContactChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ListingTypeStep
            value={formData.listingType}
            onSelect={(value) => updateFormData("listingType", value)}
          />
        );

      case 2:
        return (
          <CategoryStep
            categories={CATEGORIES}
            selectedCategoryId={formData.category}
            listingType={formData.listingType}
            onSelect={(categoryId) => updateFormData("category", categoryId)}
          />
        );

      case 3:
        if (!selectedCategory) return null;
        return (
          <SubcategoryStep
            category={selectedCategory}
            selectedSubcategoryId={formData.subcategory}
            onSelect={(subcategoryId) =>
              updateFormData("subcategory", subcategoryId)
            }
          />
        );

      case 4:
        return (
          <ConditionStep
            value={formData.condition}
            onSelect={(value) => updateFormData("condition", value)}
          />
        );

      case 5:
        return (
          <TitleStep
            title={formData.title}
            onTitleChange={(value) => updateFormData("title", value)}
          />
        );

      case 6:
        return (
          <SpecificDetailsStep
            subcategory={formData.subcategory}
            specificDetails={formData.specificDetails}
            onUpdate={updateSpecificDetails}
            isSearchListing={formData.listingType === "search"}
            isServiceCategory={
              formData.subcategory === "reparation" ||
              formData.subcategory === "remorquage" ||
              formData.subcategory === "entretien" ||
              formData.subcategory === "autre-service"
            }
          />
        );

      case 7:
        return (
          <DescriptionStep
            description={formData.description}
            onDescriptionChange={(value) =>
              updateFormData("description", value)
            }
          />
        );

      case 8:
        return (
          <PhotosStep
            photos={formData.photos}
            onPhotoUpload={handlePhotoUpload}
            onRemovePhoto={removePhoto}
            onBlurPlate={handleBlurPlate}
            blurredImages={blurredImages}
          />
        );

      case 9:
        return (
          <PriceStep
            price={formData.price}
            onPriceChange={(value) => updateFormData("price", value)}
            isSearchListing={formData.listingType === "search"}
          />
        );

      case 10:
        return (
          <LocationStep
            location={formData.location}
            onLocationChange={handleLocationChange}
          />
        );

      case 11:
        return (
          <ContactStep
            contact={formData.contact}
            onContactChange={handleContactChange}
          />
        );

      case 12:
        return <SummaryStep formData={formData} onPublish={publishListing} />;

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    if (formData.listingType === "sale") return "Vente - Déposer une annonce";
    if (formData.listingType === "search")
      return "Recherche - Déposer une annonce";
    return "Déposer une annonce";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {getStepTitle()}
              </h1>
              <span className="text-sm font-medium text-gray-600">
                Étape {currentStep} sur {totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-32">
            {renderStepContent()}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t shadow-lg px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={prevStepHandler}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-previous"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Précédent</span>
          </button>

          {currentStep === 12 ? (
            <button
              onClick={publishListing}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              data-testid="button-publish-final"
            >
              <Check className="h-4 w-4" />
              <span>Publier l'annonce</span>
            </button>
          ) : (
            <button
              onClick={nextStepHandler}
              disabled={!canProceed()}
              className="flex items-center space-x-2 bg-primary-bolt-500 hover:bg-primary-bolt-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-next"
            >
              <span>Suivant</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <PlateBlurModal
        isOpen={plateBlurModal.isOpen}
        onClose={() =>
          setPlateBlurModal({ isOpen: false, photoIndex: -1, imageUrl: "" })
        }
        imageUrl={plateBlurModal.imageUrl}
        onApplyMask={handleApplyMask}
      />

      <PublishSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          handleBoostListing();
        }}
        vehicleTitle={createdVehicle?.title || ""}
      />

      <BoostModal
        isOpen={showBoostModal}
        onClose={() => {
          setShowBoostModal(false);
          if (onSuccess) onSuccess();
        }}
        vehicleId={createdVehicle?.id || ""}
        quotaInfo={quotaInfo}
      />
    </div>
  );
};
