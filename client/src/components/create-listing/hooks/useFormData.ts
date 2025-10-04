import { useState, useEffect } from "react";
import { FormData } from "../types";
import { COUNTRY_CODES } from "@/data/contact";
import { useAuth } from "@/contexts/AuthContext";

const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    for (const country of COUNTRY_CODES) {
      if (cleaned.startsWith(country.code)) {
        const withoutPrefix = cleaned.slice(country.code.length);
        if (
          withoutPrefix.length >= country.length - 1 &&
          withoutPrefix.length <= country.length + 1
        ) {
          const paddedNumber = withoutPrefix.padEnd(country.length, "");
          return `${country.code} ${country.format(paddedNumber.slice(0, country.length))}`;
        }
      }
    }
    return cleaned;
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    const withoutZero = cleaned.slice(1);
    return `+33 ${withoutZero.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
  }

  if (cleaned.length === 9 && !cleaned.startsWith("0")) {
    return `+33 ${cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
  }

  if (cleaned.length > 0 && !cleaned.startsWith("+")) {
    return `+33 ${cleaned}`;
  }

  return cleaned;
};

const initializeFormData = (): FormData => ({
  listingType: "",
  category: "",
  subcategory: "",
  title: "",
  registrationNumber: "",
  specificDetails: {},
  description: "",
  photos: [],
  price: 0,
  location: { city: "", postalCode: "" },
  contact: {
    phone: "",
    email: "",
    hidePhone: false,
    whatsapp: "",
    sameAsPhone: false,
    showPhone: true,
    showWhatsapp: true,
    showInternal: true,
  },
  premiumPack: "free",
});

export const useFormData = () => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<FormData>(initializeFormData());
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  useEffect(() => {
    setHasPrefilledData(false);
  }, []);

  useEffect(() => {
    const loadUserContactData = async () => {
      if ((user || profile) && !hasPrefilledData) {
        try {
          console.log(
            "🔄 Récupération des données utilisateur depuis Supabase...",
          );

          const userEmail = user?.email || profile?.email;
          if (!userEmail) return;

          const response = await fetch(
            `/api/users/by-email/${encodeURIComponent(userEmail)}`,
          );
          if (!response.ok) {
            console.error(
              "Erreur lors de la récupération des données utilisateur",
            );
            return;
          }

          const userData = await response.json();
          console.log("📞 Données utilisateur récupérées:", userData);

          const userPhone = userData.phone
            ? formatPhoneNumber(userData.phone)
            : "";
          const userWhatsapp = userData.whatsapp
            ? formatPhoneNumber(userData.whatsapp)
            : "";

          setFormData((prev) => ({
            ...prev,
            location: {
              city: userData.city || "",
              postalCode: userData.postal_code?.toString() || "",
            },
            contact: {
              ...prev.contact,
              phone: userPhone,
              email: userData.email || "",
              whatsapp: userWhatsapp,
              sameAsPhone: userWhatsapp === userPhone && userPhone !== "",
            },
          }));

          setHasPrefilledData(true);
          console.log("✅ Données auto-remplies depuis l'API");
        } catch (error) {
          console.error(
            "Erreur lors du chargement des données utilisateur:",
            error,
          );
        }
      }
    };

    loadUserContactData();
  }, [user, profile, hasPrefilledData]);

  const updateFormData = (field: string, value: any) => {
    console.log("updateFormData called:", field, value);

    if (field === "title") {
      const cleanedValue = value
        .replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, "")
        .substring(0, 50);

      setFormData((prev) => {
        const newData = { ...prev, [field]: cleanedValue };
        console.log("New form data (title filtered):", newData);
        return newData;
      });
    } else if (field === "description") {
      const cleanedValue = value
        .replace(/[^a-zA-Z0-9\sÀ-ÿ.,!?;:()\-]/g, "")
        .substring(0, 300);

      setFormData((prev) => {
        const newData = { ...prev, [field]: cleanedValue };
        console.log("New form data (description filtered):", newData);
        return newData;
      });
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        console.log("New form data:", newData);
        return newData;
      });
    }
  };

  const updateSpecificDetails = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      specificDetails: { ...prev.specificDetails, [field]: value },
    }));
  };

  useEffect(() => {
    if (formData.category) {
      setFormData((prev) => ({
        ...prev,
        subcategory: "",
        specificDetails: {},
      }));
    }
  }, [formData.category]);

  return {
    formData,
    setFormData,
    updateFormData,
    updateSpecificDetails,
    formatPhoneNumber,
  };
};
