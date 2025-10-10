/**
 * Notification Center Service
 * Service central pour gérer l'envoi de notifications sur tous les canaux (in-app, email, push)
 */

import { db } from "../db";
import { notifications, notificationPreferences } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TEMPLATES,
  type NotificationType,
} from "../../shared/notificationTypes";

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
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.notificationType, notificationType)
        )
      )
      .limit(1);

    if (preferences.length === 0) {
      // Retourner les valeurs par défaut
      const defaults = NOTIFICATION_DEFAULTS[notificationType];
      return {
        inApp: defaults.inApp,
        email: defaults.email,
        push: defaults.push,
      };
    }

    return {
      inApp: preferences[0].enableInApp,
      email: preferences[0].enableEmail,
      push: preferences[0].enablePush,
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
 * Envoie une notification par email (à implémenter dans Phase 4)
 */
async function sendEmailNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`📧 Email notification (à implémenter): ${type} pour ${userId}`);
    // TODO Phase 4: Implémenter l'envoi d'email via emailService
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi d'email:", error);
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
      await db.insert(notifications).values({
        userId,
        type,
        title,
        message,
        data,
        channels: enabledChannels,
        sentChannels: ["in-app"],
        read: false,
      });
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
    data: { followerName, followerId },
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
    data: { sellerName, sellerId, listingId, listingTitle },
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
