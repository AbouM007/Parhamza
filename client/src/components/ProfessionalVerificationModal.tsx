// client/src/components/ProfessionalVerificationModal.tsx
import React from "react";
import { ProfessionalVerificationForm } from "./ProfessionalVerificationForm";

interface ModalProps {
  isOpen: boolean;
}

export const ProfessionalVerificationModal: React.FC<ModalProps> = ({
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold text-center mb-6">
          Vérification de votre compte
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Merci pour votre paiement. Pour activer votre compte professionnel,
          veuillez fournir vos informations et votre KBIS.
        </p>
        <ProfessionalVerificationForm />
      </div>
    </div>
  );
};
