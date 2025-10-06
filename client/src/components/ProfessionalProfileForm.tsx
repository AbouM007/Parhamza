import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Star,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from '@/hooks/use-toast';
import { PhoneInputComponent } from "@/components/PhoneInput";

// ✅ Schéma de validation pour profil professionnel
const professionalProfileSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le numéro SIRET doit contenir 14 chiffres"),
  name: z.string().min(2, "Le nom du responsable est requis"),
  phone: z
    .string()
    .min(10, "Le numéro de téléphone est requis")
    .regex(/^\+[1-9]\d{1,14}$/, "Format de téléphone invalide (E.164 requis)"),
  whatsapp: z.string().optional(),
});

type ProfessionalProfileData = z.infer<typeof professionalProfileSchema>;

interface ProfessionalProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    companyName?: string;
    siret?: string;
    city?: string;
    postalCode?: string;
    website?: string;
  };
}

export const ProfessionalProfileForm: React.FC<
  ProfessionalProfileFormProps
> = ({ isOpen, onClose, onComplete, initialData = {} }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [savedFormData, setSavedFormData] =
    useState<ProfessionalProfileData | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const form = useForm<ProfessionalProfileData>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      companyName: initialData.companyName || "",
      siret: initialData.siret || "",
      name: initialData.name || "",
      phone: initialData.phone || "",
      whatsapp: initialData.whatsapp || "",
    },
  });

  // Charger les plans d'abonnement
  const loadSubscriptionPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch("/api/subscriptions/plans");
      if (!response.ok) throw new Error("Erreur chargement plans");
      const plans = await response.json();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error("❌ Erreur chargement plans:", error);
      alert("Erreur lors du chargement des plans d'abonnement");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && subscriptionPlans.length === 0) {
      loadSubscriptionPlans();
    }
  }, [currentStep]);

  // Étape 1 : Sauvegarde temporaire des données (sans finaliser le profil)
  const onSubmitStep1 = async (data: ProfessionalProfileData) => {
    try {
      console.log("🔧 Sauvegarde temporaire profil professionnel étape 1:", data);

      // Validation des données requises
      if (!data.name || !data.phone || !data.companyName || !data.siret) {
        throw new Error("Tous les champs obligatoires doivent être remplis");
      }

      // Validation SIRET
      if (!/^\d{14}$/.test(data.siret)) {
        throw new Error("SIRET invalide (14 chiffres requis)");
      }

      // Si sameAsPhone est activé, copier le numéro de téléphone dans whatsapp
      if (sameAsPhone) {
        data.whatsapp = data.phone;
      }

      toast({
        title: "Étape 1 validée !",
        description: "Passons maintenant au choix de votre abonnement.",
        variant: "default",
      });

      setSavedFormData(data);
      setCurrentStep(2);
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde profil:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Étape 2 : Paiement Stripe
  const handlePlanSelection = async (plan: any) => {
    if (!savedFormData) {
      alert("Erreur : données du profil manquantes");
      return;
    }

    setIsCreatingCheckout(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email)
        throw new Error("Email utilisateur non disponible");

      const response = await fetch(
        "/api/subscriptions/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            userEmail: session.user.email,
          }),
        },
      );

      if (!response.ok) throw new Error("Erreur création session de paiement");

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("❌ Erreur création checkout:", error);
      alert(
        "Erreur lors de la création de la session de paiement. Veuillez réessayer.",
      );
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              {currentStep === 1 ? (
                <Building2 className="h-6 w-6 text-green-600" />
              ) : (
                <CreditCard className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStep === 1
                  ? "Finaliser mon profil professionnel"
                  : "Choisir mon abonnement"}
              </h2>
              <p className="text-sm text-gray-500">Étape {currentStep} sur 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-close-modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Étape 1 : Formulaire */}
        {currentStep === 1 && (
          <form
            onSubmit={form.handleSubmit(onSubmitStep1)}
            className="p-6 space-y-8"
          >
            <section className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Nom entreprise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    {...form.register("companyName")}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Auto Passion SARL, Garage Martin..."
                    data-testid="input-company-name"
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
                    data-testid="input-siret"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    14 chiffres requis
                  </p>
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
                    data-testid="input-responsible-name"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Téléphone international */}
                <div>
                  <PhoneInputComponent
                    value={form.watch("phone") || ""}
                    onChange={(value) => form.setValue("phone", value)}
                    label="Téléphone *"
                    placeholder="Numéro de téléphone professionnel"
                    error={form.formState.errors.phone?.message}
                    testId="input-phone"
                  />
                </div>

                {/* WhatsApp - inline */}
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="sameAsPhone"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="w-4 h-4 text-[#0CBFDE] bg-gray-100 border-gray-300 rounded focus:ring-[#0CBFDE] focus:ring-2"
                    data-testid="checkbox-same-whatsapp"
                  />
                  <label htmlFor="sameAsPhone" className="text-sm text-gray-700">
                    Utiliser mon numéro de téléphone pour WhatsApp
                  </label>
                </div>
              </div>

              {/* WhatsApp différent si décoché */}
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
            </section>

            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                data-testid="button-cancel"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                data-testid="button-continue"
              >
                <span>
                  {form.formState.isSubmitting ? "Sauvegarde..." : "Continuer"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Étape 2 : Plans */}
        {currentStep === 2 && (
          <div className="p-6">
            {isLoadingPlans ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {subscriptionPlans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                      index === 1
                        ? "border-green-500"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          <Star className="inline h-3 w-3 mr-1" />
                          Populaire
                        </span>
                      </div>
                    )}
                    <div
                      className={`p-6 ${index === 1 ? "bg-green-50" : "bg-white"}`}
                    >
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {plan.price_monthly}€
                        <span className="text-sm text-gray-500 font-normal">
                          /mois
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {plan.max_listings
                          ? `${plan.max_listings} annonces/mois`
                          : "Annonces illimitées"}
                      </p>
                    </div>
                    <div className="border-t px-6 py-4 bg-white">
                      <ul className="space-y-3">
                        <li className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>
                            {plan.max_listings
                              ? `${plan.max_listings} annonces/mois`
                              : "Annonces illimitées"}
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Badge PRO</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Page de boutique</span>
                        </li>
                      </ul>
                    </div>
                    <div className="border-t p-6 bg-white">
                      <button
                        onClick={() => handlePlanSelection(plan)}
                        disabled={isCreatingCheckout}
                        className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {isCreatingCheckout
                          ? "Redirection..."
                          : "Choisir ce plan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
