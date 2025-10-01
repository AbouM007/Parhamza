import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import SubscriptionManager from "@/components/SubscriptionManager";
import { ArrowLeft } from "lucide-react";

export default function SubscriptionSettings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Rediriger si non authentifié
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion de l'abonnement
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gérez votre plan d'abonnement et vos options de facturation
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubscriptionManager />
      </div>
    </div>
  );
}
