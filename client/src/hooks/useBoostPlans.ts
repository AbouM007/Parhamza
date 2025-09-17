import { useQuery } from '@tanstack/react-query';
import { BoostPlan } from '@shared/schema';

export const useBoostPlans = () => {
  return useQuery<BoostPlan[]>({
    queryKey: ['/api/boost/plans'],
    staleTime: 300000, // 5 minutes - les plans changent très rarement
    cacheTime: 600000, // 10 minutes
  });
};