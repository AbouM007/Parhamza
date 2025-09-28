import React from 'react';
import { useProfessionalAccountStatus } from '@/hooks/useProfessionalAccountStatus';

interface CompanyNameDisplayProps {
  userId?: string;
  userType?: string;
  className?: string;
}

export const CompanyNameDisplay: React.FC<CompanyNameDisplayProps> = ({ 
  userId, 
  userType, 
  className = "text-cyan-600 text-lg font-medium" 
}) => {
  const { data: statusData, isLoading } = useProfessionalAccountStatus(userId, userType);
  
  // Extraire le nom de la société depuis les données du statut
  const companyName = statusData?.company_name;

  // Ne pas afficher pour les particuliers
  if (userType !== 'professional' || isLoading) {
    return null;
  }

  // Afficher le nom de la société s'il existe
  if (companyName) {
    return (
      <p className={className}>
        🏢 {companyName}
      </p>
    );
  }

  return null;
};