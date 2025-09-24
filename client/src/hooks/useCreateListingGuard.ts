// client/src/hooks/useCreateListingGuard.ts
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/contexts/AppContext";

export function useCreateListingGuard() {
  const { dbUser } = useAuth();
  const { 
    openAuthModal, 
    isQuotaModalOpen,
    setIsQuotaModalOpen, 
    setQuotaModalInfo,
    isLoading 
  } = useApp();

  return async function handleCreateListingWithQuota(
    onSuccess: () => void,
    origin?: string
  ) {
    // 0) Protéger contre les états transitoires
    if (isLoading) {
      console.log("⏳ Auth state loading, ignoring click");
      return;
    }

    // 1) Pas connecté → ouvrir modal auth avec intent persistant
    if (!dbUser?.id) {
      console.log("🔒 User not authenticated, opening auth modal");
      openAuthModal('login', () => {
        // Callback après login réussi : relancer la vérification
        handleCreateListingWithQuota(onSuccess, `${origin}-post-login`);
      });
      return;
    }

    // 2) Vérifier le quota via appel API direct (recommandation ChatGPT-5)
    console.log("📊 Checking quota for user:", dbUser.id);
    
    try {
      const response = await fetch(`/api/users/${dbUser.id}/quota/check`);
      
      if (!response.ok) {
        console.error("❌ Quota check failed:", response.status);
        // Fail-safe : laisser passer en cas d'erreur réseau
        console.log("🛡️ Fail-safe: allowing action despite API error");
        onSuccess();
        return;
      }

      const quota = await response.json();
      console.log("📈 Quota response:", quota);

      if (quota.canCreate) {
        // ✅ Quota OK → exécuter l'action
        console.log("✅ Quota available, proceeding to create listing");
        onSuccess();
      } else {
        // ❌ Quota atteint → ouvrir modal quota
        console.log("🚫 Quota exceeded, opening quota modal");
        setQuotaModalInfo(quota);
        setIsQuotaModalOpen(true);
      }
    } catch (error) {
      console.error("🔌 Network error during quota check:", error);
      // Fail-safe : laisser passer en cas d'erreur réseau
      console.log("🛡️ Fail-safe: allowing action despite network error");
      onSuccess();
    }
  };
}