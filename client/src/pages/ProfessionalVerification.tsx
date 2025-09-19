import React from "react";
import { ProfessionalVerificationModal } from "@/components/ProfessionalVerificationModal";

const ProfessionalVerificationPage: React.FC = () => {
  return <ProfessionalVerificationModal isOpen={true} />;
};

// 👉 export par défaut
export default ProfessionalVerificationPage;

// 👉 export nommé (utile si tu veux importer avec { ProfessionalVerification })
export { ProfessionalVerificationPage as ProfessionalVerification };
