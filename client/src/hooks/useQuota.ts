import { useQuery } from '@tanstack/react-query';

export interface QuotaInfo {
  canCreate: boolean;
  remaining: number | null;
  used: number;
  maxListings: number | null;
  message?: string;
}

export const useQuota = (userId?: string) => {
  return useQuery<QuotaInfo>({
    queryKey: [`/api/users/${userId}/quota/check`],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // ⚡ OPTIMISATION: 5 minutes - les quotas changent très rarement
    refetchInterval: false, // ⚡ OPTIMISATION: Pas de refresh automatique (seulement sur refocus/invalidation)
    refetchOnWindowFocus: true, // Refresh quand l'utilisateur revient sur l'onglet
    retry: 1, // ⚡ OPTIMISATION: Moins de retry en cas d'erreur
  });
};