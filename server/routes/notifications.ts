import { Router } from "express";
import { supabaseServer } from "../supabase";
import { NOTIFICATION_TYPES, NOTIFICATION_DEFAULTS } from "../../shared/notificationTypes";

const router = Router();

// GET /api/notifications - Récupérer toutes les notifications de l'utilisateur
router.get("/", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { data: userNotifications, error } = await supabaseServer
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(userNotifications || []);
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

    const { count, error } = await supabaseServer
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("read", false);

    if (error) {
      console.error("Erreur lors du comptage des notifications:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json({ count: count || 0 });
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
    const { data: notification, error: fetchError } = await supabaseServer
      .from("notifications")
      .select("user_id")
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const { error: updateError } = await supabaseServer
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (updateError) {
      console.error("Erreur lors de la mise à jour de la notification:", updateError);
      return res.status(500).json({ error: "Erreur serveur" });
    }

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

    const { error } = await supabaseServer
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.id)
      .eq("read", false);

    if (error) {
      console.error("Erreur lors de la mise à jour des notifications:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

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
    const { data: notification, error: fetchError } = await supabaseServer
      .from("notifications")
      .select("user_id")
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const { error: deleteError } = await supabaseServer
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (deleteError) {
      console.error("Erreur lors de la suppression de la notification:", deleteError);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/notifications/preferences - Récupérer les préférences utilisateur
router.get("/preferences", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { data: userPreferences, error } = await supabaseServer
      .from("notification_preferences")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Erreur lors de la récupération des préférences:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    // Créer un objet avec toutes les préférences (par défaut si non définies)
    const allPreferences = Object.values(NOTIFICATION_TYPES).map((type) => {
      const existing = userPreferences?.find((p: any) => p.notification_type === type);
      
      if (existing) {
        return {
          userId: existing.user_id,
          notificationType: existing.notification_type,
          enableInApp: existing.enable_in_app,
          enableEmail: existing.enable_email,
          enablePush: existing.enable_push,
        };
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

// PUT /api/notifications/preferences - Mettre à jour les préférences utilisateur
router.put("/preferences", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const preferences = req.body.preferences;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: "Format de préférences invalide" });
    }

    // Vérifier et insérer/mettre à jour chaque préférence
    for (const pref of preferences) {
      const { notificationType, enableInApp, enableEmail, enablePush } = pref;

      // Vérifier si la préférence existe déjà
      const { data: existing } = await supabaseServer
        .from("notification_preferences")
        .select("id")
        .eq("user_id", req.user.id)
        .eq("notification_type", notificationType)
        .maybeSingle();

      if (existing) {
        // Mise à jour
        await supabaseServer
          .from("notification_preferences")
          .update({
            enable_in_app: enableInApp,
            enable_email: enableEmail,
            enable_push: enablePush,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", req.user.id)
          .eq("notification_type", notificationType);
      } else {
        // Insertion
        await supabaseServer
          .from("notification_preferences")
          .insert({
            user_id: req.user.id,
            notification_type: notificationType,
            enable_in_app: enableInApp,
            enable_email: enableEmail,
            enable_push: enablePush,
          });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
