// client/src/utils/onboardingDetector.ts
export type OnboardingStep =
  | "profile"
  | "docs"
  | "payment"
  | "validation"
  | "completed"
  | "rejected";

export interface MinimalUser {
  id: string;
  type?: "pending" | "individual" | "professional" | "admin" | null;
  profile_completed?: boolean | null;
}

export interface MinimalProAccount {
  id?: number | null;
  verification_status?:
    | "not_started"
    | "pending"
    | "approved"
    | "rejected"
    | null;
  // Optionnel si tu ajoutes la colonne plus tard :
  // ready_for_review?: boolean | null;
}

export interface MinimalSubscription {
  id?: number | null;
  status?: "pending" | "active" | "canceled" | "expired" | null;
}

export type DetectResult = {
  step: OnboardingStep;
  reason: string; // utile pour logs/debug & éventuels toasts
  canPost: boolean; // règles business: pro payé peut créer des annonces (en attente)
  shouldShowPopup: boolean; // contrôle d’affichage du popup de choix de compte
};

export function detectOnboardingState(
  user: MinimalUser | null | undefined,
  pro: MinimalProAccount | null | undefined,
  sub: MinimalSubscription | null | undefined,
): DetectResult {
  console.log("🐞 DEBUG: detectOnboardingState - Paramètres reçus:");
  console.log("🐞   user =", user ? { id: user.id, type: user.type, profile_completed: user.profile_completed } : null);
  console.log("🐞   pro =", pro ? { verification_status: pro.verification_status } : null);
  console.log("🐞   sub =", sub ? { status: sub.status } : null);

  // Non connecté → laisse la logique existante gérer (ou rediriger vers login)
  if (!user) {
    const result = {
      step: "profile" as OnboardingStep,
      reason: "no_user",
      canPost: false,
      shouldShowPopup: true,
    };
    console.log("🐞 DEBUG: detectOnboardingState - RÉSULTAT no_user:", result);
    return result;
  }

  // Cas nouvel utilisateur "pending"
  if (user.type === "pending") {
    const result = {
      step: "profile" as OnboardingStep,
      reason: "new_user_pending",
      canPost: false,
      shouldShowPopup: true, // 👈 ouvrir le popup directement
    };
    console.log("🐞 DEBUG: detectOnboardingState - RÉSULTAT pending:", result);
    return result;
  }

  // Particulier
  if (user.type === "individual") {
    if (user.profile_completed) {
      return {
        step: "completed",
        reason: "individual_done",
        canPost: true,
        shouldShowPopup: false,
      };
    }
    return {
      step: "profile",
      reason: "individual_profile_missing",
      canPost: false,
      shouldShowPopup: true,
    };
  }

  // Professionnel
  if (user.type === "professional") {
    console.log("🐞 DEBUG: User type = 'professional', profile_completed =", user.profile_completed);
    
    // Cas A – Juste inscrit
    if (!user.profile_completed) {
      const result = {
        step: "profile" as OnboardingStep,
        reason: "pro_profile_missing",
        canPost: false,
        shouldShowPopup: true,
      };
      console.log("🐞 DEBUG: detectOnboardingState - RÉSULTAT pro_profile_missing:", result);
      return result;
    }

    console.log("🐞 DEBUG: User pro avec profile_completed = true, continuant vers documents...");

    // Profil ok, proAccount inexistant ou pas démarré → Cas B
    const v = pro?.verification_status ?? "not_started";
    const s = sub?.status ?? null;

    if (v === "rejected") {
      // Cas spécial → retour docs
      return {
        step: "docs",
        reason: "pro_docs_rejected",
        canPost: false,
        shouldShowPopup: false,
      };
    }

    if (v === "not_started") {
      return {
        step: "docs",
        reason: "pro_docs_not_started",
        canPost: false,
        shouldShowPopup: false,
      };
    }

    if (v === "pending") {
      // Cas C / D selon l’abonnement
      if (s !== "active") {
        return {
          step: "payment",
          reason: "pro_docs_pending_no_sub",
          canPost: false,
          shouldShowPopup: false,
        };
      }
      // s === 'active' → payé, en attente admin (Cas D)
      return {
        step: "validation",
        reason: "pro_docs_pending_with_active_sub",
        canPost: true,
        shouldShowPopup: false,
      };
    }

    if (v === "approved") {
      // Cas E — validé
      if (s === "active") {
        return {
          step: "completed",
          reason: "pro_verified_active",
          canPost: true,
          shouldShowPopup: false,
        };
      }

      // Détecter si on vient de Stripe Success
      const isFromStripeSuccess =
        typeof window !== "undefined" &&
        (window.location.pathname === "/success" ||
          window.location.search.includes("session_id"));

      if (isFromStripeSuccess) {
        return {
          step: "completed",
          reason: "stripe_success_detected",
          canPost: true,
          shouldShowPopup: false, // 🚫 Pas de popup après paiement
        };
      }

      // Cas rare: validé mais pas payé → renvoyer vers paiement
      return {
        step: "payment",
        reason: "pro_verified_but_no_active_sub",
        canPost: false,
        shouldShowPopup: false,
      };
    }
  }

  // Admin ou type inconnu → ne bloque rien
  return {
    step: "completed",
    reason: "fallback",
    canPost: true,
    shouldShowPopup: false,
  };
}