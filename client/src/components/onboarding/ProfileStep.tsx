// client/src/components/onboarding/ProfileStep.tsx
import React from "react";
import { Building2, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const professionalProfileSchema = z.object({
  companyName: z.string().min(2, "Le nom de l’entreprise est requis"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le numéro SIRET doit contenir 14 chiffres"),
  name: z.string().min(2, "Le nom du responsable est requis"),
  phone: z.string().regex(/^\d{10}$/, "Le téléphone doit contenir 10 chiffres"),
});

export type ProfessionalProfileData = z.infer<typeof professionalProfileSchema>;

interface ProfileStepProps {
  onNext: (data: ProfessionalProfileData) => void;
  onCancel: () => void;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  onNext,
  onCancel,
}) => {
  const form = useForm<ProfessionalProfileData>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      companyName: "",
      siret: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = async (data: ProfessionalProfileData) => {
    try {
      console.log("🔧 Sauvegarde profil professionnel étape 1:", data);

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
          type: "professional",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      // ✅ Passer à l’étape suivante
      onNext(data);
    } catch (error) {
      console.error("❌ Erreur sauvegarde profil:", error);
      alert("❌ Une erreur est survenue lors de la sauvegarde du profil.");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Building2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Finaliser mon profil professionnel
          </h2>
          <p className="text-sm text-gray-500">Étape 1 sur 3</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Nom entreprise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l’entreprise *
            </label>
            <input
              {...form.register("companyName")}
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Auto Passion SARL, Garage Martin..."
            />
            {form.formState.errors.companyName && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.companyName.message}
              </p>
            )}
          </div>

          {/* Numéro SIRET */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro SIRET *
            </label>
            <input
              {...form.register("siret")}
              type="text"
              maxLength={14}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="12345678901234"
            />
            {form.formState.errors.siret && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.siret.message}
              </p>
            )}
          </div>

          {/* Nom du responsable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du responsable *
            </label>
            <input
              {...form.register("name")}
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Jean Dupont"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              {...form.register("phone")}
              type="tel"
              maxLength={10}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0612345678"
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <span>
              {form.formState.isSubmitting ? "Sauvegarde..." : "Continuer"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
