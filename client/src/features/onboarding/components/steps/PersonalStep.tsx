import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StepProps } from "../../types";
import { FormLabel } from "../shared/FormLabel";
import { FormInput } from "../shared/FormInput";
import { StepButtons } from "../shared/StepButtons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AddressInput } from "@/components/AddressInput";
import { PhoneInputComponent } from "@/components/PhoneInput";
import { useLocation } from "wouter";
import { useState } from "react";
import { OnboardingSuccessDialog } from "../OnboardingSuccessDialog";

const personalProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z
    .string()
    .min(10, "Le numéro de téléphone est requis")
    .regex(/^\+?[1-9]\d{1,14}$/, "Format de téléphone invalide"),
  whatsapp: z.string().optional(),
  postalCode: z.string().min(5, "Le code postal doit contenir 5 chiffres"),
  city: z.string().min(2, "La ville est requise").optional(),
});

type PersonalProfileData = z.infer<typeof personalProfileSchema>;

export const PersonalStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(true);

  const form = useForm<PersonalProfileData>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      name: (currentData.personal?.name as string) || "",
      phone: (currentData.personal?.phone as string) || "",
      whatsapp: (currentData.personal?.whatsapp as string) || "",
      city: (currentData.personal?.city as string) || "",
      postalCode: (currentData.personal?.postalCode as string) || "",
    },
  });

  const phoneValue = form.watch("phone");

  const onSubmit = async (data: PersonalProfileData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non disponible");

      const submissionData = {
        ...data,
        whatsapp: sameAsPhone ? data.phone : (data.whatsapp || null),
        type: "individual",
      };

      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error === "PHONE_ALREADY_EXISTS") {
          toast({
            title: "Numéro déjà utilisé",
            description:
              "Ce numéro de téléphone est déjà associé à un autre compte.",
            variant: "destructive",
          });
          return;
        }

        if (errorData.error === "WHATSAPP_ALREADY_EXISTS") {
          toast({
            title: "WhatsApp déjà utilisé",
            description:
              "Ce numéro WhatsApp est déjà associé à un autre compte.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      setShowSuccessDialog(true);
      
      setTimeout(async () => {
        await refreshProfile();
        setLocation("/dashboard");
      }, 2500);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la finalisation du profil.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Informations personnelles
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Complétez votre profil pour continuer
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom complet */}
          <div>
            <FormLabel htmlFor="name" required>
              Nom complet
            </FormLabel>
            <FormInput
              id="name"
              type="text"
              placeholder="Jean Dupont"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
              data-testid="input-name"
            />
          </div>

          {/* Téléphone international */}
          <div>
            <PhoneInputComponent
              value={phoneValue || ""}
              onChange={(value) => form.setValue("phone", value)}
              label="Téléphone"
              required
              error={form.formState.errors.phone?.message}
              testId="input-phone"
            />
          </div>

          {/* AddressInput */}
          <AddressInput
            postalCode={form.watch("postalCode") || ""}
            city={form.watch("city") || ""}
            onPostalCodeChange={(code) => form.setValue("postalCode", code)}
            onCityChange={(city) => form.setValue("city", city)}
            label="Adresse de résidence"
            required
          />
        </div>

        {/* WhatsApp optionnel */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sameAsPhone"
              checked={sameAsPhone}
              onChange={(e) => setSameAsPhone(e.target.checked)}
              className="w-4 h-4 text-[#0CBFDE] bg-gray-100 border-gray-300 rounded focus:ring-[#0CBFDE] focus:ring-2"
            />
            <label htmlFor="sameAsPhone" className="text-sm text-gray-700">
              Utiliser mon numéro de téléphone pour WhatsApp
            </label>
          </div>

          {!sameAsPhone && (
            <PhoneInputComponent
              value={form.watch("whatsapp") || ""}
              onChange={(value) => form.setValue("whatsapp", value)}
              label="WhatsApp (optionnel)"
              placeholder="Numéro WhatsApp différent"
              error={form.formState.errors.whatsapp?.message}
              testId="input-whatsapp"
            />
          )}
        </div>

        <StepButtons
          onBack={onBack}
          onContinue={() => form.handleSubmit(onSubmit)()}
          continueText="Finaliser mon profil"
          continueDisabled={form.formState.isSubmitting}
        />
      </form>

      {showSuccessDialog && <OnboardingSuccessDialog />}
    </div>
  );
};
