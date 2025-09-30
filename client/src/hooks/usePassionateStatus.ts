import { useQuery } from '@tanstack/react-query';

interface PassionateStatus {
  isPassionate: boolean;
  planName?: string;
  isLoading: boolean;
}

interface PassionateStatusResponse {
  isPassionate: boolean;
  planName?: string;
}

/**
 * Hook pour déterminer si un utilisateur particulier a un abonnement actif
 * qui lui donne le statut "Passionné"
 */
export const usePassionateStatus = (userId?: string, userType?: string): PassionateStatus => {
  const { data, isLoading, error } = useQuery<PassionateStatusResponse>({
    queryKey: ['/api/users', userId, 'passionate-status'],
    enabled: !!userId && userType === 'individual',
    staleTime: 5 * 60 * 1000, // 5 minutes de cache
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Si ce n'est pas un particulier, pas de statut Passionné
  if (userType !== 'individual') {
    return { isPassionate: false, isLoading: false };
  }

  // Si erreur ou pas de données, pas de statut Passionné
  if (error || !data) {
    return { isPassionate: false, isLoading };
  }

  return {
    isPassionate: data.isPassionate || false,
    planName: data.planName,
    isLoading,
  };
};