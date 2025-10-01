import { CheckCircle2 } from "lucide-react";

export const OnboardingSuccessDialog = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-3">
          Profil créé avec succès !
        </h2>
        <p className="text-center text-base text-gray-600 mb-6">
          Votre compte est maintenant prêt. <br />
          Redirection vers votre tableau de bord...
        </p>
        <div className="flex justify-center gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '0s' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '0.2s' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};
