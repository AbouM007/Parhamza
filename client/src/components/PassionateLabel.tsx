import React from 'react';
import { usePassionateStatus } from '@/hooks/usePassionateStatus';

interface PassionateLabelProps {
  userId?: string;
  userType?: string;
  variant?: 'badge' | 'full';
}

/**
 * Composant pour afficher le label "Passionné" orange
 * pour les particuliers ayant un abonnement actif
 */
export const PassionateLabel: React.FC<PassionateLabelProps> = ({ 
  userId, 
  userType, 
  variant = 'badge' 
}) => {
  const { isPassionate, isLoading } = usePassionateStatus(userId, userType);
  
  // Ne pas afficher pour les professionnels ou si pas passionné
  if (userType !== 'individual' || isLoading || !isPassionate) {
    return null;
  }

  if (variant === 'full') {
    // Version complète avec icône pour la zone contact
    return (
      <div className="flex items-center space-x-1 text-orange-600 text-sm" data-testid="passionate-label-full">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        <span className="font-semibold">Passionné</span>
      </div>
    );
  }

  // Version badge pour les cartes d'annonces  
  return (
    <span 
      className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded"
      data-testid="passionate-label-badge"
    >
      Passionné
    </span>
  );
};