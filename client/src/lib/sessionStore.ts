import type { Session } from '@supabase/supabase-js';

/**
 * Session Store - Source unique de vérité pour la session Supabase
 * 
 * Ce store résout le problème de désynchronisation du token :
 * - Mis à jour immédiatement par onAuthStateChange
 * - Utilisé par apiRequest pour toujours avoir le token le plus récent
 * - Évite les 401 pendant le refresh automatique de Supabase
 */

let currentSession: Session | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Décode le JWT pour extraire la date d'expiration
 */
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const sessionStore = {
  /**
   * Récupère la session actuelle (synchrone, pas de délai)
   */
  getSession(): Session | null {
    return currentSession;
  },

  /**
   * Met à jour la session (appelé par onAuthStateChange)
   */
  setSession(session: Session | null): void {
    currentSession = session;
  },

  /**
   * Récupère le token d'accès actuel
   */
  getAccessToken(): string | null {
    return currentSession?.access_token ?? null;
  },

  /**
   * Vérifie si une session est active
   */
  hasSession(): boolean {
    return currentSession !== null;
  },

  /**
   * Efface la session
   */
  clear(): void {
    currentSession = null;
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },

  /**
   * Configure un refresh proactif du token 5 minutes avant expiration
   */
  scheduleProactiveRefresh(onRefresh: () => Promise<void>): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    if (!currentSession?.access_token) return;

    const expiresAt = getTokenExpiration(currentSession.access_token);
    if (!expiresAt) return;

    const now = Date.now();
    const fiveMinutesBeforeExpiry = expiresAt - (5 * 60 * 1000);
    const timeUntilRefresh = fiveMinutesBeforeExpiry - now;

    if (timeUntilRefresh > 0) {
      refreshTimer = setTimeout(async () => {
        console.log('🔄 Refresh proactif du token (5 min avant expiration)');
        await onRefresh();
      }, timeUntilRefresh);
    }
  }
};
