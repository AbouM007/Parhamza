import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import { FormInput } from "../shared/FormInput";
import { FormLabel } from "../shared/FormLabel";
import { StepButtons } from "../shared/StepButtons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const professionalSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  siret: z.string().regex(/^\d{14}$/, "Le numéro SIRET doit contenir 14 chiffres"),
  name: z.string().min(2, "Le nom du responsable est requis"),
  phone: z.string().regex(/^\d{10}$/, "Le téléphone doit contenir 10 chiffres"),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProfessionalStep({ onNext, onBack }: ProfessionalStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      companyName: "",
      siret: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = async (data: ProfessionalFormData) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type: "professional",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      await refreshProfile();

      toast({
        title: "Professionnel enregistré !",
        description: "Passons maintenant à l'upload de vos documents.",
      });

      onNext();
    } catch (error) {
      console.error("Erreur sauvegarde professionnel:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom entreprise */}
          <div>
            <FormLabel htmlFor="companyName">Nom de l'entreprise *</FormLabel>
            <FormInput
              id="companyName"
              placeholder="Auto Passion SARL, Garage Martin..."
              error={errors.companyName?.message}
              {...register("companyName")}
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
              error={errors.siret?.message}
              {...register("siret")}
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
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          {/* Téléphone */}
          <div>
            <FormLabel htmlFor="phone">Téléphone *</FormLabel>
            <FormInput
              id="phone"
              type="tel"
              maxLength={10}
              placeholder="0612345678"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              10 chiffres requis
            </p>
          </div>
        </div>

        {/* Boutons */}
        <StepButtons
          onBack={onBack}
          onContinue={() => handleSubmit(onSubmit)()}
          continueText="Continuer"
          continueDisabled={isSubmitting}
        />
      </form>
    </div>
  );
}
