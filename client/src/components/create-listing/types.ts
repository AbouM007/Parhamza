import { ListingTypeValue } from "./ListingTypeStep";

export interface FormData {
  listingType: ListingTypeValue | "";
  category: string;
  condition?:
    | "neuf"
    | "occasion"
    | "damaged"
    | "tres_bon_etat"
    | "bon_etat"
    | "etat_moyen"
    | "pour_pieces";
  subcategory: string;
  title: string;
  registrationNumber?: string;
  specificDetails: Record<string, any>;
  description: string;
  photos: (File | string)[];
  price: number;
  location: {
    city: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    showPhone: boolean;
    showWhatsapp: boolean;
    showInternal: boolean;
  };
  premiumPack: string;
}

export interface CreateListingFormProps {
  onSuccess?: () => void;
}

export interface StepComponentProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
  updateSpecificDetails?: (field: string, value: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
}
