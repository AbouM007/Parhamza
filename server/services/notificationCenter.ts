/**
 * Notification Center Service
 * Service central pour gérer l'envoi de notifications sur tous les canaux (in-app, email, push)
 */

import { supabaseServer } from "../supabase";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TEMPLATES,
  type NotificationType,
} from "../../shared/notificationTypes";
import { sendEmail } from "./emailService";

interface NotificationData {
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
}

interface NotificationChannels {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

/**
 * Récupère les préférences utilisateur pour un type de notification
 */
async function getUserPreferences(
  userId: string,
  notificationType: NotificationType
): Promise<NotificationChannels> {
  try {
    const { data: preferences, error } = await supabaseServer
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("notification_type", notificationType)
      .limit(1)
      .maybeSingle();

    if (error || !preferences) {
      // Retourner les valeurs par défaut
      const defaults = NOTIFICATION_DEFAULTS[notificationType];
      return {
        inApp: defaults.inApp,
        email: defaults.email,
        push: defaults.push,
      };
    }

    return {
      inApp: preferences.enable_in_app,
      email: preferences.enable_email,
      push: preferences.enable_push,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    // En cas d'erreur, retourner les valeurs par défaut
    const defaults = NOTIFICATION_DEFAULTS[notificationType];
    return {
      inApp: defaults.inApp,
      email: defaults.email,
      push: defaults.push,
    };
  }
}

/**
 * Génère le titre et le message à partir du template
 */
function generateNotificationContent(
  type: NotificationType,
  data: Record<string, any>
): { title: string; message: string } {
  const template = NOTIFICATION_TEMPLATES[type];

  if (!template) {
    console.error(`Template non trouvé pour le type: ${type}`);
    return {
      title: "Notification",
      message: "Vous avez une nouvelle notification",
    };
  }

  try {
    const title = template.title(data as any);
    const message = template.message(data as any);
    return { title, message };
  } catch (error) {
    console.error(`Erreur lors de la génération du contenu pour ${type}:`, error);
    return {
      title: "Notification",
      message: "Vous avez une nouvelle notification",
    };
  }
}

/**
 * Envoie une notification par email
 */
async function sendEmailNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    // Récupérer l'email de l'utilisateur
    const { data: user, error } = await supabaseServer
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (error || !user?.email) {
      console.error(`❌ Email introuvable pour l'utilisateur ${userId}`);
      return false;
    }

    // Envoyer l'email via emailService
    const emailSent = await sendEmail(type, title, {
      to: user.email,
      ...data,
    });

    if (emailSent) {
      console.log(`✅ Email envoyé avec succès à ${user.email}`);
    }

    return emailSent;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", error);
    return false;
  }
}

/**
 * Envoie une notification push (à implémenter dans Phase 7 - mobile app)
 */
async function sendPushNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`📱 Push notification (à implémenter): ${type} pour ${userId}`);
    // TODO Phase 7: Implémenter les push notifications pour Capacitor
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de push:", error);
    return false;
  }
}

/**
 * Fonction principale: Crée et envoie une notification
 */
export async function sendNotification({
  userId,
  type,
  data,
}: NotificationData): Promise<void> {
  try {
    console.log(`🔔 Envoi notification ${type} à l'utilisateur ${userId}`);

    // 1. Récupérer les préférences utilisateur
    const preferences = await getUserPreferences(userId, type);

    // 2. Déterminer les canaux activés
    const enabledChannels: string[] = [];
    if (preferences.inApp) enabledChannels.push("in-app");
    if (preferences.email) enabledChannels.push("email");
    if (preferences.push) enabledChannels.push("push");

    // Si aucun canal n'est activé, ne rien faire
    if (enabledChannels.length === 0) {
      console.log(`⏭️  Notification ${type} ignorée (aucun canal activé)`);
      return;
    }

    // 3. Générer le contenu de la notification
    const { title, message } = generateNotificationContent(type, data);

    // 4. Créer la notification en base de données (toujours créée si in-app est activé)
    if (preferences.inApp) {
      const { error } = await supabaseServer
        .from("notifications")
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          channels: enabledChannels,
          sent_channels: ["in-app"],
          read: false,
        });
      
      if (error) {
        console.error(`❌ Erreur création notification:`, error);
        throw error;
      }
      console.log(`✅ Notification in-app créée: ${title}`);
    }

    // 5. Envoyer sur les canaux externes activés
    const sentChannels = ["in-app"];

    if (preferences.email) {
      const emailSent = await sendEmailNotification(userId, type, title, message, data);
      if (emailSent) {
        sentChannels.push("email");
      }
    }

    if (preferences.push) {
      const pushSent = await sendPushNotification(userId, type, title, message, data);
      if (pushSent) {
        sentChannels.push("push");
      }
    }

    console.log(`✅ Notification envoyée sur les canaux: ${sentChannels.join(", ")}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    throw error;
  }
}

/**
 * Fonctions helper pour envoyer des notifications spécifiques
 */

export async function notifyNewMessage({
  recipientId,
  senderName,
  listingTitle,
}: {
  recipientId: string;
  senderName: string;
  listingTitle?: string;
}) {
  await sendNotification({
    userId: recipientId,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    data: { senderName, listingTitle },
  });
}

export async function notifyListingValidated({
  userId,
  listingId,
  listingTitle,
}: {
  userId: string;
  listingId: number;
  listingTitle: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.LISTING_VALIDATED,
    data: { listingId, listingTitle },
  });
}

export async function notifyListingRejected({
  userId,
  listingId,
  listingTitle,
  reason,
}: {
  userId: string;
  listingId: number;
  listingTitle: string;
  reason?: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.LISTING_REJECTED,
    data: { listingId, listingTitle, reason },
  });
}

export async function notifyNewFollower({
  followedUserId,
  followerName,
  followerId,
}: {
  followedUserId: string;
  followerName: string;
  followerId: string;
}) {
  await sendNotification({
    userId: followedUserId,
    type: NOTIFICATION_TYPES.NEW_FOLLOWER,
    data: { 
      followerName, 
      followerId,
      link: `https://passionauto2roues.com/professional/${followerId}`,
    },
  });
}

export async function notifyFollowedNewListing({
  followerId,
  sellerName,
  sellerId,
  listingId,
  listingTitle,
}: {
  followerId: string;
  sellerName: string;
  sellerId: string;
  listingId: number;
  listingTitle: string;
}) {
  await sendNotification({
    userId: followerId,
    type: NOTIFICATION_TYPES.FOLLOWED_NEW_LISTING,
    data: { 
      sellerName, 
      sellerId, 
      listingId, 
      listingTitle,
      link: `https://passionauto2roues.com/vehicle/${listingId}`,
    },
  });
}

export async function notifyPaymentSuccess({
  userId,
  amount,
  type,
  transactionId,
}: {
  userId: string;
  amount: string;
  type: string;
  transactionId?: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    data: { amount, type, transactionId },
  });
}

export async function notifyPaymentFailed({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.PAYMENT_FAILED,
    data: { reason },
  });
}

export async function notifyListingFavorited({
  userId,
  listingTitle,
  listingId,
}: {
  userId: string;
  listingTitle: string;
  listingId: number;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.LISTING_FAVORITED,
    data: { listingTitle, listingId },
  });
}

export async function notifyWelcome({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.WELCOME,
    data: { userName },
  });
}

export async function notifyProAccountActivated({
  userId,
  companyName,
}: {
  userId: string;
  companyName: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.PRO_ACCOUNT_ACTIVATED,
    data: { companyName },
  });
}

export async function notifySubscriptionEnding({
  userId,
  planName,
  daysLeft,
}: {
  userId: string;
  planName: string;
  daysLeft: number;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.SUBSCRIPTION_ENDING,
    data: { 
      planName, 
      daysLeft,
      link: `https://passionauto2roues.com/subscription-settings`,
    },
  });
}

export async function notifySubscriptionRenewed({
  userId,
  planName,
  amount,
  nextBillingDate,
}: {
  userId: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
    data: { 
      planName, 
      amount,
      nextBillingDate,
      link: `https://passionauto2roues.com/subscription-settings`,
    },
  });
}

export async function notifySubscriptionCancelled({
  userId,
  planName,
  endDate,
}: {
  userId: string;
  planName: string;
  endDate: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED,
    data: { 
      planName, 
      endDate,
      link: `https://passionauto2roues.com/subscription-settings`,
    },
  });
}

export async function notifySubscriptionDowngraded({
  userId,
  oldPlan,
  newPlan,
  effectiveDate,
}: {
  userId: string;
  oldPlan: string;
  newPlan: string;
  effectiveDate: string;
}) {
  await sendNotification({
    userId,
    type: NOTIFICATION_TYPES.SUBSCRIPTION_DOWNGRADED,
    data: { 
      oldPlan, 
      newPlan, 
      effectiveDate,
      link: `https://passionauto2roues.com/subscription-settings`,
    },
  });
}
