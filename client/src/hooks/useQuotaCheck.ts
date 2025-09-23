import { useState, useCallback } from 'react';
import { useQuota, QuotaInfo } from './useQuota';

interface QuotaCheckHook {
  // États du modal
  isQuotaModalOpen: boolean;
  quotaInfo: QuotaInfo | null;
  
  // Fonction principale d'interception
  checkQuotaBeforeAction: (onSuccess: () => void) => Promise<void>;
  
  // Contrôles du modal
  closeQuotaModal: () => void;
  
  // États de chargement
  isChecking: boolean;
}

/**
 * Hook pour vérifier les quotas avant une action et afficher une modal si nécessaire
 * @param userId - ID de l'utilisateur à vérifier
 * @returns - Logique complète d'interception quota + modal
 */
export const useQuotaCheck = (userId?: string): QuotaCheckHook => {
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  /**
   * Fonction principale : vérifie le quota avant d'exécuter une action
   * Si quota OK → exécute l'action (ex: navigation vers formulaire)
   * Si quota atteint → affiche la modal
   */
  const checkQuotaBeforeAction = useCallback(async (onSuccess: () => void) => {
    if (!userId) {
      console.warn("useQuotaCheck: userId manquant");
      return;
    }

    setIsChecking(true);
    
    try {
      // Appel API direct pour vérification rapide
      const response = await fetch(`/api/users/${userId}/quota/check`);
      
      if (!response.ok) {
        console.error("Erreur lors de la vérification quota:", response.status);
        // En cas d'erreur, autoriser l'action (fail-safe)
        onSuccess();
        return;
      }

      const quota: QuotaInfo = await response.json();
      setQuotaInfo(quota);

      if (quota.canCreate) {
        // Quota OK → exécuter l'action
        onSuccess();
      } else {
        // Quota atteint → afficher modal
        setIsQuotaModalOpen(true);
      }
    } catch (error) {
      console.error("Erreur réseau lors de la vérification quota:", error);
      // En cas d'erreur réseau, autoriser l'action (fail-safe)
      onSuccess();
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  const closeQuotaModal = useCallback(() => {
    setIsQuotaModalOpen(false);
    setQuotaInfo(null);
  }, []);

  return {
    isQuotaModalOpen,
    quotaInfo,
    checkQuotaBeforeAction,
    closeQuotaModal,
    isChecking
  };
};