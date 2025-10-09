import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FormInput } from "../shared/FormInput";
import { FormLabel } from "../shared/FormLabel";
import { StepButtons } from "../shared/StepButtons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StepProps } from "../../types";
import { PhoneInputComponent } from "@/components/PhoneInput";
import { AddressInput } from "@/components/AddressInput";

const professionalSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le numéro SIRET doit contenir 14 chiffres"),
  name: z.string().min(2, "Le nom du responsable est requis"),
  phone: z.string().min(10, "Le numéro de téléphone est requis"),
  whatsapp: z.string().optional(),
  postalCode: z.string().min(5, "Le code postal doit contenir 5 chiffres"),
  city: z.string().min(2, "La ville est requise").optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export function ProfessionalStep({
  currentData,
  onComplete,
  onBack,
}: StepProps) {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<
    "idle" | "checking" | "available" | "exists" | "error"
  >("idle");

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      companyName: (currentData.professional?.companyName as string) || "",
      siret: (currentData.professional?.siret as string) || "",
      name: (currentData.professional?.name as string) || "",
      phone: (currentData.professional?.phone as string) || "",
      whatsapp: (currentData.professional?.whatsapp as string) || "",
      city: (currentData.professional?.city as string) || "",
      postalCode: (currentData.professional?.postalCode as string) || "",
    },
  });

  const phoneValue = form.watch("phone");

  // Vérification en temps réel du numéro de téléphone
  useEffect(() => {
    if (!phoneValue || phoneValue.length < 10) {
      setPhoneCheckStatus("idle");
      return;
    }

    // Nettoyer le numéro
    const cleanedPhone = phoneValue.replace(/\s/g, "");

    // Vérifier le format E.164
    if (!/^\+[1-9]\d{1,14}$/.test(cleanedPhone)) {
      setPhoneCheckStatus("idle");
      return;
    }

    // Debounce de 800ms
    const timeoutId = setTimeout(async () => {
      setPhoneCheckStatus("checking");

      try {
        const response = await fetch(
          `/api/users/check-phone/${encodeURIComponent(cleanedPhone)}`,
        );
        const data = await response.json();

        if (data.exists) {
          setPhoneCheckStatus("exists");
        } else {
          setPhoneCheckStatus("available");
        }
      } catch (error) {
        console.error("Erreur vérification téléphone:", error);
        setPhoneCheckStatus("error");
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [phoneValue]);

  const onSubmit = async (data: ProfessionalFormData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non disponible");

      const cleanedPhone = data.phone.replace(/\s/g, "");
      const cleanedWhatsapp = data.whatsapp
        ? data.whatsapp.replace(/\s/g, "")
        : "";

      if (!/^\+[1-9]\d{1,14}$/.test(cleanedPhone)) {
        toast({
          title: "Numéro invalide",
          description:
            "Le numéro de téléphone doit être au format international (ex: +33612345678)",
          variant: "destructive",
        });
        return;
      }

      data.phone = cleanedPhone;
      data.whatsapp = sameAsPhone ? cleanedPhone : cleanedWhatsapp || undefined;

      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...data,
          type: "professional",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Gérer les erreurs spécifiques
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

      toast({
        title: "Professionnel enregistré !",
        description: "Passons maintenant à l'upload de vos documents.",
      });

      await refreshProfile();

      onComplete({ professional: data });
    } catch (error) {
      console.error("Erreur sauvegarde professionnel:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-bolt-50 dark:bg-primary-bolt-900/20 rounded-xl">
          <Building2 className="h-6 w-6 text-primary-bolt-600 dark:text-primary-bolt-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Informations professionnelles
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complétez votre profil professionnel
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom entreprise */}
          <div>
            <FormLabel htmlFor="companyName">
              Nom légal de l'entreprise *
            </FormLabel>
            <FormInput
              id="companyName"
              placeholder="Auto Passion SARL, Garage Martin..."
              error={form.formState.errors.companyName?.message}
              {...form.register("companyName")}
              data-testid="input-company-name"
            />
          </div>

          {/* SIRET */}
          <div>
            <FormLabel htmlFor="siret">Numéro SIRET *</FormLabel>
            <FormInput
              id="siret"
              type="text"
              maxLength={14}
              placeholder="12345678901234"
              error={form.formState.errors.siret?.message}
              {...form.register("siret")}
              data-testid="input-siret"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              14 chiffres requis
            </p>
          </div>

          {/* Nom du responsable */}
          <div>
            <FormLabel htmlFor="name">Nom du responsable *</FormLabel>
            <FormInput
              id="name"
              placeholder="Jean Dupont"
              error={form.formState.errors.name?.message}
              {...form.register("name")}
              data-testid="input-manager-name"
            />
          </div>

          {/* Adresse (code postal + ville) */}
          <AddressInput
            postalCode={form.watch("postalCode") || ""}
            city={form.watch("city") || ""}
            onPostalCodeChange={(code) => form.setValue("postalCode", code)}
            onCityChange={(city) => form.setValue("city", city)}
            label="Adresse de l'entreprise"
            required
          />

          {/* Téléphone international */}
          <div>
            <PhoneInputComponent
              value={form.watch("phone") || ""}
              onChange={(value) => form.setValue("phone", value)}
              label="Téléphone *"
              placeholder="Numéro de téléphone professionnel"
              error={form.formState.errors.phone?.message}
              testId="input-manager-phone"
            />

            {/* Indicateur de vérification */}
            {phoneCheckStatus !== "idle" && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                {phoneCheckStatus === "checking" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-gray-500">Vérification...</span>
                  </>
                )}
                {phoneCheckStatus === "available" && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Numéro valide
                    </span>
                  </>
                )}
                {phoneCheckStatus === "exists" && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Ce numéro est déjà utilisé
                    </span>
                  </>
                )}
                {phoneCheckStatus === "error" && (
                  <span className="text-gray-500">Impossible de vérifier</span>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp - checkbox ou champ */}
          {sameAsPhone ? (
            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="sameAsPhone"
                checked={sameAsPhone}
                onChange={(e) => setSameAsPhone(e.target.checked)}
                className="w-4 h-4 text-[#0CBFDE] bg-gray-100 border-gray-300 rounded focus:ring-[#0CBFDE] focus:ring-2"
                data-testid="checkbox-same-whatsapp"
              />
              <label
                htmlFor="sameAsPhone"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Utiliser ce numéro pour WhatsApp
              </label>
            </div>
          ) : (
            <div>
              <PhoneInputComponent
                value={form.watch("whatsapp") || ""}
                onChange={(value) => form.setValue("whatsapp", value)}
                label="WhatsApp (optionnel)"
                placeholder="Numéro WhatsApp différent"
                error={form.formState.errors.whatsapp?.message}
                testId="input-whatsapp"
              />
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="sameAsPhone"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="w-4 h-4 text-[#0CBFDE] bg-gray-100 border-gray-300 rounded focus:ring-[#0CBFDE] focus:ring-2"
                  data-testid="checkbox-same-whatsapp"
                />
                <label
                  htmlFor="sameAsPhone"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Utiliser mon numéro de téléphone
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Boutons */}
        <StepButtons
          onBack={onBack}
          continueText="Continuer"
          continueDisabled={form.formState.isSubmitting}
          continueType="submit"
        />
      </form>
    </div>
  );
}
