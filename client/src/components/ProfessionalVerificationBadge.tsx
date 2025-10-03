import React from 'react';
import { useProfessionalAccountStatus } from '@/hooks/useProfessionalAccountStatus';

interface ProfessionalVerificationBadgeProps {
  profile: any;
}

export const ProfessionalVerificationBadge: React.FC<ProfessionalVerificationBadgeProps> = ({ profile }) => {
  const { data: statusData, isLoading, error } = useProfessionalAccountStatus(profile?.id, profile?.type);
  
  // Déterminer le statut de vérification
  const verificationStatus = error ? 'not_started' : statusData?.verification_status;

  // Ne pas afficher de badge pour les particuliers
  if (profile?.type !== 'professional') {
    return null;
  }

  if (isLoading) {
    return (
      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold border border-gray-200">
        ⏳ Chargement...
      </span>
    );
  }

  // Badge selon le statut de vérification
  switch (verificationStatus) {
    case 'approved':
      return (
        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
          ✅ Compte vérifié
        </span>
      );
    
    case 'pending':
      return (
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border border-yellow-200">
          ⏳ En attente de vérification
        </span>
      );
    
    case 'not_verified':
      return (
        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold border border-red-200">
          🔴 Vérification refusée
        </span>
      );
    
    case 'not_started':
    default:
      return (
        <button 
          onClick={() => window.location.href = '/professional-verification'}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
        >
          🔵 Vérification requise
        </button>
      );
  }
};