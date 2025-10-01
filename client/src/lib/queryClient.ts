import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

const apiRequest = async (url: string, options: RequestInit = {}) => {
  // Récupérer le token d'authentification Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('🔐 apiRequest - Session présente:', !!session);
  console.log('🔐 apiRequest - Token présent:', !!session?.access_token);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Ajouter le token d'authentification si disponible
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
    console.log('✅ apiRequest - Token ajouté au header Authorization');
  } else {
    console.warn('⚠️ apiRequest - Pas de token disponible');
  }

  console.log('📡 apiRequest - Appel à:', url);

  const response = await fetch(url, {
    headers,
    ...options,
  });

  console.log('📥 apiRequest - Réponse:', response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        return apiRequest(url);
      },
    },
  },
});

// Fonction utilitaire pour vider le cache lors de la déconnexion
export const clearUserCache = () => {
  console.log('🧹 Vidage du cache React Query...');
  queryClient.clear();
};

export { apiRequest };