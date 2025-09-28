import { useQuery } from '@tanstack/react-query';

interface ProfessionalAccountStatus {
  id: number;
  verification_status: string;
  is_verified: boolean;
  rejected_reason?: string;
  created_at: string;
  company_name?: string;
}

/**
 * Hook React Query partagé pour récupérer le statut d'un compte professionnel
 * Évite les appels API répétitifs en centralisant le cache
 */
export const useProfessionalAccountStatus = (userId?: string, userType?: string) => {
  return useQuery<ProfessionalAccountStatus>({
    queryKey: [`/api/professional-accounts/status/${userId}`],
    enabled: !!userId && userType === 'professional',
    staleTime: 300000, // 5 minutes - le statut de vérification change rarement
    retry: 1, // 1 seul retry en cas d'échec
    refetchOnWindowFocus: false, // Pas de refetch au focus
  });
};