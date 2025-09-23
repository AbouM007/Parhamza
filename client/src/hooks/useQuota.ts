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
    staleTime: 30000, // 30 secondes - les quotas changent peu fréquemment
    refetchInterval: 60000, // Refresh toutes les minutes
  });
};