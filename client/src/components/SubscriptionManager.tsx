import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X, Loader2, ArrowUp, XCircle } from "lucide-react";
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

export default function SubscriptionManager() {
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ModifyAction;
    planId?: number;
    planName?: string;
  }>({ open: false, action: 'upgrade' });

  // Récupérer tous les plans disponibles
  const { data: plans = [], isLoading: loadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
  });

  // Récupérer l'abonnement actuel
  const { data: currentSub, isLoading: loadingSub } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscriptions/current'],
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gérer mon abonnement</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choisissez le plan qui correspond à vos besoins
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activePlans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const features = plan.features || {};

          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 flex flex-col ${
                isCurrentPlan
                  ? 'border-primary bg-gray-50 dark:bg-gray-800/50'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700" data-testid={`badge-current-${plan.id}`}>
                      Plan actuel
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-bold">{plan.price_monthly}€</span>
                  <span className="text-gray-500 dark:text-gray-400">/mois</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    {plan.max_listings === null
                      ? "Annonces illimitées"
                      : `${plan.max_listings} annonces/mois`}
                  </span>
                </li>
                {Object.entries(features).map(([feature, enabled]) => (
                  <li key={feature} className="flex items-center gap-2">
                    {enabled ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={enabled ? "" : "text-gray-500 dark:text-gray-400"}>
                      {feature}
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
