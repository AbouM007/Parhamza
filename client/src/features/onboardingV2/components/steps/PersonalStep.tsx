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

const personalProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Le téléphone doit contenir exactement 10 chiffres"),
  city: z.string().min(2, "La ville est requise").optional(),
  postalCode: z
    .string()
    .min(5, "Le code postal doit contenir 5 chiffres")
    .optional(),
});

type PersonalProfileData = z.infer<typeof personalProfileSchema>;

export const PersonalStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  const form = useForm<PersonalProfileData>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      name: (currentData.personal?.name as string) || "",
      phone: (currentData.personal?.phone as string) || "",
      city: (currentData.personal?.city as string) || "",
      postalCode: (currentData.personal?.postalCode as string) || "",
    },
  });

  const onSubmit = async (data: PersonalProfileData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non disponible");

      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...data,
          type: "individual",
        }),
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

        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      toast({
        title: "Profil finalisé !",
        description: "Votre compte personnel est maintenant prêt à l'emploi.",
      });

      // Rafraîchir le profil
      await refreshProfile();

      // Passer à l'étape suivante avec les données
      onComplete({ personal: data });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la finalisation du profil.",
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

          {/* Téléphone */}
          <div>
            <FormLabel htmlFor="phone" required>
              Téléphone
            </FormLabel>
            <FormInput
              id="phone"
              type="tel"
              placeholder="0612345678"
              {...form.register("phone")}
              error={form.formState.errors.phone?.message}
              data-testid="input-phone"
            />
          </div>

          {/* Ville */}
          <div>
            <FormLabel htmlFor="city">Ville</FormLabel>
            <FormInput
              id="city"
              type="text"
              placeholder="Paris"
              {...form.register("city")}
              error={form.formState.errors.city?.message}
              data-testid="input-city"
            />
          </div>

          {/* Code postal */}
          <div>
            <FormLabel htmlFor="postalCode">Code postal</FormLabel>
            <FormInput
              id="postalCode"
              type="text"
              placeholder="75001"
              {...form.register("postalCode")}
              error={form.formState.errors.postalCode?.message}
              data-testid="input-postalcode"
            />
          </div>
        </div>

        <StepButtons
          onBack={onBack}
          onContinue={() => form.handleSubmit(onSubmit)()}
          continueText="Finaliser mon profil"
          continueDisabled={form.formState.isSubmitting}
        />
      </form>
    </div>
  );
};
