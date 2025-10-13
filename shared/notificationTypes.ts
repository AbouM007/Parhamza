// Types de notifications pour PassionAuto2Roues

export const NOTIFICATION_TYPES = {
  // Compte / Utilisateur
  WELCOME: 'welcome',
  PRO_ACCOUNT_ACTIVATED: 'pro_account_activated',
  
  // Messages
  NEW_MESSAGE: 'new_message',
  MESSAGE_REPLY: 'message_reply',
  
  // Annonces
  LISTING_VALIDATED: 'listing_validated',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_FAVORITED: 'listing_favorited',
  LISTING_EXPIRING: 'listing_expiring',
  
  // Social
  NEW_FOLLOWER: 'new_follower',
  FOLLOWED_NEW_LISTING: 'followed_new_listing',
  
  // Paiements
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  
  // Abonnements
  SUBSCRIPTION_ENDING: 'subscription_ending',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Configuration par défaut des canaux pour chaque type de notification
export const NOTIFICATION_DEFAULTS: Record<NotificationType, {
  inApp: boolean;
  email: boolean;
  push: boolean;
}> = {
  [NOTIFICATION_TYPES.WELCOME]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.PRO_ACCOUNT_ACTIVATED]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    inApp: true,
    email: true,
    push: true,
  },
  [NOTIFICATION_TYPES.MESSAGE_REPLY]: {
    inApp: true,
    email: true,
    push: true,
  },
  [NOTIFICATION_TYPES.LISTING_VALIDATED]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.LISTING_REJECTED]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.LISTING_FAVORITED]: {
    inApp: true,
    email: false,
    push: true,
  },
  [NOTIFICATION_TYPES.LISTING_EXPIRING]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.NEW_FOLLOWER]: {
    inApp: true,
    email: false,
    push: true,
  },
  [NOTIFICATION_TYPES.FOLLOWED_NEW_LISTING]: {
    inApp: true,
    email: false,
    push: true,
  },
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    inApp: true,
    email: true,
    push: true,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_ENDING]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED]: {
    inApp: true,
    email: true,
    push: false,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED]: {
    inApp: true,
    email: true,
    push: false,
  },
};

// Messages templates pour chaque type (utilisés pour générer title/message)
export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.WELCOME]: {
    title: (data: { userName: string }) => `Bienvenue ${data.userName} !`,
    message: () => 'Votre compte PassionAuto2Roues a été créé avec succès',
  },
  [NOTIFICATION_TYPES.PRO_ACCOUNT_ACTIVATED]: {
    title: () => 'Compte professionnel activé !',
    message: (data: { companyName: string }) => 
      `Votre compte professionnel ${data.companyName} est maintenant actif`,
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    title: (data: { senderName: string }) => `Nouveau message de ${data.senderName}`,
    message: (data: { listingTitle?: string }) => 
      data.listingTitle ? `Concernant: ${data.listingTitle}` : 'Vous avez reçu un nouveau message',
  },
  [NOTIFICATION_TYPES.MESSAGE_REPLY]: {
    title: (data: { senderName: string }) => `${data.senderName} vous a répondu`,
    message: (data: { listingTitle?: string }) => 
      data.listingTitle ? `Concernant: ${data.listingTitle}` : 'Nouvelle réponse à votre message',
  },
  [NOTIFICATION_TYPES.LISTING_VALIDATED]: {
    title: () => 'Votre annonce est en ligne !',
    message: (data: { listingTitle: string }) => 
      `${data.listingTitle} est maintenant visible sur PassionAuto2Roues`,
  },
  [NOTIFICATION_TYPES.LISTING_REJECTED]: {
    title: () => 'Annonce refusée',
    message: (data: { listingTitle: string; reason?: string }) => 
      `${data.listingTitle} a été refusée${data.reason ? `: ${data.reason}` : ''}`,
  },
  [NOTIFICATION_TYPES.LISTING_FAVORITED]: {
    title: () => 'Votre annonce intéresse !',
    message: (data: { listingTitle: string }) => 
      `${data.listingTitle} a été ajoutée aux favoris`,
  },
  [NOTIFICATION_TYPES.LISTING_EXPIRING]: {
    title: () => 'Votre annonce expire bientôt',
    message: (data: { listingTitle: string; daysLeft: number }) => 
      `${data.listingTitle} expire dans ${data.daysLeft} jour(s)`,
  },
  [NOTIFICATION_TYPES.NEW_FOLLOWER]: {
    title: (data: { followerName: string }) => `${data.followerName} vous suit !`,
    message: () => 'Vous avez un nouveau follower',
  },
  [NOTIFICATION_TYPES.FOLLOWED_NEW_LISTING]: {
    title: (data: { sellerName: string }) => `Nouvelle annonce de ${data.sellerName}`,
    message: (data: { listingTitle: string }) => 
      `${data.listingTitle} vient d'être publiée`,
  },
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: {
    title: () => 'Paiement réussi',
    message: (data: { amount: string; type: string }) => 
      `Votre ${data.type} de ${data.amount} a été confirmé`,
  },
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    title: () => 'Échec du paiement',
    message: (data: { reason?: string }) => 
      `Le paiement a échoué${data.reason ? `: ${data.reason}` : ''}`,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_ENDING]: {
    title: () => 'Votre abonnement expire bientôt',
    message: (data: { planName: string; daysLeft: number }) => 
      `${data.planName} expire dans ${data.daysLeft} jour(s)`,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED]: {
    title: () => 'Abonnement renouvelé',
    message: (data: { planName: string; nextBillingDate: string }) => 
      `Votre ${data.planName} a été renouvelé. Prochaine échéance : ${data.nextBillingDate}`,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED]: {
    title: () => 'Abonnement annulé',
    message: (data: { planName: string; endDate: string }) => 
      `Votre ${data.planName} a été annulé. Accès jusqu'au ${data.endDate}`,
  },
  [NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED]: {
    title: () => 'Abonnement modifié',
    message: (data: { oldPlan: string; newPlan: string; effectiveDate: string }) => 
      `Changement de ${data.oldPlan} vers ${data.newPlan}. Effectif le ${data.effectiveDate}`,
  },
};
