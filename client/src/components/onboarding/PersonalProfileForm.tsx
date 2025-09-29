import React from "react";
import { X, User, MapPin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/contexts/AuthContext"; // ✅ AJOUT

// Schéma de validation pour le profil personnel
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

interface PersonalProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialData?: {
    name?: string;
    email?: string;
  };
}

export const PersonalProfileForm: React.FC<PersonalProfileFormProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialData = {},
}) => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth(); // ✅ AJOUT

  const form = useForm<PersonalProfileData>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: "",
      city: "",
      postalCode: "",
    },
  });

  const onSubmit = async (data: PersonalProfileData) => {
    try {
      console.log("🔧 Soumission profil personnel:", data);

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

        if (errorData.error === 'PHONE_ALREADY_EXISTS') {
          toast({
            title: "Numéro déjà utilisé",
            description: "Ce numéro de téléphone est déjà associé à un autre compte. Veuillez en choisir un autre.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      toast({
        title: "Profil complété !",
        description: "Votre compte personnel est maintenant prêt à l'emploi.",
        variant: "default",
      });

      // ✅ AJOUT : mise à jour explicite du statut
      await supabase
        .from("users")
        .update({
          type: "individual",
          profile_completed: true,
          onboarding_status: "completed",
        })
        .eq("id", user?.id);

      await refreshProfile(); // ✅ AJOUT

      onComplete(); // ✅ déjà présent
    } catch (error: any) {
      console.error("❌ Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Compléter mon compte personnel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* ... formulaire inchangé ... */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {form.formState.isSubmitting
                ? "Finalisation..."
                : "Finaliser mon profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
