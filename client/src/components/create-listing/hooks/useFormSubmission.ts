import { useState } from "react";
import type { FormData as ListingFormData } from "../types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuota } from "@/hooks/useQuota";

interface UseFormSubmissionOptions {
  formData: ListingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
  onSuccess?: () => void;
}

export const useFormSubmission = ({
  formData,
  setFormData,
  onSuccess,
}: UseFormSubmissionOptions) => {
  const { user, profile } = useAuth();
  const { data: quotaInfo } = useQuota(profile?.id);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [createdVehicle, setCreatedVehicle] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [blurredImages, setBlurredImages] = useState<Set<number>>(new Set());
  const [plateBlurModal, setPlateBlurModal] = useState<{
    isOpen: boolean;
    photoIndex: number;
    imageUrl: string;
  }>({
    isOpen: false,
    photoIndex: -1,
    imageUrl: "",
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 4 - formData.photos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    try {
      const uploadFormData = new FormData();
      filesToAdd.forEach((file) => {
        uploadFormData.append("images", file);
      });

      const userId = profile?.id || "anonymous";
      const response = await fetch(`/api/images/upload/${userId}`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error("Échec de l'upload");
      }

      const data = await response.json();

      if (data.success && data.images) {
        const newImageUrls = data.images.map((img: any) => img.url);
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newImageUrls],
        }));
        console.log("Images uploadées avec succès:", newImageUrls);
      } else {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...filesToAdd],
        }));
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...filesToAdd],
      }));
    }

    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleBlurPlate = async (index: number) => {
    const photo = formData.photos[index];
    let imageUrl: string;

    if (typeof photo !== "string") {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("images", photo);

        const uploadResponse = await fetch(`/api/images/upload/${user?.id}`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Erreur upload image");
        }

        const { images } = await uploadResponse.json();
        imageUrl = images[0].url;

        setFormData((prev) => {
          const newPhotos = [...prev.photos];
          newPhotos[index] = imageUrl;
          return {
            ...prev,
            photos: newPhotos,
          };
        });
      } catch (error) {
        console.error("Erreur upload image:", error);
        alert("Erreur lors de l'upload de l'image. Veuillez réessayer.");
        return;
      }
    } else {
      imageUrl = photo;
    }

    setPlateBlurModal({
      isOpen: true,
      photoIndex: index,
      imageUrl,
    });
  };

  const handleApplyMask = async (maskData: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    angle: number;
  }) => {
    try {
      const { photoIndex, imageUrl } = plateBlurModal;

      const response = await fetch("/api/images/apply-mask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          mask: maskData,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'application du masque");
      }

      const { maskedImageUrl } = await response.json();

      setFormData((prev) => {
        const newPhotos = [...prev.photos];
        newPhotos[photoIndex] = maskedImageUrl;
        return {
          ...prev,
          photos: newPhotos,
        };
      });

      setBlurredImages((prev) => new Set(prev).add(photoIndex));
      setPlateBlurModal({ isOpen: false, photoIndex: -1, imageUrl: "" });
    } catch (error) {
      console.error("Erreur application masque:", error);
      alert("Erreur lors de l'application du masque. Veuillez réessayer.");
    }
  };

  const publishListing = async () => {
    try {
      if (quotaInfo && !quotaInfo.canCreate) {
        alert(
          quotaInfo.message ||
            "Vous avez atteint votre limite d'annonces. Passez à un plan supérieur pour publier plus d'annonces.",
        );
        return;
      }

      console.log("Publier l'annonce:", formData);

      const vehicleData = {
        userId: profile?.id || user?.id,
        title: formData.title || "",
        description: formData.description || "",
        category: formData.subcategory || "",
        subcategory: formData.subcategory || "",
        brand: formData.specificDetails.brand || "Non spécifié",
        model: formData.specificDetails.model || "Non spécifié",
        year: formData.specificDetails.year
          ? parseInt(formData.specificDetails.year.toString())
          : new Date().getFullYear(),
        mileage: formData.specificDetails.mileage || 0,
        fuelType: formData.specificDetails.fuelType || "Non spécifié",
        condition: formData.condition || "good",
        price: formData.price || 0,
        location: formData.location || "",
        images:
          formData.photos?.map((photo) =>
            typeof photo === "string" ? photo : URL.createObjectURL(photo),
          ) || [],
        features: formData.specificDetails.equipment || [],
        damageDetails:
          formData.condition === "damaged"
            ? {
                damageTypes: formData.specificDetails.damageTypes || [],
                mechanicalState: formData.specificDetails.mechanicalState || "",
                severity: formData.specificDetails.damageSeverity || "",
              }
            : null,
        contactPhone: formData.contact.phone || "",
        contactEmail: formData.contact.email || "",
        contactWhatsapp: formData.contact.whatsapp || "",
        hidePhone: !formData.contact.showPhone,
        isPremium: false,
        status: "draft",
        listingType: formData.listingType || "sale",
      };

      console.log(
        "🔍 FRONTEND - vehicleData avant envoi:",
        JSON.stringify(vehicleData, null, 2),
      );

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const newVehicle = await response.json();
        console.log("Annonce créée avec succès:", newVehicle);

        setCreatedVehicle({
          id: newVehicle.id?.toString() || "",
          title: newVehicle.title || formData.title,
        });

        setShowSuccessModal(true);
      } else {
        throw new Error("Erreur lors de la création de l'annonce");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la publication de l'annonce. Veuillez réessayer.");
    }
  };

  const navigateToDashboard = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleContinueNavigating = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleBoostListing = () => {
    setShowSuccessModal(false);
    setShowBoostModal(true);
  };

  return {
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
    navigateToDashboard,
    handleContinueNavigating,
    handleBoostListing,
  };
};
