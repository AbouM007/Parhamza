import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw } from "lucide-react";

/**
 * Composant de debug pour réinitialiser l'onboarding du compte actuel
 * Visible uniquement en mode développement
 */
export const DebugResetOnboarding = () => {
  const { refreshProfile } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  // Ne pas afficher en production
  if (import.meta.env.PROD) {
    return null;
  }

  const handleReset = async () => {
    if (!confirm("Réinitialiser l'onboarding ? (profile_completed → false)")) {
      return;
    }

    setIsResetting(true);
    try {
      await apiRequest("/api/debug/reset-onboarding", {
        method: "POST",
      });

      // Rafraîchir le profil pour voir les changements
      await refreshProfile();

      alert("✅ Onboarding réinitialisé ! Rafraîchissez la page.");
      window.location.reload();
    } catch (error) {
      console.error("Erreur reset onboarding:", error);
      alert("❌ Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      data-testid="debug-reset-onboarding"
    >
      <button
        onClick={handleReset}
        disabled={isResetting}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-testid="button-reset-onboarding"
      >
        <RefreshCw className="w-4 h-4" />
        {isResetting ? "Reset..." : "🔧 Reset Onboarding"}
      </button>
    </div>
  );
};
