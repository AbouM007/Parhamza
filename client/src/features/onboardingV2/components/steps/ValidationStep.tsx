import { useState } from "react";
import { CheckCircle, Clock, Mail, Loader } from "lucide-react";
import { StepProps } from "../../types";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export const ValidationStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  const { refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const docs = currentData.documents as any;
      const professional = currentData.professional as any;

      // Uploader les documents vers le serveur
      const formData = new FormData();
      
      if (docs?.kbis) {
        formData.append("kbis_document", docs.kbis as Blob);
      }
      
      if (docs?.cin && Array.isArray(docs.cin) && docs.cin.length > 0) {
        docs.cin.forEach((file: File) => {
          formData.append("cin_document", file);
        });
      }

      // Ajouter les infos du compte professionnel (depuis ProfessionalStep)
      if (professional?.companyName) {
        formData.append("company_name", professional.companyName as string);
      }
      if (professional?.siret) {
        formData.append("siret", professional.siret as string);
      }

      // Envoyer les documents pour vérification
      const response = await apiRequest("/api/professional-accounts/verify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi des documents");
      }

      // Marquer le profil comme complété
      await apiRequest("/api/profile/complete", {
        method: "POST",
        body: JSON.stringify({
          ...professional,
          profileCompleted: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Rafraîchir le profil
      await refreshProfile();

      // Finaliser l'onboarding (sans validated car pas dans le type)
      onComplete({});
    } catch (error) {
      console.error("❌ Erreur finalisation onboarding:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Demande envoyée avec succès !
        </h2>
        <p className="text-gray-600">
          Votre compte professionnel est en cours de validation
        </p>
      </div>

      {/* Status Cards */}
      <div className="space-y-4">
        {/* Documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Documents reçus</h3>
              <p className="text-sm text-gray-600 mt-1">
                Vos documents ont été téléchargés avec succès
              </p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {(() => {
          const payment = currentData.payment as any;
          return payment?.planName && !payment?.skipped ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Abonnement activé</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Plan {payment.planName} souscrit avec succès
                  </p>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Validation en cours */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Vérification en cours</h3>
              <p className="text-sm text-blue-800 mt-1">
                Notre équipe vérifie vos documents sous <strong>24-48h</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Email notification */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Notification email</h3>
              <p className="text-sm text-gray-600 mt-1">
                Vous recevrez un email dès que votre compte sera validé
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Prochaines étapes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-1">•</span>
            <span>Vous pouvez commencer à explorer la plateforme dès maintenant</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-1">•</span>
            <span>Une fois validé, vous pourrez publier des annonces professionnelles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-600 mt-1">•</span>
            <span>Votre badge PRO sera visible sur votre profil et vos annonces</span>
          </li>
        </ul>
      </div>

      {/* Action Button */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="button-finish-onboarding"
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              Finalisation...
            </>
          ) : (
            "Accéder à mon compte"
          )}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
            data-testid="button-back-validation"
          >
            Retour
          </button>
        )}
      </div>
    </div>
  );
};
