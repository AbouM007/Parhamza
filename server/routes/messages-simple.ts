import { Router } from "express";
import { supabaseServer } from "../supabase";
import { randomUUID } from "crypto";

const router = Router();

console.log("🔧 Route messages-simple chargée");

// Créer un message simple avec mapping IDs numériques
router.post("/send", async (req, res) => {
  try {
    const { fromUserId, toUserId, content, vehicleId } = req.body;

    console.log("📬 Envoi message avec IDs:", {
      fromUserId,
      toUserId,
      vehicleId,
    });

    // Plus besoin de mapping - utilisation directe des IDs string
    console.log("📝 IDs utilisés directement:", {
      from: fromUserId,
      to: toUserId,
    });

    // Vérifier les utilisateurs originaux
    const { data: fromUser } = await supabaseServer
      .from("users")
      .select("id, name")
      .eq("id", fromUserId)
      .single();

    const { data: toUser } = await supabaseServer
      .from("users")
      .select("id, name")
      .eq("id", toUserId)
      .single();

    if (!fromUser || !toUser) {
      return res.status(404).json({
        error: "Utilisateur introuvable",
        fromUser: fromUser?.name,
        toUser: toUser?.name,
      });
    }

    // Créer le message sans préfixe - le vehicleId est déjà stocké dans annonce_id
    const messageContent = content;

    // Insertion avec IDs numériques
    let messageCreated = false;
    let messageId = null;

    try {
      // Générer un ID unique pour contourner la contrainte NOT NULL
      const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

      const { data: newMessage, error } = await supabaseServer
        .from("messages")
        .insert([
          {
            id: uniqueId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            annonce_id: vehicleId ? parseInt(vehicleId) : null,
            content: messageContent,
            read: false,
          },
        ])
        .select("id")
        .single();

      if (!error) {
        messageCreated = true;
        messageId = newMessage.id;
        console.log("✅ Message sauvegardé dans Supabase!", messageId);
      } else {
        console.log("❌ Erreur création message:", error.message);
      }
    } catch (err) {
      console.log("❌ Erreur insertion:", err);
    }

    // Si échec, retourner erreur explicite
    if (!messageCreated) {
      console.log("❌ Impossible de créer le message dans Supabase");
      return res.status(500).json({
        error: "Erreur création message",
        debug: {
          fromUser: fromUser.name,
          toUser: toUser.name,
          contentLength: messageContent.length,
        },
      });
    }

    if (messageCreated) {
      res.status(201).json({
        success: true,
        messageId,
        message: "Message envoyé avec succès",
      });
    } else {
      res.status(500).json({
        error: "Impossible de créer le message",
        debug: {
          fromUser: fromUser.name,
          toUser: toUser.name,
          contentLength: messageContent.length,
        },
      });
    }
  } catch (error) {
    console.error("❌ Erreur envoi message:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message,
    });
  }
});

// Marquer les messages comme lus
router.post("/mark-read", async (req, res) => {
  try {
    const { messageIds, userId } = req.body;

    console.log("📖 Marquage messages comme lus:", { messageIds, userId });

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "IDs de messages requis" });
    }

    // Marquer seulement les messages dont l'utilisateur est destinataire
    const { error } = await supabaseServer
      .from("messages")
      .update({ read: true })
      .in("id", messageIds)
      .eq("to_user_id", userId);

    if (error) {
      console.error("❌ Erreur marquage lecture:", error);
      return res.status(500).json({ error: "Erreur marquage lecture" });
    }

    console.log("✅ Messages marqués comme lus");
    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur serveur marquage lecture:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les messages d'une conversation
router.get("/conversation/:userId1/:userId2", async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const { data: messages, error } = await supabaseServer
      .from("messages")
      .select(
        `
        *,
        from_user:users!from_user_id(id, name, email),
        to_user:users!to_user_id(id, name, email)
      `,
      )
      .or(
        `and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur récupération messages:", error);
      return res.status(500).json({ error: "Erreur récupération messages" });
    }

    // Messages prêts pour l'affichage (plus de nettoyage nécessaire)
    const cleanMessages =
      messages?.map((msg) => ({
        id: msg.id,
        content: msg.content,
        vehicleId: msg.annonce_id,
        fromUser: msg.from_user,
        toUser: msg.to_user,
        createdAt: msg.created_at,
        read: msg.read,
      })) || [];

    res.json(cleanMessages);
  } catch (error) {
    console.error("❌ Erreur conversation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les messages d'un utilisateur pour son dashboard
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📬 Récupération messages pour utilisateur:", userId);

    // Plus besoin de mapping - utilisation directe de l'ID string
    console.log("📝 ID utilisé directement:", userId);

    // ⚡ OPTIMISATION: Récupérer tous les messages avec JOINs pour éviter N+1
    // Une seule requête au lieu de 1 + N*2 requêtes (utilisateurs + véhicules)
    const startTime = Date.now();
    
    const { data: messages, error } = await supabaseServer
      .from("messages")
      .select(
        `
        id,
        from_user_id,
        to_user_id,
        annonce_id,
        content,
        read,
        created_at,
        from_user:users!from_user_id(id, name, email, type, avatar, company_logo),
        to_user:users!to_user_id(id, name, email, type, avatar, company_logo),
        annonce:annonces!annonce_id(id, title)
      `,
      )
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const queryTime = Date.now() - startTime;
    console.log(`⚡ Requête optimisée terminée en ${queryTime}ms`);

    if (error) {
      console.error("❌ Erreur récupération messages:", error.message);
      return res.status(500).json({ error: "Erreur récupération messages" });
    }

    console.log(`✅ Messages trouvés: ${messages.length}`);

    // Empêcher la mise en cache des messages pour avoir des données fraîches
    res.setHeader("Cache-Control", "no-store");

    // ⚡ Grouper par conversation en mémoire (toutes les données sont déjà chargées)
    const conversationsMap = new Map();

    for (const message of messages) {
      const isFromCurrentUser = message.from_user_id === userId;
      const otherUserId = isFromCurrentUser
        ? message.to_user_id
        : message.from_user_id;
      
      // Récupérer l'autre utilisateur depuis les données déjà chargées
      const otherUser = isFromCurrentUser ? message.to_user : message.from_user;

      // Créer un ID canonique pour la conversation
      const sortedUserIds = [message.from_user_id, message.to_user_id].sort();
      const conversationId = `${message.annonce_id}|${sortedUserIds[0]}|${sortedUserIds[1]}`;

      if (!conversationsMap.has(conversationId)) {
        conversationsMap.set(conversationId, {
          id: conversationId,
          vehicle_id: message.annonce_id,
          vehicle_title: message.annonce?.title || "Véhicule non spécifié",
          other_user: {
            id: otherUserId,
            name: otherUser?.name || "Utilisateur inconnu",
            email: otherUser?.email || "",
            type: otherUser?.type || "individual",
            avatar: otherUser?.avatar || null,
            company_logo: otherUser?.company_logo || null,
          },
          other_user_id: otherUserId,
          last_message_at: message.created_at,
          last_message: message.content,
          unread_count: 0,
          messages: [],
        });
      }

      const conversation = conversationsMap.get(conversationId);
      conversation.messages.push({
        id: message.id,
        content: message.content,
        sender_id: message.from_user_id,
        is_from_current_user: isFromCurrentUser,
        created_at: message.created_at,
        read: message.read,
      });

      // Compter les messages non lus (seulement ceux reçus par l'utilisateur actuel)
      if (!isFromCurrentUser && !message.read) {
        conversation.unread_count++;
      }
    }

    const conversations = Array.from(conversationsMap.values());

    res.json({
      conversations,
      total_messages: messages.length,
    });
  } catch (error) {
    console.error("❌ Erreur serveur messages utilisateur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Nouvelle route pour charger les messages d'une conversation spécifique
router.post("/conversation", async (req, res) => {
  try {
    const { vehicleId, user1Id, user2Id } = req.body || {};

    console.log("📬 Chargement conversation:", { vehicleId, user1Id, user2Id });

    if (!vehicleId || !user1Id || !user2Id) {
      return res.status(400).json({
        error: "vehicleId, user1Id et user2Id sont requis",
        received: { vehicleId, user1Id, user2Id },
      });
    }

    // Récupérer tous les messages de cette conversation avec informations utilisateur
    const { data: messages, error } = await supabaseServer
      .from("messages")
      .select(
        `
        id,
        from_user_id,
        to_user_id,
        content,
        read,
        created_at
      `,
      )
      .eq("annonce_id", vehicleId)
      .or(
        `and(from_user_id.eq.${user1Id},to_user_id.eq.${user2Id}),and(from_user_id.eq.${user2Id},to_user_id.eq.${user1Id})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur récupération messages conversation:", error);
      return res.status(500).json({
        error: "Erreur récupération messages",
        details: error.message,
        supabaseError: error,
      });
    }

    // Récupérer les informations des utilisateurs séparément
    const userIds = [user1Id, user2Id];
    const { data: users, error: usersError } = await supabaseServer
      .from("users")
      .select("id, name, avatar, type, company_logo")
      .in("id", userIds);

    if (usersError) {
      console.error("❌ Erreur récupération utilisateurs:", usersError);
    }

    // Créer un map des utilisateurs pour un accès rapide
    const usersMap = (users || []).reduce((acc: any, user: any) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const formattedMessages =
      messages?.map((msg: any) => {
        const fromUser = usersMap[msg.from_user_id];
        return {
          id: msg.id,
          from_user_id: msg.from_user_id,
          to_user_id: msg.to_user_id,
          content: msg.content,
          read: msg.read,
          created_at: msg.created_at,
          sender_name: fromUser?.name || "Utilisateur inconnu",
          sender_avatar:
            fromUser?.avatar ||
            (fromUser?.type === "professional" ? fromUser?.company_logo : null),
        };
      }) || [];

    console.log(
      `✅ ${formattedMessages.length} messages trouvés pour la conversation`,
    );
    res.json(formattedMessages);
  } catch (error) {
    console.error("❌ Erreur serveur conversation:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

// Route pour nettoyer les préfixes des anciens messages
router.post("/clean-prefixes", async (req, res) => {
  try {
    // Récupérer tous les messages avec préfixes
    const { data: messages, error: fetchError } = await supabaseServer
      .from("messages")
      .select("id, content")
      .like("content", "[Véhicule ID:%");

    if (fetchError) {
      console.error("❌ Erreur récupération messages:", fetchError);
      return res.status(500).json({ error: "Erreur récupération" });
    }

    console.log(
      `🧹 Nettoyage de ${messages?.length || 0} messages avec préfixes`,
    );

    // Nettoyer chaque message
    if (messages && messages.length > 0) {
      for (const message of messages) {
        const cleanContent = message.content.replace(
          /^\[Véhicule ID: \d+\]\s*/,
          "",
        );

        const { error: updateError } = await supabaseServer
          .from("messages")
          .update({ content: cleanContent })
          .eq("id", message.id);

        if (updateError) {
          console.error("❌ Erreur mise à jour message:", updateError);
        }
      }
    }

    console.log("✅ Messages nettoyés avec succès");
    res.json({ success: true, cleaned: messages?.length || 0 });
  } catch (error) {
    console.error("❌ Erreur nettoyage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route de développement pour vider la table messages
router.delete("/clear-all", async (req, res) => {
  try {
    const { error } = await supabaseServer
      .from("messages")
      .delete()
      .neq("id", 0); // Supprime tous les messages

    if (error) {
      console.error("❌ Erreur suppression messages:", error);
      return res.status(500).json({ error: "Erreur suppression" });
    }

    console.log("🗑️ Tous les messages supprimés");
    res.json({ success: true, message: "Messages supprimés" });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route de migration pour convertir tous les IDs numériques vers UUIDs
router.post("/migrate-users-to-uuid", async (req, res) => {
  try {
    console.log("🔄 Début migration utilisateurs vers UUIDs...");

    // 1. Récupérer tous les utilisateurs avec ID numérique
    const { data: numericUsers, error: fetchError } = await supabaseServer
      .from("users")
      .select("*")
      .not("id", "like", "%-%"); // Exclut les UUIDs (contiennent des tirets)

    if (fetchError) {
      console.error("❌ Erreur récupération users:", fetchError);
      return res
        .status(500)
        .json({ error: "Erreur récupération utilisateurs" });
    }

    console.log(`📊 ${numericUsers.length} utilisateurs à migrer`);
    const migrationResults = [];

    for (const user of numericUsers) {
      try {
        // Générer un UUID unique
        const newUuid = randomUUID();
        console.log(`🔄 Migration ${user.id} → ${newUuid}`);

        // 2. Créer le nouvel utilisateur avec UUID
        const { data: newUser, error: insertError } = await supabaseServer
          .from("users")
          .insert({
            id: newUuid,
            email: user.email,
            name: user.name,
            phone: user.phone,
            whatsapp: user.whatsapp,
            type: user.type,
            company_name: user.company_name,
            company_logo: user.company_logo,
            address: user.address,
            city: user.city,
            postal_code: user.postal_code,
            website: user.website,
            siret: user.siret,
            bio: user.bio,
            avatar: user.avatar,
            specialties: user.specialties,
            verified: user.verified,
            email_verified: user.email_verified,
            contact_preferences: user.contact_preferences,
            created_at: user.created_at,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Erreur création user ${newUuid}:`, insertError);
          continue;
        }

        // 3. Mettre à jour les annonces
        const { error: annoncesError } = await supabaseServer
          .from("annonces")
          .update({ user_id: newUuid })
          .eq("user_id", user.id);

        if (annoncesError) {
          console.error(
            `⚠️ Erreur maj annonces pour ${newUuid}:`,
            annoncesError,
          );
        }

        // 4. Mettre à jour les messages (from_user_id)
        const { error: messagesFromError } = await supabaseServer
          .from("messages")
          .update({ from_user_id: newUuid })
          .eq("from_user_id", user.id);

        // 5. Mettre à jour les messages (to_user_id)
        const { error: messagesToError } = await supabaseServer
          .from("messages")
          .update({ to_user_id: newUuid })
          .eq("to_user_id", user.id);

        if (messagesFromError || messagesToError) {
          console.error(
            `⚠️ Erreur maj messages pour ${newUuid}:`,
            messagesFromError,
            messagesToError,
          );
        }

        // 6. Supprimer l'ancien utilisateur
        const { error: deleteError } = await supabaseServer
          .from("users")
          .delete()
          .eq("id", user.id);

        if (deleteError) {
          console.error(
            `⚠️ Erreur suppression ancien user ${user.id}:`,
            deleteError,
          );
        }

        migrationResults.push({
          oldId: user.id,
          newUuid: newUuid,
          name: user.name,
          success: true,
        });

        console.log(
          `✅ Migration réussie: ${user.name} (${user.id} → ${newUuid})`,
        );
      } catch (error) {
        console.error(`❌ Erreur migration user ${user.id}:`, error);
        migrationResults.push({
          oldId: user.id,
          name: user.name,
          success: false,
          error: error.message,
        });
      }
    }

    console.log("🎉 Migration terminée !");
    res.json({
      success: true,
      message: "Migration utilisateurs terminée",
      results: migrationResults,
      migrated: migrationResults.filter((r) => r.success).length,
      failed: migrationResults.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error("❌ Erreur migration:", error);
    res.status(500).json({ error: "Erreur migration" });
  }
});

export default router;
