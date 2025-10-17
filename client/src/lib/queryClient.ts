import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

/**
 * Intercepteur API avec gestion automatique du refresh token
 * 
 * En cas de 401 (token expiré) :
 * 1. Appelle supabase.auth.refreshSession()
 * 2. Injecte directement le nouveau token dans la requête
 * 3. Relance la requête UNE SEULE FOIS
 * 4. Si échec à nouveau, renvoie l'erreur (pas de boucle)
 */
const apiRequest = async (url: string, options: RequestInit = {}, refreshedToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Si on a un token rafraîchi, l'utiliser directement
  if (refreshedToken) {
    console.log('🔐 [API] Using refreshed token for:', url);
    headers["Authorization"] = `Bearer ${refreshedToken}`;
  } else {
    // Sinon, récupérer le token Supabase actuel
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      console.log('🔐 [API] Using session token for:', url);
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      console.warn('⚠️ [API] No session found for:', url);
    }
  }

  // Exclure headers de options pour éviter qu'il écrase nos headers
  const { headers: _, ...optionsWithoutHeaders } = options;

  const response = await fetch(url, {
    ...optionsWithoutHeaders,
    headers,
  });

  // Gestion du 401 (token expiré) - uniquement si ce n'est pas déjà un retry
  if (response.status === 401 && !refreshedToken) {
    console.log('🔄 Token expiré détecté - Refresh en cours...');
    
    // Tenter de rafraîchir le token
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session?.access_token) {
      console.error('❌ Échec du refresh token:', refreshError?.message || 'Session invalide');
      
      // Erreur personnalisée pour session expirée
      const error = new Error('Authentification requise');
      (error as any).status = 401;
      (error as any).requiresReauth = true;
      throw error;
    }

    console.log('✅ Token rafraîchi avec succès - Retry de la requête');
    
    // Relancer la requête UNE SEULE FOIS avec le nouveau token injecté directement
    return apiRequest(url, options, refreshData.session.access_token);
  }

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as any).status = response.status;
    throw error;
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
  queryClient.clear();
};

export { apiRequest };
