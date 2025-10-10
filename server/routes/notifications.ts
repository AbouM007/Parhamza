import { Router } from "express";
import { db } from "../db";
import { notifications, notificationPreferences } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { NOTIFICATION_TYPES, NOTIFICATION_DEFAULTS } from "../../shared/notificationTypes";

const router = Router();

// GET /api/notifications - Récupérer toutes les notifications de l'utilisateur
router.get("/", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Limiter à 50 notifications récentes

    res.json(userNotifications);
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/notifications/unread-count - Nombre de notifications non lues
router.get("/unread-count", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.read, false)
        )
      );

    res.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error("Erreur lors du comptage des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/notifications/:id/read - Marquer une notification comme lue
router.patch("/:id/read", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const notificationId = parseInt(req.params.id);

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (notification.length === 0) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    if (notification[0].userId !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/notifications/read-all - Marquer toutes les notifications comme lues
router.patch("/read-all", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.read, false)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/notifications/:id - Supprimer une notification
router.delete("/:id", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const notificationId = parseInt(req.params.id);

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (notification.length === 0) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    if (notification[0].userId !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await db.delete(notifications).where(eq(notifications.id, notificationId));

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/notification-preferences - Récupérer les préférences utilisateur
router.get("/preferences", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.user.id));

    // Créer un objet avec toutes les préférences (par défaut si non définies)
    const allPreferences = Object.values(NOTIFICATION_TYPES).map((type) => {
      const existing = userPreferences.find((p) => p.notificationType === type);
      
      if (existing) {
        return existing;
      }

      // Retourner les valeurs par défaut
      const defaults = NOTIFICATION_DEFAULTS[type];
      return {
        userId: req.user!.id,
        notificationType: type,
        enableInApp: defaults.inApp,
        enableEmail: defaults.email,
        enablePush: defaults.push,
      };
    });

    res.json(allPreferences);
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/notification-preferences/:type - Mettre à jour les préférences pour un type
router.put("/preferences/:type", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { type } = req.params;
    const { enableInApp, enableEmail, enablePush } = req.body;

    // Vérifier que le type est valide
    if (!Object.values(NOTIFICATION_TYPES).includes(type as any)) {
      return res.status(400).json({ error: "Type de notification invalide" });
    }

    // Vérifier si une préférence existe déjà
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, req.user.id),
          eq(notificationPreferences.notificationType, type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Mettre à jour
      await db
        .update(notificationPreferences)
        .set({
          enableInApp: enableInApp ?? existing[0].enableInApp,
          enableEmail: enableEmail ?? existing[0].enableEmail,
          enablePush: enablePush ?? existing[0].enablePush,
        })
        .where(eq(notificationPreferences.id, existing[0].id));
    } else {
      // Créer
      await db.insert(notificationPreferences).values({
        userId: req.user.id,
        notificationType: type,
        enableInApp: enableInApp ?? NOTIFICATION_DEFAULTS[type as keyof typeof NOTIFICATION_DEFAULTS].inApp,
        enableEmail: enableEmail ?? NOTIFICATION_DEFAULTS[type as keyof typeof NOTIFICATION_DEFAULTS].email,
        enablePush: enablePush ?? NOTIFICATION_DEFAULTS[type as keyof typeof NOTIFICATION_DEFAULTS].push,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
