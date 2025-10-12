import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
import { MobilePageHeader } from "@/components/MobilePageHeader";

// Simple Toggle Component
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${checked ? 'bg-primary-bolt-500' : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

interface NotificationPreference {
  id?: number;
  notificationType: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enablePush: boolean;
}

const NOTIFICATION_CATEGORIES = {
  account: {
    label: "Compte",
    icon: "👤",
    types: [
      { type: "welcome", label: "Bienvenue" },
      { type: "pro_account_activated", label: "Compte professionnel activé" },
    ],
  },
  listings: {
    label: "Annonces",
    icon: "📝",
    types: [
      { type: "listing_validated", label: "Annonce validée" },
      { type: "listing_rejected", label: "Annonce rejetée" },
      { type: "listing_favorited", label: "Annonce ajoutée aux favoris" },
      { type: "listing_expiring", label: "Annonce expire bientôt" },
    ],
  },
  messages: {
    label: "Messages",
    icon: "💬",
    types: [
      { type: "new_message", label: "Nouveau message" },
      { type: "message_reply", label: "Réponse à un message" },
    ],
  },
  payments: {
    label: "Paiements",
    icon: "💳",
    types: [
      { type: "payment_success", label: "Paiement réussi" },
      { type: "payment_failed", label: "Paiement échoué" },
    ],
  },
  followers: {
    label: "Abonnements",
    icon: "👥",
    types: [
      { type: "new_follower", label: "Nouveau follower" },
      { type: "followed_new_listing", label: "Nouvelle annonce d'un vendeur suivi" },
    ],
  },
  subscriptions: {
    label: "Abonnements Premium",
    icon: "⭐",
    types: [
      { type: "subscription_renewed", label: "Abonnement renouvelé" },
      { type: "subscription_cancelled", label: "Abonnement annulé" },
      { type: "subscription_downgraded", label: "Abonnement modifié" },
      { type: "subscription_ending", label: "Abonnement expire bientôt" },
    ],
  },
};

// Valeurs par défaut
const DEFAULT_PREFERENCES: Record<string, { inApp: boolean; email: boolean; push: boolean }> = {
  welcome: { inApp: true, email: true, push: false },
  pro_account_activated: { inApp: true, email: true, push: false },
  new_message: { inApp: true, email: true, push: true },
  message_reply: { inApp: true, email: true, push: true },
  listing_validated: { inApp: true, email: true, push: false },
  listing_rejected: { inApp: true, email: true, push: false },
  listing_favorited: { inApp: true, email: false, push: true },
  listing_expiring: { inApp: true, email: true, push: false },
  new_follower: { inApp: true, email: false, push: true },
  followed_new_listing: { inApp: true, email: false, push: true },
  payment_success: { inApp: true, email: true, push: false },
  payment_failed: { inApp: true, email: true, push: true },
  subscription_ending: { inApp: true, email: true, push: false },
  subscription_renewed: { inApp: true, email: true, push: false },
  subscription_cancelled: { inApp: true, email: true, push: false },
  subscription_downgraded: { inApp: true, email: true, push: false },
};

export default function NotificationSettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(NOTIFICATION_CATEGORIES))
  );

  // Récupérer les préférences depuis l'API
  const { data: serverPreferences = [], isLoading } = useQuery<NotificationPreference[]>({
    queryKey: ["/api/notifications/preferences"],
  });

  // État local pour gérer les préférences avec updates immédiats
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference[]>(serverPreferences);

  // Synchroniser l'état local avec les données serveur au chargement
  useEffect(() => {
    if (serverPreferences.length > 0) {
      setLocalPreferences(serverPreferences);
    }
  }, [serverPreferences]);

  // Mutation pour mettre à jour les préférences
  const updateMutation = useMutation({
    mutationFn: async (updatedPreferences: NotificationPreference[]) => {
      return apiRequest("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: updatedPreferences }),
      });
    },
    onSuccess: (_, variables) => {
      // Mettre à jour le cache avec les nouvelles préférences
      queryClient.setQueryData(["/api/notifications/preferences"], variables);
      toast({
        title: "Préférences enregistrées",
        description: "Vos préférences de notifications ont été mises à jour.",
      });
    },
    onError: (_, __, context) => {
      // En cas d'erreur, restaurer les préférences serveur
      setLocalPreferences(serverPreferences);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences.",
        variant: "destructive",
      });
    },
  });

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const getPreference = (type: string): NotificationPreference => {
    const existing = localPreferences.find((p) => p.notificationType === type);
    if (existing) return existing;

    const defaults = DEFAULT_PREFERENCES[type] || { inApp: true, email: true, push: false };
    return {
      notificationType: type,
      enableInApp: defaults.inApp,
      enableEmail: defaults.email,
      enablePush: defaults.push,
    };
  };

  const updatePreference = (
    type: string,
    channel: "enableInApp" | "enableEmail" | "enablePush",
    value: boolean
  ) => {
    const currentPref = getPreference(type);
    const updatedPref = { ...currentPref, [channel]: value };

    // Update optimiste de l'état local
    const optimisticPreferences = localPreferences.filter((p) => p.notificationType !== type);
    optimisticPreferences.push(updatedPref);
    setLocalPreferences(optimisticPreferences);

    // Envoyer la mutation au serveur
    updateMutation.mutate(optimisticPreferences);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobilePageHeader title="Paramètres de notifications" onBack={() => navigate("/account")} />
        
        {/* Desktop header */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paramètres de notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez vos préférences de notifications par canal
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full bg-white dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <MobilePageHeader title="Paramètres de notifications" onBack={() => navigate("/account")} />

      {/* Desktop header */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres de notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos préférences de notifications par canal
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Canaux de notifications
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>In-app : Notifications dans l'application</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email : Notifications par email</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <Smartphone className="h-4 w-4" />
                  <span>Push : Notifications mobiles (bientôt disponible)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8">
        <div className="space-y-3">
          {Object.entries(NOTIFICATION_CATEGORIES).map(([categoryKey, category]) => {
            const isExpanded = expandedCategories.has(categoryKey);

            return (
              <div key={categoryKey} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Category header - Mobile collapsible */}
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full lg:cursor-default"
                  data-testid={`category-${categoryKey}`}
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 lg:bg-transparent">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {category.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Legend - Desktop only */}
                      <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 mr-4">
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          <span>In-app</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>Email</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-50">
                          <Smartphone className="h-3 w-3" />
                          <span>Push</span>
                        </div>
                      </div>
                      {/* Chevron - Mobile only */}
                      <div className="lg:hidden">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Notification types - Always visible on desktop, collapsible on mobile */}
                <div
                  className={`
                    ${isExpanded ? 'block' : 'hidden lg:block'}
                    divide-y divide-gray-100 dark:divide-gray-700
                  `}
                >
                  {category.types.map((notifType) => {
                    const pref = getPreference(notifType.type);

                    return (
                      <div
                        key={notifType.type}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        data-testid={`notification-${notifType.type}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {notifType.label}
                            </p>
                          </div>

                          {/* Toggles */}
                          <div className="flex items-center gap-6 lg:gap-8">
                            {/* In-app */}
                            <div className="flex items-center gap-3 min-w-[100px]">
                              <Bell className="h-4 w-4 text-gray-400 lg:hidden" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 lg:hidden">
                                In-app
                              </span>
                              <Toggle
                                checked={pref.enableInApp}
                                disabled={updateMutation.isPending}
                                onChange={(checked: boolean) =>
                                  updatePreference(notifType.type, "enableInApp", checked)
                                }
                              />
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-3 min-w-[100px]">
                              <Mail className="h-4 w-4 text-gray-400 lg:hidden" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 lg:hidden">
                                Email
                              </span>
                              <Toggle
                                checked={pref.enableEmail}
                                disabled={updateMutation.isPending}
                                onChange={(checked: boolean) =>
                                  updatePreference(notifType.type, "enableEmail", checked)
                                }
                              />
                            </div>

                            {/* Push (disabled) */}
                            <div className="flex items-center gap-3 min-w-[100px] opacity-50">
                              <Smartphone className="h-4 w-4 text-gray-400 lg:hidden" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 lg:hidden">
                                Push
                              </span>
                              <Toggle
                                checked={false}
                                disabled
                                onChange={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
