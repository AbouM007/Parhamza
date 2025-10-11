import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X, Loader2, ArrowUp, XCircle, Star, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type SubscriptionPlan = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly?: number;
  max_listings: number | null;
  features: Record<string, boolean>;
  stripe_product_id?: string;
  stripe_price_id?: string;
  is_active: boolean;
};

type CurrentSubscription = {
  id: number;
  status: string;
  plan_id: number;
  cancel_at_period_end: boolean;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
} | null;

type ModifyAction = 'upgrade' | 'cancel';

// Mapping des features pour l'affichage
const FEATURE_LABELS: Record<string, string> = {
  basic_stats: "Statistiques de base",
  advanced_stats: "Statistiques avancées",
  pro_dashboard: "Tableau de bord professionnel",
  badge_verified: "Badge de confiance",
  priority_search: "Remontée dans les recherches",
  push_notifications: "Notifications push",
  api_access: "Accès API",
  unlimited_listings: "Annonces illimitées",
  popular: "Plan recommandé",
};

export default function SubscriptionManager() {
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ModifyAction;
    planId?: number;
    planName?: string;
  }>({ open: false, action: 'upgrade' });

  // Récupérer tous les plans disponibles (cache 5 min)
  const { data: plans = [], isLoading: loadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Récupérer l'abonnement actuel (cache 1 min)
  const { data: currentSub, isLoading: loadingSub } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscriptions/current'],
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour modifier l'abonnement
  const modifyMutation = useMutation({
    mutationFn: async ({ action, newPlanId }: { action: ModifyAction; newPlanId?: number }) => {
      return await apiRequest('/api/subscriptions/modify', {
        method: 'POST',
        body: JSON.stringify({ action, newPlanId }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Succès",
        description: data.message || "Abonnement modifié avec succès",
      });
      // Invalider à la fois l'abonnement actuel ET les plans (au cas où features/disponibilité change)
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/plans'] });
      setConfirmDialog({ open: false, action: 'upgrade' });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification",
        variant: "destructive",
      });
    },
  });

  const handleModify = (action: ModifyAction, planId?: number, planName?: string) => {
    setConfirmDialog({ open: true, action, planId, planName });
  };

  const confirmModify = () => {
    modifyMutation.mutate({
      action: confirmDialog.action,
      newPlanId: confirmDialog.planId,
    });
  };

  if (loadingPlans || loadingSub) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-subscription-manager" />
      </div>
    );
  }

  const currentPlanId = currentSub?.plan_id;
  const activePlans = plans.filter(p => p.is_active);

  // Couleurs par plan
  const getPlanColors = (planName: string) => {
    const lowerName = planName.toLowerCase();
    if (lowerName.includes('starter')) {
      return {
        border: 'border-blue-500',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        checkmark: 'text-blue-500',
        price: 'text-blue-600',
      };
    }
    if (lowerName.includes('standard')) {
      return {
        border: 'border-purple-500',
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        checkmark: 'text-purple-500',
        price: 'text-purple-600',
      };
    }
    if (lowerName.includes('business')) {
      return {
        border: 'border-orange-500',
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        checkmark: 'text-orange-500',
        price: 'text-orange-600',
      };
    }
    return {
      border: 'border-gray-300',
      text: 'text-gray-600',
      bg: 'bg-gray-50',
      checkmark: 'text-gray-500',
      price: 'text-gray-600',
    };
  };

  // Fonction pour déterminer le type de bouton à afficher
  const getActionButton = (plan: SubscriptionPlan) => {
    // Si pas d'abonnement actuel, rediriger vers le modal de sélection
    if (!currentPlanId) {
      return null; // Ce composant est pour gérer un abonnement existant uniquement
    }

    if (plan.id === currentPlanId) {
      // Plan actuel
      if (currentSub?.cancel_at_period_end) {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Se termine le {new Date(currentSub.current_period_end).toLocaleDateString('fr-FR')}
          </div>
        );
      }
      return (
        <button
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          onClick={() => handleModify('cancel')}
          data-testid={`button-cancel-${plan.id}`}
        >
          <XCircle className="h-4 w-4" />
          Annuler
        </button>
      );
    }

    // Déterminer si c'est un upgrade (plan plus cher)
    const currentPrice = currentSub?.subscription_plans?.price_monthly || 0;
    const isUpgrade = plan.price_monthly > currentPrice;
    
    // Si le plan est moins cher ou même prix : afficher message pour annuler d'abord
    if (!isUpgrade) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          Annulez votre plan actuel pour souscrire à ce plan
        </div>
      );
    }
    
    // Upgrade disponible uniquement
    return (
      <button
        className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        onClick={() => handleModify('upgrade', plan.id, plan.name)}
        data-testid={`button-upgrade-${plan.id}`}
      >
        <ArrowUp className="h-4 w-4" />
        Passer à ce plan
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Titre - masqué sur mobile */}
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold tracking-tight">Plans d'abonnement</h2>
      </div>

      {/* Alerte abonnement actif */}
      {currentSub && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-900">Vous avez déjà un abonnement actif</p>
            <p className="text-sm text-orange-700 mt-1">
              Vous êtes actuellement abonné au plan <strong>{currentSub.subscription_plans.name}</strong>. Vous pouvez gérer ou modifier votre plan à tout moment depuis l'onglet "Historique Achats" de votre tableau de bord.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {activePlans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.name.toLowerCase().includes('standard');
          const features = plan.features || {};
          const colors = getPlanColors(plan.name);

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 ${colors.border} p-4 sm:p-6 flex flex-col bg-white dark:bg-gray-900`}
              data-testid={`card-plan-${plan.id}`}
            >
              {/* Badge Populaire */}
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Populaire
                  </div>
                </div>
              )}

              {/* Badge Plan actuel */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                    <Check className="h-3 w-3" />
                    Plan actuel
                  </div>
                </div>
              )}

              <div className="mb-4 mt-2">
                <h3 className={`text-lg sm:text-xl font-semibold ${colors.text} mb-2`}>{plan.name}</h3>
                <div>
                  <span className={`text-2xl sm:text-3xl font-bold ${colors.price}`}>{plan.price_monthly}€</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm"> par mois</span>
                </div>
                <p className={`text-xs ${colors.text} mt-1`}>
                  {plan.max_listings === null
                    ? "Annonces illimitées"
                    : `${plan.max_listings} annonces max`}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-4 text-sm sm:text-base">
                {Object.entries(features).map(([feature, enabled]) => (
                  <li key={feature} className="flex items-center gap-2">
                    {enabled ? (
                      <Check className={`h-4 w-4 ${colors.checkmark} flex-shrink-0`} />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={enabled ? "" : "text-gray-500 dark:text-gray-400"}>
                      {FEATURE_LABELS[feature] || feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div>
                {getActionButton(plan)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmation */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">
              {confirmDialog.action === 'cancel'
                ? "Annuler l'abonnement"
                : confirmDialog.action === 'upgrade'
                ? "Passer au plan supérieur"
                : "Rétrograder le plan"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmDialog.action === 'cancel' ? (
                <>
                  Votre abonnement restera actif jusqu'à la fin de la période de facturation en cours.
                  Vous ne serez plus facturé par la suite.
                </>
              ) : (
                <>
                  Vous allez {confirmDialog.action === 'upgrade' ? 'passer à' : 'rétrograder vers'} le plan{' '}
                  <strong>{confirmDialog.planName}</strong>.
                  <br />
                  Le montant sera calculé au prorata de la période restante.
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                data-testid="button-cancel-dialog"
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                onClick={confirmModify}
                disabled={modifyMutation.isPending}
                data-testid="button-confirm-modify"
              >
                {modifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
