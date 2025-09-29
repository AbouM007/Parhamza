import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import wishlistRoutes from "./routes/wishlist";
import savedSearchRoutes from "./routes/saved-searches";
import adminRoutes from "./routes/admin";
import messagingRoutes from "./routes/messaging";
import messagingSimpleRoutes from "./routes/messages-simple";
import conversationsRoutes from "./routes/conversations";
import profileRoutes from "./routes/profile";
import favoritesRoutes from "./routes/favorites";
import imagesRoutes from "./routes/images";
import authSyncRoutes from "./routes/auth-sync";
import { professionalShopRouter } from "./routes/professional-shop";
import { subscriptionsRouter } from "./routes/subscriptions";
import { setupWishlistMigration } from "./routes/wishlist-migration.js";
import { setupWishlistDirect } from "./routes/wishlist-direct.js";
import { ensureUserExists, createUserFromAuth } from "./auth-hooks";
import { supabaseServer } from "./supabase";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import avatarRoutes from "./routes/avatar";

// Configuration multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      console.log("🐞 DEBUG: GET /api/users/:id - userId =", req.params.id);
      const user = await storage.getUser(req.params.id);
      if (!user) {
        console.log("🐞 DEBUG: User non trouvé pour id:", req.params.id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("🐞 DEBUG: User récupéré depuis storage:");
      console.log("🐞   user.type =", user.type);
      console.log("🐞   user.profile_completed =", (user as any).profile_completed);
      
      // 🔧 Mapper les propriétés snake_case → camelCase pour le frontend
      const mappedUser = {
        ...user,
        profileCompleted: (user as any).profile_completed,
        postalCode: (user as any).postal_code,
        companyName: (user as any).company_name,
        emailVerified: (user as any).email_verified,
        lastLoginAt: (user as any).last_login_at,
        contactPreferences: (user as any).contact_preferences,
        onboardingStatus: (user as any).onboarding_status,
        createdAt: (user as any).created_at
      };
      
      console.log("🐞 DEBUG: Après mapping:");
      console.log("🐞   mappedUser.type =", mappedUser.type);
      console.log("🐞   mappedUser.profileCompleted =", mappedUser.profileCompleted);
      
      res.setHeader("Cache-Control", "no-store");
      res.json(mappedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Route pour récupérer les infos professionnelles par userId
  app.get("/api/professional-account/:userId", async (req, res) => {
    try {
      const { data, error } = await supabaseServer
        .from("professional_accounts")
        .select("*")
        .eq("user_id", req.params.userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching professional account:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch professional account" });
      }

      res.setHeader("Cache-Control", "no-store");
      res.json(data || null);
    } catch (error) {
      console.error("Error fetching professional account:", error);
      res.status(500).json({ error: "Failed to fetch professional account" });
    }
  });

  app.get("/api/users/by-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.setHeader("Cache-Control", "no-store");
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by email:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Test endpoint to see available user emails
  app.get("/api/users/emails", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const emails = users.map((user) => ({
        email: user.email,
        name: user.name,
        type: user.type,
      }));
      res.json(emails);
    } catch (error) {
      console.error("Error fetching user emails:", error);
      res.status(500).json({ error: "Failed to fetch user emails" });
    }
  });

  // Endpoint pour synchroniser un utilisateur Supabase Auth avec la table users
  app.post("/api/users/sync-auth", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Authorization header required" });
      }

      // Vérifier le token Supabase Auth
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: authError,
      } = await supabaseServer.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Utiliser le hook intelligent pour créer/synchroniser
      const syncedUser = await createUserFromAuth(
        user.id,
        user.email || "",
        user.user_metadata,
      );
      res
        .status(200)
        .json({ message: "User synchronized successfully", user: syncedUser });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Route pour vérifier le statut "Passionné" d'un utilisateur particulier
  app.get("/api/users/:id/passionate-status", async (req, res) => {
    try {
      const userId = req.params.id;

      // Vérifier d'abord que l'utilisateur existe et est un particulier
      const user = await storage.getUser(userId);
      console.log(`🔍 PASSIONATE DEBUG - User ${userId}:`, {
        email: user?.email,
        type: user?.type,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Si ce n'est pas un particulier, pas de statut Passionné
      if (user.type !== "individual") {
        console.log(
          `❌ PASSIONATE DEBUG - User ${userId} type: ${user.type} (not individual)`,
        );
        return res.json({ isPassionate: false });
      }

      // Vérifier s'il a un abonnement actif - utiliser join manuel pour éviter les problèmes de relation
      const { data: subscription, error } = await supabaseServer
        .from("subscriptions")
        .select(
          `
          id,
          status,
          plan_id
        `,
        )
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let planName = null;
      if (subscription && subscription.plan_id) {
        const { data: plan } = await supabaseServer
          .from("subscription_plans")
          .select("name")
          .eq("id", subscription.plan_id)
          .single();
        planName = plan?.name || null;
      }

      if (error) {
        console.error("Error checking passionate status:", error);
        return res
          .status(500)
          .json({ error: "Failed to check passionate status" });
      }

      // Retourner le statut
      const isPassionate = !!subscription;
      const result = {
        isPassionate,
        planName,
      };

      res.setHeader("Cache-Control", "max-age=300"); // Cache 5 minutes
      res.json(result);
    } catch (error) {
      console.error("Error checking passionate status:", error);
      res.status(500).json({ error: "Failed to check passionate status" });
    }
  });

  // Endpoint temporaire pour synchroniser manuellement un utilisateur (DEVELOPMENT ONLY)
  app.post("/api/users/manual-sync", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      // Récupérer l'utilisateur depuis Supabase Auth par email
      const { data: authUsers, error: listError } =
        await supabaseServer.auth.admin.listUsers();

      if (listError) {
        console.error("Error listing auth users:", listError);
        return res.status(500).json({ error: "Failed to list auth users" });
      }

      const authUser = authUsers.users.find((u) => u.email === email);
      if (!authUser) {
        return res
          .status(404)
          .json({ error: "User not found in Supabase Auth" });
      }

      // Utiliser le hook intelligent pour créer/synchroniser
      const syncedUser = await createUserFromAuth(
        authUser.id,
        authUser.email || "",
        authUser.user_metadata,
      );
      res.status(200).json({
        message: "User manually synchronized successfully",
        user: syncedUser,
      });
    } catch (error) {
      console.error("Error manually syncing user:", error);
      res.status(500).json({ error: "Failed to manually sync user" });
    }
  });

  // Admin endpoints for moderation
  app.get("/api/admin/pending-annonces", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const pendingVehicles = await storage.getPendingVehicles();
      res.json(pendingVehicles);
    } catch (error) {
      console.error("Error fetching pending vehicles:", error);
      res.status(500).json({ error: "Failed to fetch pending vehicles" });
    }
  });

  app.patch("/api/admin/annonces/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.approveVehicle(id);
      res.json({ success: true, message: "Annonce approuvée" });
    } catch (error) {
      console.error("Error approving vehicle:", error);
      res.status(500).json({ error: "Failed to approve vehicle" });
    }
  });

  app.patch("/api/admin/annonces/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await storage.rejectVehicle(id, reason);
      res.json({ success: true, message: "Annonce rejetée" });
    } catch (error) {
      console.error("Error rejecting vehicle:", error);
      res.status(500).json({ error: "Failed to reject vehicle" });
    }
  });

  // Vehicles API - only active vehicles for public site
  app.get("/api/vehicles", async (req, res) => {
    try {
      // Disable caching to always get fresh data
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Get vehicles by specific user (includes inactive for dashboard)
  app.get("/api/vehicles/user/:userId", async (req, res) => {
    try {
      const userVehicles = await storage.getVehiclesByUser(req.params.userId);
      res.json(userVehicles);
    } catch (error) {
      console.error("Error fetching user vehicles:", error);
      res.status(500).json({ error: "Failed to fetch user vehicles" });
    }
  });

  // Get deleted vehicles by specific user
  app.get("/api/vehicles/user/:userId/deleted", async (req, res) => {
    try {
      const deletedVehicles = await storage.getDeletedVehiclesByUser(
        req.params.userId,
      );
      res.json(deletedVehicles);
    } catch (error) {
      console.error("Error fetching deleted user vehicles:", error);
      res.status(500).json({ error: "Failed to fetch deleted user vehicles" });
    }
  });

  // Route pour récupérer le nombre total d'annonces supprimées sur tout le site
  app.get("/api/vehicles/deleted/count", async (req, res) => {
    try {
      console.log("🔄 Récupération nombre total annonces supprimées...");
      const { data, error } = await supabaseServer
        .from("annonces")
        .select("id", { count: "exact" })
        .not("deleted_at", "is", null);

      if (error) {
        console.error("❌ Erreur comptage annonces supprimées:", error);
        return res
          .status(500)
          .json({ error: "Failed to count deleted vehicles" });
      }

      const totalDeleted = data?.length || 0;
      console.log(`✅ Nombre total annonces supprimées: ${totalDeleted}`);
      res.json({ totalDeleted });
    } catch (error) {
      console.error("❌ Erreur récupération total annonces supprimées:", error);
      res.status(500).json({ error: "Failed to fetch deleted vehicles count" });
    }
  });

  // Route pour obtenir les statistiques complètes des annonces
  app.get("/api/admin/vehicles-stats", async (req, res) => {
    try {
      console.log("📊 Récupération statistiques complètes annonces...");

      // Total des annonces
      const { data: totalData, error: totalError } = await supabaseServer
        .from("annonces")
        .select("id, status, is_active, deleted_at");

      if (totalError) {
        console.error("❌ Erreur récupération stats:", totalError);
        return res.status(500).json({ error: "Failed to fetch stats" });
      }

      const stats = {
        total: totalData?.length || 0,
        active:
          totalData?.filter(
            (a) =>
              a.status === "approved" && a.is_active !== false && !a.deleted_at,
          ).length || 0,
        pending:
          totalData?.filter((a) => a.status === "pending" && !a.deleted_at)
            .length || 0,
        rejected:
          totalData?.filter((a) => a.status === "rejected" && !a.deleted_at)
            .length || 0,
        inactive:
          totalData?.filter((a) => a.is_active === false && !a.deleted_at)
            .length || 0,
        deleted: totalData?.filter((a) => a.deleted_at).length || 0,
      };

      console.log("📈 Stats générées:", stats);
      res.json(stats);
    } catch (error) {
      console.error("❌ Erreur récupération stats complètes:", error);
      res.status(500).json({ error: "Failed to fetch complete stats" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicleWithUser(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles/search", async (req, res) => {
    try {
      const filters = req.body;
      const vehicles = await storage.searchVehicles(filters);
      res.json(vehicles);
    } catch (error) {
      console.error("Error searching vehicles:", error);
      res.status(500).json({ error: "Failed to search vehicles" });
    }
  });

  // NOUVEAU : Synchronisation immédiate après inscription
  app.post("/api/users/sync-from-signup", async (req, res) => {
    try {
      const { authUserId, email, metadata } = req.body;

      if (!authUserId || !email) {
        return res.status(400).json({ error: "authUserId et email requis" });
      }

      console.log(
        "🔄 Sync immédiate demandée pour:",
        email,
        "(ID:",
        authUserId,
        ")",
      );

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await storage.getUser(authUserId);
      if (existingUser) {
        console.log("✅ Utilisateur existant trouvé:", existingUser.name);
        return res.json({ user: existingUser, created: false });
      }

      // Créer l'utilisateur avec les métadonnées d'inscription
      const userData = {
        id: authUserId,
        email: email,
        name: metadata?.name || extractNameFromEmail(email),
        type: metadata?.type || "pending",
        phone: metadata?.phone || null,
        whatsapp: metadata?.phone || null,
        company_name: metadata?.companyName || null, // ✅ Corrigé: snake_case comme dans le schéma DB
        city: null,
        postal_code: null,
        email_verified: false, // Pas encore confirmé
        profile_completed: false,
        onboarding_status: "incomplete_profile",
      };

      const newUser = await storage.createUser(userData);
      console.log(
        "✅ Utilisateur synchronisé immédiatement:",
        newUser.name,
        `(${newUser.type})`,
      );

      res.json({ user: newUser, created: true });
    } catch (error: any) {
      console.error("❌ Erreur sync immédiate:", error);

      // 📱 Gestion spécifique pour téléphone existant
      if (error.message === "PHONE_ALREADY_EXISTS") {
        return res.status(409).json({
          error: "PHONE_ALREADY_EXISTS",
          message:
            "Ce numéro de téléphone est déjà utilisé par un autre compte.",
        });
      }

      // 📧 Gestion spécifique pour email existant
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return res.status(409).json({
          error: "EMAIL_ALREADY_EXISTS",
          message: "Cette adresse email est déjà utilisée.",
        });
      }

      // ⚠️ Erreur générique
      res.status(500).json({
        error: "SYNC_ERROR",
        message: "Erreur lors de la création du compte. Veuillez réessayer.",
      });
    }
  });

  // Helper function pour extraire nom depuis email
  function extractNameFromEmail(email: string): string {
    const localPart = email.split("@")[0];
    return (
      localPart
        .replace(/[._]/g, " ")
        .split(" ")
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" ") || "Utilisateur"
    );
  }

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = req.body;
      console.log(
        "🔍 DONNÉES REÇUES PAR L'API:",
        JSON.stringify(vehicleData, null, 2),
      );
      console.log("DEBUG USER ID:", vehicleData.userId);

      if (!vehicleData.userId) {
        return res.status(400).json({ error: "userId manquant" });
      }

      // 🔐 Vérifier que l'utilisateur existe
      const userExists = await ensureUserExists(
        vehicleData.userId,
        vehicleData.contact?.email || vehicleData.contact_email,
      );

      if (!userExists) {
        const contactEmail =
          vehicleData.contact?.email ||
          vehicleData.contact_email ||
          "user@example.com";
        const contactPhone =
          vehicleData.contact?.phone || vehicleData.contact_phone || "";
        const city = vehicleData.location?.city || vehicleData.location || "";
        const postalCode =
          vehicleData.location?.postalCode || vehicleData.postal_code || null;

        await createUserFromAuth(vehicleData.userId, contactEmail, {
          phone: contactPhone,
          city: city,
          postal_code: postalCode,
        });
      }

      // 🚦 Vérification du quota AVANT création
      const quotaCheck = await storage.checkListingQuota(vehicleData.userId);
      console.log(`📊 Résultat vérification quota:`, quotaCheck);

      if (!quotaCheck?.canCreate) {
        // ⛔ Stopper ici
        return res.status(403).json({
          error: "Quota d'annonces atteint",
          message: quotaCheck?.message || "Vous avez atteint votre limite",
          quota: {
            activeListings: quotaCheck?.activeListings ?? 0,
            maxListings: quotaCheck?.maxListings ?? 0,
          },
        });
      }

      // ✅ Si quota OK → Création
      const vehicle = await storage.createVehicle(vehicleData);
      return res.status(201).json(vehicle);
    } catch (error) {
      console.error("❌ Error creating vehicle:", error);
      return res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const updates = req.body;
      const vehicle = await storage.updateVehicle(req.params.id, updates);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  // Endpoint rapide pour vérifier le quota d'annonces d'un utilisateur (pour interception)
  /*
  app.get("/api/users/:id/quota/check", async (req, res) => {
    try {
      const userId = req.params.id;

      // Utiliser la méthode existante de vérification quota
      const quotaInfo = await storage.checkListingQuota(userId);

      // Retourner les infos nécessaires pour l'interception côté client
      res.json({
        canCreate: quotaInfo.canCreate,
        remaining: quotaInfo.maxListings ? Math.max(0, quotaInfo.maxListings - quotaInfo.activeListings) : null,
        used: quotaInfo.activeListings,
        maxListings: quotaInfo.maxListings,
        message: quotaInfo.message
      });
    } catch (error) {
      console.error("Error checking user quota:", error);
      // En cas d'erreur, autoriser par défaut (fail-safe)
      res.json({
        canCreate: true,
        remaining: null,
        used: 0,
        maxListings: null,
        message: "Erreur lors de la vérification, autorisation par défaut"
      });
    }
  });
  */
  app.get("/api/users/:id/quota/check", async (req, res) => {
    try {
      const userId = req.params.id;

      const quotaInfo = await storage.checkListingQuota(userId);
      const { canCreate, activeListings, maxListings, message } = quotaInfo;

      // remaining: null = illimité ; sinon calcule (y compris 0)
      const remaining =
        maxListings === null
          ? null
          : Math.max(0, (maxListings ?? 0) - (activeListings ?? 0));

      res.setHeader("Cache-Control", "no-store");
      res.json({
        canCreate,
        remaining, // 0 = plus rien ; null = illimité
        used: activeListings, // alias pour compat
        activeListings, // explicite
        maxListings, // number | null
        message,
      });
    } catch (error) {
      console.error("Error checking user quota:", error);
      res.setHeader("Cache-Control", "no-store");
      res.json({
        canCreate: true,
        remaining: null,
        used: 0,
        activeListings: 0,
        maxListings: null,
        message: "Erreur lors de la vérification, autorisation par défaut",
      });
    }
  });

  // Get quota information for professional accounts
  app.get("/api/users/:userId/quota", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`📊 Récupération quota pour utilisateur: ${userId}`);

      const quotaInfo = await storage.checkListingQuota(userId);
      res.json(quotaInfo);
    } catch (error) {
      console.error("❌ Erreur récupération quota:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du quota" });
    }
  });

  // Toggle vehicle active status
  app.patch("/api/annonces/:id/toggle-active", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const success = await storage.updateVehicleActiveStatus(id, isActive);

      if (!success) {
        return res
          .status(500)
          .json({ error: "Erreur lors du changement de statut" });
      }

      res.json({ success: true, isActive });
    } catch (error) {
      console.error("❌ Erreur changement statut:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // Soft delete avec questionnaire
  app.post("/api/vehicles/:id/delete-with-reason", async (req, res) => {
    try {
      const { reason, comment } = req.body;

      if (!reason) {
        return res.status(400).json({ error: "Reason is required" });
      }

      // Valider les raisons acceptées
      const validReasons = [
        "sold_on_site",
        "sold_elsewhere",
        "no_longer_selling",
        "other",
      ];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: "Invalid deletion reason" });
      }

      const success = await storage.softDeleteVehicleWithReason(
        req.params.id,
        reason,
        comment,
      );
      if (!success) {
        return res
          .status(404)
          .json({ error: "Vehicle not found or could not be deleted" });
      }

      res.json({
        success: true,
        message: "Vehicle soft deleted successfully",
        reason,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error soft deleting vehicle:", error);
      res.status(500).json({ error: "Failed to soft delete vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // Get all vehicles for admin (includes inactive) - placed after specific routes
  app.get("/api/admin/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehiclesAdmin();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching admin vehicles:", error);
      res.status(500).json({ error: "Failed to fetch admin vehicles" });
    }
  });

  // Messages API
  app.get("/api/vehicles/:vehicleId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByVehicle(req.params.vehicleId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/users/:userId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByUser(req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      console.log(
        "📩 Tentative de création de message:",
        JSON.stringify(messageData, null, 2),
      );

      // Validation basique mais flexible
      const hasFromId = messageData.from_user_id || messageData.fromUserId;
      const hasToId = messageData.to_user_id || messageData.toUserId;
      const hasVehicleId = messageData.annonce_id || messageData.vehicleId;

      if (
        !messageData.id ||
        !hasFromId ||
        !hasToId ||
        !hasVehicleId ||
        !messageData.content
      ) {
        console.error("❌ Données de message incomplètes:", messageData);
        return res.status(400).json({
          error: "Message data incomplete",
          details: "Champs requis manquants",
          missingFields: {
            id: !messageData.id,
            fromId: !hasFromId,
            toId: !hasToId,
            vehicleId: !hasVehicleId,
            content: !messageData.content,
          },
        });
      }

      try {
        // Vérifier si les IDs utilisateurs existent
        const fromUserCheck = await supabaseServer
          .from("users")
          .select("id")
          .eq("id", messageData.from_user_id || messageData.fromUserId)
          .single();
        if (fromUserCheck.error) {
          console.error(
            "❌ Utilisateur expéditeur non trouvé:",
            fromUserCheck.error,
          );
          return res.status(400).json({
            error: "L'utilisateur expéditeur n'existe pas",
            details: fromUserCheck.error.message,
          });
        }

        const toUserCheck = await supabaseServer
          .from("users")
          .select("id")
          .eq("id", messageData.to_user_id || messageData.toUserId)
          .single();
        if (toUserCheck.error) {
          console.error(
            "❌ Utilisateur destinataire non trouvé:",
            toUserCheck.error,
          );
          return res.status(400).json({
            error: "L'utilisateur destinataire n'existe pas",
            details: toUserCheck.error.message,
          });
        }

        // Vérifier si l'annonce existe
        const vehicleId = messageData.annonce_id || messageData.vehicleId;
        const vehicleCheck = await supabaseServer
          .from("annonces")
          .select("id")
          .eq("id", vehicleId)
          .single();
        if (vehicleCheck.error) {
          console.error("❌ Annonce non trouvée:", vehicleCheck.error);
          return res.status(400).json({
            error: "L'annonce n'existe pas",
            details: vehicleCheck.error.message,
          });
        }
      } catch (checkError) {
        console.error(
          "❌ Erreur lors de la vérification des références:",
          checkError,
        );
      }

      const message = await storage.createMessage(messageData);
      console.log("✅ Message créé avec succès:", message.id);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("❌ Error creating message:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("duplicate key")) {
        res
          .status(409)
          .json({ error: "Duplicate message ID", message: error.message });
      } else if (error.message.includes("foreign key constraint")) {
        res.status(400).json({
          error: "Référence invalide - une des clés étrangères n'existe pas",
          message: error.message,
        });
      } else if (error.message.includes("column")) {
        res.status(400).json({
          error: "Structure de la table incorrecte",
          message: error.message,
        });
      } else {
        res
          .status(500)
          .json({ error: "Failed to create message", message: error.message });
      }
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const success = await storage.markMessageAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // ===============================
  // API : Création / Mise à jour compte (perso + pro)
  // ===============================

  // NOUVEAU : Endpoint pour sauvegarder les données de profil en brouillon
  // (sans marquer profile_completed = true)
  app.post("/api/profile/draft", async (req, res) => {
    try {
      console.log("📝 Sauvegarde brouillon profil...");
      console.log("📄 Données reçues:", req.body);

      // 1) Authentification
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ error: "Token d'authentification manquant" });
      }
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: authError,
      } = await supabaseServer.auth.getUser(token);
      if (authError || !user) {
        console.error("❌ Auth échouée:", authError);
        return res.status(401).json({ error: "Token invalide" });
      }

      // 2) Champs reçus
      const {
        companyName,
        siret,
        companyAddress,
        phone,
        website,
        description,
        name,
        city,
        postalCode,
        whatsapp,
        type,
      } = req.body;

      console.log(`📝 Sauvegarde brouillon pour type: ${type}`);

      // ======================================
      // CAS 1 : BROUILLON PROFESSIONNEL
      // ======================================
      if (type === "professional" && companyName && siret) {
        console.log("🏢 Sauvegarde brouillon professionnel");

        // Validation SIRET
        if (!/^\d{14}$/.test(siret)) {
          return res
            .status(400)
            .json({ error: "SIRET invalide (14 chiffres requis)" });
        }

        // Architecture propre : seulement professional_accounts, pas de pollution de users
        try {
          // 1) Vérifier si un compte pro existe déjà
          const { data: existing, error: existingErr } = await supabaseServer
            .from("professional_accounts")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (existingErr && existingErr.code !== "PGRST116") {
            console.error("❌ Erreur recherche compte pro:", existingErr);
            return res
              .status(500)
              .json({ error: "Erreur recherche compte professionnel" });
          }

          // 3) Insert ou Update professional_accounts
          let query;
          if (existing) {
            query = supabaseServer
              .from("professional_accounts")
              .update({
                company_name: companyName,
                company_address: companyAddress || null,
                siret,
                description: description || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)
              .select()
              .single();
          } else {
            query = supabaseServer
              .from("professional_accounts")
              .insert({
                user_id: user.id,
                company_name: companyName,
                company_address: companyAddress || null,
                siret,
                description: description || null,
                verification_status: "not_started",
              })
              .select()
              .single();
          }

          const { data: proAccount, error: upsertErr } = await query;
          if (upsertErr) {
            console.error("❌ Erreur sauvegarde compte pro (draft):", upsertErr);
            return res
              .status(500)
              .json({ error: "Erreur sauvegarde compte professionnel (draft)" });
          }

          console.log("✅ Brouillon professionnel sauvegardé:", proAccount.id);
          return res.json({
            success: true,
            type: "professional_draft",
            professionalAccount: proAccount,
            message: "Brouillon professionnel sauvegardé avec succès",
          });
        } catch (error: any) {
          console.error("❌ Erreur sauvegarde brouillon professionnel:", error);
          return res.status(500).json({
            error: "Erreur lors de la sauvegarde du brouillon professionnel",
          });
        }
      }

      // ======================================
      // CAS 2 : BROUILLON PERSONNEL
      // ======================================
      if (type === "individual") {
        console.log("👤 Sauvegarde brouillon personnel");

        if (!name || !phone) {
          return res.status(400).json({ error: "Nom et téléphone obligatoires" });
        }

        try {
          const { data: personal, error: personalErr } = await supabaseServer
            .from("users")
            .update({
              name,
              phone,
              city: city && city.trim() !== "" ? city : null,
              postal_code:
                postalCode && postalCode.trim() !== "" ? postalCode : null,
              whatsapp: whatsapp || null,
              // ✅ PAS de profile_completed = true ici ! C'est un brouillon
              type: "individual",
              onboarding_status: "in_progress", // ✅ Statut intermédiaire
            })
            .eq("id", user.id)
            .select()
            .single();

          if (personalErr) {
            console.error("❌ Erreur sauvegarde brouillon personnel:", personalErr);
            
            // 📱 Gestion spécifique pour téléphone existant
            if (personalErr.message?.includes("duplicate key") && personalErr.message?.includes("phone")) {
              return res.status(409).json({
                error: "PHONE_ALREADY_EXISTS",
                message: "Ce numéro de téléphone est déjà utilisé par un autre compte.",
              });
            }
            
            return res.status(500).json({
              error: "Erreur sauvegarde brouillon personnel",
            });
          }

          console.log("✅ Brouillon personnel sauvegardé:", personal.id);
          return res.json({
            success: true,
            type: "individual_draft",
            profile: personal,
            message: "Brouillon personnel sauvegardé avec succès",
          });
        } catch (error: any) {
          console.error("❌ Erreur sauvegarde brouillon personnel:", error);
          
          // 📱 Gestion spécifique pour téléphone existant
          if (error.message?.includes("duplicate key") && error.message?.includes("phone")) {
            return res.status(409).json({
              error: "PHONE_ALREADY_EXISTS",
              message: "Ce numéro de téléphone est déjà utilisé par un autre compte.",
            });
          }
          
          return res.status(500).json({
            error: "Erreur lors de la sauvegarde du brouillon personnel",
          });
        }
      }

      // Si aucun cas ne correspond
      return res.status(400).json({
        error: "Type de profil non reconnu ou données manquantes",
      });
    } catch (err) {
      console.error("❌ Erreur API /api/profile/draft:", err);
      return res.status(500).json({ error: "Erreur serveur interne" });
    }
  });

  app.post("/api/profile/complete", async (req, res) => {
    try {
      console.log("🔔 Création/MàJ du compte (perso ou pro)...");
      console.log("📄 Données reçues:", req.body);

      // 1) Authentification
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res
          .status(401)
          .json({ error: "Token d'authentification manquant" });
      }
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error: authError,
      } = await supabaseServer.auth.getUser(token);
      if (authError || !user) {
        console.error("❌ Auth échouée:", authError);
        return res.status(401).json({ error: "Token invalide" });
      }

      // 2) Champs reçus
      const {
        companyName,
        siret,
        companyAddress,
        phone,
        website,
        description,
        name,
        city,
        postalCode,
        whatsapp,
      } = req.body;

      // ======================================
      // CAS 1 : COMPTE PROFESSIONNEL
      // ======================================
      if (companyName && siret) {
        console.log("🏢 Détection compte professionnel");

        // Vérification SIRET
        if (!/^\d{14}$/.test(siret)) {
          return res
            .status(400)
            .json({ error: "SIRET invalide (14 chiffres requis)" });
        }

        // 1) Mettre à jour les infos communes dans users
        const { data: updatedUser, error: userErr } = await supabaseServer
          .from("users")
          .update({
            name, // ✅ forcé par celui saisi par l'utilisateur
            phone: phone || null,
            website: website || null,
            city: city && city.trim() !== "" ? city : null,
            postal_code:
              postalCode && postalCode.trim() !== "" ? postalCode : null,
            whatsapp: whatsapp || null,
            profile_completed: true, // ✅ évite le retour au choix de compte
            type: "professional", // ✅ marque comme pro
          })
          .eq("id", user.id)
          .select()
          .single();

        if (userErr) {
          console.error("❌ Erreur update user (pro):", userErr);
          return res
            .status(500)
            .json({ error: "Erreur mise à jour utilisateur (pro)" });
        }

        // 2) Vérifier si un compte pro existe déjà
        const { data: existing, error: existingErr } = await supabaseServer
          .from("professional_accounts")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (existingErr && existingErr.code !== "PGRST116") {
          console.error("❌ Erreur recherche compte pro:", existingErr);
          return res
            .status(500)
            .json({ error: "Erreur recherche compte professionnel" });
        }

        // 3) Insert ou Update professional_accounts
        let query;
        if (existing) {
          query = supabaseServer
            .from("professional_accounts")
            .update({
              company_name: companyName,
              company_address: companyAddress || null,
              siret, // ✅ reste dans la table pro
              description: description || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();
        } else {
          query = supabaseServer
            .from("professional_accounts")
            .insert({
              user_id: user.id,
              company_name: companyName,
              company_address: companyAddress || null,
              siret, // ✅ stocké uniquement ici
              description: description || null,
              membership: "free",
              verification_status: "not_started",
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
        }

        const { data: proAccount, error: upsertErr } = await query;
        if (upsertErr) {
          console.error("❌ Erreur sauvegarde compte pro:", upsertErr);
          return res
            .status(500)
            .json({ error: "Erreur sauvegarde compte professionnel" });
        }

        console.log("✅ Compte professionnel enregistré:", proAccount.id);
        return res.json({
          success: true,
          type: "professional",
          user: updatedUser, // ✅ infos communes
          professionalAccount: proAccount, // ✅ infos pro
          message: existing ? "Compte pro mis à jour" : "Compte pro créé",
        });
      }

      // ======================================
      // CAS 2 : COMPTE PARTICULIER
      // ======================================
      console.log("👤 Détection compte particulier");

      if (!name || !phone) {
        return res.status(400).json({ error: "Nom et téléphone obligatoires" });
      }

      const { data: personal, error: personalErr } = await supabaseServer
        .from("users")
        .update({
          name, // ✅ forcé par celui saisi par l'utilisateur
          phone,
          city: city && city.trim() !== "" ? city : null,
          postal_code:
            postalCode && postalCode.trim() !== "" ? postalCode : null,
          whatsapp: whatsapp || null,
          profile_completed: true, // ✅ évite le retour au choix de compte
          type: "individual",
        })
        .eq("id", user.id)
        .select()
        .single();

      if (personalErr) {
        console.error(
          "❌ Erreur sauvegarde particulier:",
          personalErr.message,
          personalErr.details,
        );
        return res.status(500).json({
          error: personalErr.message || "Erreur sauvegarde compte personnel",
        });
      }

      console.log("✅ Compte particulier mis à jour:", personal.id);
      return res.json({
        success: true,
        type: "personal",
        profile: personal,
        message: "Compte personnel mis à jour",
      });
    } catch (err) {
      console.error("❌ Erreur API /api/profile/complete:", err);
      return res.status(500).json({ error: "Erreur serveur interne" });
    }
  });

  // Route pour vérifier un compte professionnel existant (upload document KBIS + CIN)
  app.post(
    "/api/professional-accounts/verify",
    upload.fields([
      { name: "kbis_document", maxCount: 1 },
      { name: "cin_document", maxCount: 2 },
    ]),
    async (req, res) => {
      try {
        console.log("🏢 Vérification compte professionnel...");
        console.log("📄 Fichiers reçus:", Object.keys(req.files || {}));

        // 1) Auth Supabase
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res
            .status(401)
            .json({ error: "Token d'authentification manquant" });
        }
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
          error: authError,
        } = await supabaseServer.auth.getUser(token);
        if (authError || !user)
          return res.status(401).json({ error: "Token invalide" });

        // 2) Compte pro existant
        const { data: existingAccount, error: findAccErr } =
          await supabaseServer
            .from("professional_accounts")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (findAccErr || !existingAccount) {
          return res.status(400).json({
            error:
              "Aucun compte professionnel trouvé. Créez d'abord votre compte professionnel.",
          });
        }

        // 3) Récupération des fichiers
        const files = req.files as Record<string, Express.Multer.File[]>;
        const kbis = files?.kbis_document?.[0];
        const cin = files?.cin_document ?? [];

        // Validation stricte sur les fichiers
        if (!kbis) {
          return res.status(400).json({ error: "Le document KBIS est requis" });
        }
        const cinIsPdf =
          cin.length === 1 && cin[0].mimetype === "application/pdf";
        const cinIsImages =
          cin.length === 2 && cin.every((f) => f.mimetype.startsWith("image/"));
        if (!cinIsPdf && !cinIsImages) {
          return res.status(400).json({
            error: "La CIN doit être 1 PDF ou 2 images (recto/verso)",
          });
        }

        // Helper d'upload vers Supabase Storage
        async function uploadToStorage(
          file: Express.Multer.File,
          proId: number,
          kind: string,
        ) {
          const ext = file.originalname.includes(".")
            ? file.originalname.split(".").pop()
            : "bin";
          const fileName = `${kind}-${proId}-${Date.now()}.${ext}`;
          const { data: up, error: upErr } = await supabaseServer.storage
            .from("vehicle-images") // ⚠️ remplace par ton bucket
            .upload(`documents/${fileName}`, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });
          if (upErr) throw upErr;
          return { path: up.path, name: file.originalname, size: file.size };
        }

        // 4) Supprimer anciens docs pour ce compte
        const typesToReplace = [
          "kbis",
          ...(cinIsPdf ? ["id_pdf"] : ["id_front", "id_back"]),
        ];
        const { error: delErr } = await supabaseServer
          .from("verification_documents")
          .delete()
          .eq("professional_account_id", existingAccount.id)
          .in("document_type", typesToReplace);
        if (delErr) {
          console.error("❌ Erreur suppression anciens documents:", delErr);
          return res
            .status(500)
            .json({ error: "Erreur lors du remplacement des documents" });
        }

        // 5) Upload + insert nouveaux documents
        const inserts: any[] = [];

        // KBIS
        try {
          const up = await uploadToStorage(kbis, existingAccount.id, "kbis");
          inserts.push({
            professional_account_id: existingAccount.id,
            document_type: "kbis",
            file_url: up.path,
            file_name: up.name,
            file_size: up.size,
            verification_status: "pending",
          });
        } catch (e) {
          console.error("❌ Upload KBIS:", e);
          return res.status(500).json({ error: "Échec upload KBIS" });
        }

        // CIN
        try {
          if (cinIsPdf) {
            const up = await uploadToStorage(
              cin[0],
              existingAccount.id,
              "cin-pdf",
            );
            inserts.push({
              professional_account_id: existingAccount.id,
              document_type: "id_pdf",
              file_url: up.path,
              file_name: up.name,
              file_size: up.size,
              verification_status: "pending",
            });
          } else {
            const upFront = await uploadToStorage(
              cin[0],
              existingAccount.id,
              "cin-front",
            );
            const upBack = await uploadToStorage(
              cin[1],
              existingAccount.id,
              "cin-back",
            );
            inserts.push(
              {
                professional_account_id: existingAccount.id,
                document_type: "id_front",
                file_url: upFront.path,
                file_name: upFront.name,
                file_size: upFront.size,
                verification_status: "pending",
              },
              {
                professional_account_id: existingAccount.id,
                document_type: "id_back",
                file_url: upBack.path,
                file_name: upBack.name,
                file_size: upBack.size,
                verification_status: "pending",
              },
            );
          }
        } catch (e) {
          console.error("❌ Upload CIN:", e);
          return res.status(500).json({ error: "Échec upload CIN" });
        }

        const { error: insErr } = await supabaseServer
          .from("verification_documents")
          .insert(inserts);
        if (insErr) {
          console.error("❌ Erreur enregistrement documents:", insErr);
          return res
            .status(500)
            .json({ error: "Erreur enregistrement des documents" });
        }

        // 6) Mettre à jour le statut du compte pro
        const { error: statusErr } = await supabaseServer
          .from("professional_accounts")
          .update({
            verification_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAccount.id);
        if (statusErr) {
          console.error("❌ Erreur MAJ statut:", statusErr);
          return res
            .status(500)
            .json({ error: "Erreur mise à jour du statut" });
        }

        return res.json({
          success: true,
          status: "pending",
          professionalAccountId: existingAccount.id,
          message: "Documents reçus. Votre dossier passe en revue.",
        });
      } catch (error) {
        console.error("❌ Erreur vérification compte professionnel:", error);
        return res
          .status(500)
          .json({ error: "Erreur serveur lors de la vérification" });
      }
    },
  );

  // Route pour récupérer les comptes professionnels en attente (admin)
  app.get("/api/admin/professional-accounts", async (req, res) => {
    try {
      console.log("🏢 Récupération comptes professionnels pour admin...");

      const { data: proAccounts, error } = await supabaseServer
        .from("professional_accounts")
        .select(
          `
          id,
          company_name,
          siret,
          company_address,
          phone,
          email,
          website,
          is_verified,
          verification_status,
          verified_at,
          rejected_reason,
          created_at,
          updated_at,
          users:user_id (
            id,
            name,
            email
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur récupération comptes pro:", error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      console.log(
        `✅ ${proAccounts?.length || 0} comptes professionnels récupérés`,
      );
      res.json(proAccounts || []);
    } catch (error) {
      console.error("❌ Erreur récupération comptes pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour récupérer les documents de vérification d'un compte pro (admin)
  app.get(
    "/api/admin/professional-accounts/:id/documents",
    async (req, res) => {
      try {
        const { id } = req.params;
        console.log(`📄 Récupération documents pour compte pro ${id}...`);

        const { data: documents, error } = await supabaseServer
          .from("verification_documents")
          .select("*")
          .eq("professional_account_id", id)
          .order("upload_date", { ascending: false });

        if (error) {
          console.error("❌ Erreur récupération documents:", error);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        console.log(`✅ ${documents?.length || 0} documents récupérés`);
        res.json(documents || []);
      } catch (error) {
        console.error("❌ Erreur récupération documents:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    },
  );

  // Route pour approuver/rejeter un compte professionnel (admin)
  app.patch("/api/admin/professional-accounts/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // action: 'approve' | 'reject', reason: string pour rejection

      console.log(`🔍 Vérification compte pro ${id}: ${action}`);

      if (action === "approve") {
        const { data: updatedAccount, error } = await supabaseServer
          .from("professional_accounts")
          .update({
            verification_status: "approved",
            is_verified: true,
            verified_at: new Date().toISOString(),
            rejected_reason: null,
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("❌ Erreur approbation:", error);
          return res
            .status(500)
            .json({ error: "Erreur lors de l'approbation" });
        }

        // Mettre à jour le type d'utilisateur à 'professional'
        const userUpdateResponse = await supabaseServer
          .from("users")
          .update({ type: "professional" })
          .eq("id", updatedAccount.user_id);

        if (userUpdateResponse.error) {
          console.error(
            "❌ Erreur mise à jour type utilisateur:",
            userUpdateResponse.error,
          );
        } else {
          console.log(
            "✅ Type utilisateur mis à jour vers professional pour user:",
            updatedAccount.user_id,
          );
        }

        // Mettre à jour le statut des documents
        await supabaseServer
          .from("verification_documents")
          .update({ verification_status: "completed" })
          .eq("professional_account_id", id);

        console.log("✅ Compte professionnel approuvé");
        res.json({
          success: true,
          account: updatedAccount,
          message: "Compte professionnel approuvé",
        });
      } else if (action === "reject") {
        if (!reason) {
          return res.status(400).json({ error: "Raison du rejet requise" });
        }

        const { data: updatedAccount, error } = await supabaseServer
          .from("professional_accounts")
          .update({
            verification_status: "not_verified",
            is_verified: false,
            rejected_reason: reason,
            verified_at: null,
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("❌ Erreur rejet:", error);
          return res.status(500).json({ error: "Erreur lors du rejet" });
        }

        // Mettre à jour le statut des documents
        await supabaseServer
          .from("verification_documents")
          .update({ verification_status: "not_started" })
          .eq("professional_account_id", id);

        console.log("✅ Compte professionnel rejeté");
        res.json({
          success: true,
          account: updatedAccount,
          message: "Compte professionnel rejeté",
        });
      } else {
        return res.status(400).json({ error: "Action invalide" });
      }
    } catch (error) {
      console.error("❌ Erreur vérification compte pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour obtenir l'URL signée d'un document (admin)
  app.get("/api/admin/documents/:path/signed-url", async (req, res) => {
    try {
      const { path } = req.params;
      console.log(`🔗 Génération URL signée pour: ${path}`);

      const { data, error } = await supabaseServer.storage
        .from("vehicle-images")
        .createSignedUrl(path, 3600); // 1 heure d'expiration

      if (error) {
        console.error("❌ Erreur génération URL signée:", error);
        return res.status(500).json({ error: "Erreur génération URL" });
      }

      console.log("✅ URL signée générée");
      res.json({ signedUrl: data.signedUrl });
    } catch (error) {
      console.error("❌ Erreur URL signée:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Routes admin spécialisées (à placer avant les routes génériques)

  // Route pour récupérer les annonces supprimées (admin)
  app.get("/api/admin/deleted-annonces", async (req, res) => {
    try {
      console.log("🗑️ Récupération annonces supprimées...");

      const { data: deletedAnnonces, error } = await supabaseServer
        .from("annonces")
        .select(
          `
          id, 
          title, 
          price, 
          created_at, 
          deleted_at, 
          deletion_reason, 
          deletion_comment,
          users:user_id (
            id,
            name,
            email
          )
        `,
        )
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur récupération annonces supprimées:", error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      console.log(
        `✅ ${deletedAnnonces?.length || 0} annonces supprimées récupérées`,
      );
      res.json(deletedAnnonces || []);
    } catch (error) {
      console.error("❌ Erreur récupération annonces supprimées:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour les statistiques de performance admin
  app.get("/api/admin/performance-stats", async (req, res) => {
    console.log("📈 Route performance-stats appelée");
    try {
      console.log("📈 Récupération statistiques de performance admin...");

      // Récupérer toutes les annonces supprimées avec leurs raisons
      const { data: deletedAnnonces, error } = await supabaseServer
        .from("annonces")
        .select(
          "id, title, created_at, deleted_at, deletion_reason, deletion_comment",
        )
        .not("deleted_at", "is", null);

      if (error) {
        console.error("❌ Erreur récupération annonces supprimées:", error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      const total = deletedAnnonces?.length || 0;

      // Compter les raisons de suppression
      const soldOnSite =
        deletedAnnonces?.filter((a) => a.deletion_reason === "sold_on_site")
          .length || 0;
      const soldElsewhere =
        deletedAnnonces?.filter((a) => a.deletion_reason === "sold_elsewhere")
          .length || 0;
      const noLongerSelling =
        deletedAnnonces?.filter(
          (a) => a.deletion_reason === "no_longer_selling",
        ).length || 0;
      const other =
        deletedAnnonces?.filter((a) => a.deletion_reason === "other").length ||
        0;

      // Calculer les pourcentages
      const soldOnSitePercent =
        total > 0 ? Math.round((soldOnSite / total) * 100) : 0;
      const soldElsewherePercent =
        total > 0 ? Math.round((soldElsewhere / total) * 100) : 0;
      const noLongerSellingPercent =
        total > 0 ? Math.round((noLongerSelling / total) * 100) : 0;
      const otherPercent = total > 0 ? Math.round((other / total) * 100) : 0;

      // Calculer la durée moyenne avant suppression
      let averageDays = 0;
      if (deletedAnnonces && deletedAnnonces.length > 0) {
        const totalDays = deletedAnnonces.reduce((sum, annonce) => {
          if (annonce.created_at && annonce.deleted_at) {
            const created = new Date(annonce.created_at);
            const deleted = new Date(annonce.deleted_at);
            const diffDays = Math.floor(
              (deleted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
            );
            return sum + Math.max(0, diffDays);
          }
          return sum;
        }, 0);
        averageDays = Math.round(totalDays / deletedAnnonces.length);
      }

      const stats = {
        soldOnSite,
        soldOnSitePercent,
        soldElsewhere,
        soldElsewherePercent,
        noLongerSelling,
        noLongerSellingPercent,
        other,
        otherPercent,
        totalDeleted: total,
        averageDays,
      };

      console.log("✨ Statistiques performance générées:", stats);
      res.json(stats);
    } catch (error) {
      console.error("❌ Erreur génération statistiques performance:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour supprimer une annonce (admin) - avec deleted_at et reason - AVEC authentification
  app.patch("/api/admin/annonces/:id/deactivate", async (req, res) => {
    const { id } = req.params;

    // Vérification authentification admin simple
    const adminEmail =
      req.headers["x-user-email"] || req.headers["authorization"];
    if (
      !adminEmail ||
      (!adminEmail.includes("admin@passionauto2roues.com") &&
        !adminEmail.includes("admin"))
    ) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    try {
      console.log(`🔴 Suppression annonce ${id} par admin...`);

      const { error } = await supabaseServer
        .from("annonces")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deletion_reason: "admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("❌ Erreur suppression annonce:", error);
        return res.status(500).json({ error: "Erreur lors de la suppression" });
      }

      console.log(`✅ Annonce ${id} supprimée par admin avec succès`);
      res.json({ success: true, message: "Annonce supprimée avec succès" });
    } catch (error) {
      console.error("❌ Erreur désactivation annonce:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Mount new route handlers
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/saved-searches", savedSearchRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", messagingRoutes);
  app.use("/api/messages-simple", messagingSimpleRoutes);
  app.use("/api/conversations", conversationsRoutes);
  app.use("/api/favorites", favoritesRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/images", imagesRoutes);
  app.use("/api/avatar", avatarRoutes);
  app.use("/api/auth", authSyncRoutes);
  app.use("/api/professional-accounts", professionalShopRouter);
  app.use("/api/subscriptions", subscriptionsRouter);

  // Routes pour la personnalisation des comptes professionnels

  // Upload d'images pour la personnalisation (logo, bannière)
  app.post(
    "/api/professional-accounts/upload-image",
    upload.single("image"),
    async (req, res) => {
      try {
        const userId = req.headers["x-user-id"] as string;
        const file = req.file;
        const type = req.body.type; // 'logo' ou 'banner'

        if (!userId) {
          return res.status(401).json({ error: "Non authentifié" });
        }

        if (!file) {
          return res.status(400).json({ error: "Aucune image fournie" });
        }

        if (!type || (type !== "logo" && type !== "banner")) {
          return res.status(400).json({ error: "Type d'image invalide" });
        }

        console.log(`📸 Upload ${type} pour compte pro ${userId}`);

        // Générer un nom unique pour l'image
        const imageId = uuidv4();
        const fileName = `${type}-${imageId}.webp`;
        const filePath = `professional/${userId}/${fileName}`;

        // Optimiser l'image
        const image = sharp(file.buffer);
        const metadata = await image.metadata();

        // Dimensions selon le type
        const maxWidth = type === "logo" ? 300 : 1200;
        const maxHeight = type === "logo" ? 300 : 400;

        let processedImage = image;
        if (
          metadata.width &&
          metadata.height &&
          (metadata.width > maxWidth || metadata.height > maxHeight)
        ) {
          processedImage = processedImage.resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        // Convertir en WebP
        const processedBuffer = await processedImage
          .webp({ quality: 85 })
          .toBuffer();

        // Upload vers Supabase Storage
        const { data, error } = await supabaseServer.storage
          .from("vehicle-images")
          .upload(filePath, processedBuffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (error) {
          console.error(`❌ Erreur upload ${type}:`, error);
          return res.status(500).json({ error: `Erreur upload ${type}` });
        }

        // Générer l'URL publique
        const {
          data: { publicUrl },
        } = supabaseServer.storage
          .from("vehicle-images")
          .getPublicUrl(filePath);

        console.log(`✅ ${type} uploadé: ${fileName}`);
        res.json({ imageUrl: publicUrl });
      } catch (error) {
        console.error(`❌ Erreur upload image:`, error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    },
  );

  // Récupérer la personnalisation d'un compte professionnel
  app.get(
    "/api/professional-accounts/customization/:userId",
    async (req, res) => {
      try {
        const { userId } = req.params;

        const { data: customization, error } = await supabaseServer
          .from("professional_accounts")
          .select(
            "avatar, banner_image, brand_colors, description, specialties, certifications",
          )
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("❌ Erreur récupération personnalisation:", error);
          return res
            .status(404)
            .json({ error: "Compte professionnel non trouvé" });
        }

        res.json(customization || {});
      } catch (error) {
        console.error("❌ Erreur récupération personnalisation:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    },
  );

  // Mettre à jour la personnalisation d'un compte professionnel
  app.put("/api/professional-accounts/customization", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const customizationData = req.body;

      const { data, error } = await supabaseServer
        .from("professional_accounts")
        .update({
          avatar: customizationData.avatar,
          banner_image: customizationData.banner_image,
          brand_colors: customizationData.brand_colors,
          description: customizationData.description,
          specialties: customizationData.specialties,
          certifications: customizationData.certifications,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur sauvegarde personnalisation:", error);
        return res.status(500).json({ error: "Erreur sauvegarde" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("❌ Erreur sauvegarde personnalisation:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour compter les comptes professionnels en attente (admin)
  app.get(
    "/api/admin/professional-accounts/pending-count",
    async (req, res) => {
      try {
        console.log("🔢 Comptage des comptes professionnels en attente...");

        const { count, error } = await supabaseServer
          .from("professional_accounts")
          .select("*", { count: "exact", head: true })
          .eq("verification_status", "pending");

        if (error) {
          console.error("❌ Erreur comptage comptes en attente:", error);
          return res.status(500).json({ error: "Erreur comptage" });
        }

        console.log(`✅ Comptes en attente trouvés: ${count}`);
        res.json({ pendingCount: count || 0 });
      } catch (error) {
        console.error("❌ Erreur comptage comptes professionnels:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    },
  );

  // Route pour récupérer les informations d'abonnement d'un utilisateur
  /*
  app.get("/api/subscriptions/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`💳 Vérification abonnement pour user ${userId}...`);

      // Récup �rer l'abonnement actif depuis la base de données
      const { data: subscription, error } = await supabaseServer
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur récupération abonnement:", error);
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération de l'abonnement" });
      }

      const subscriptionInfo = {
        isActive: !!subscription,
        planName: subscription?.plan_id || null,
        planType: subscription?.plan_id || "free",
        expiresAt: subscription?.current_period_end || null,
        status: subscription?.status || "inactive",
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      };

      console.log("💳 Abonnement récupéré:", subscriptionInfo);
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("❌ Erreur récupération abonnement:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  */
  app.get("/api/subscriptions/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`💳 Vérification abonnement pour user ${userId}...`);

      const { data: subscription, error } = await supabaseServer
        .from("subscriptions")
        .select(
          `
          id,
          status,
          plan_id,
          cancel_at_period_end,
          current_period_end,
          subscription_plans (
            name,
            max_listings
          )
        `,
        )
        .eq("user_id", userId)
        .in("status", ["active", "trialing"]) // ajoute "past_due" si période de grâce
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur récupération abonnement:", error);
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération de l'abonnement" });
      }

      const planRel = (subscription as any)?.subscription_plans;
      const plan = Array.isArray(planRel) ? planRel[0] : planRel;

      const subscriptionInfo = {
        isActive: !!subscription,
        status: subscription?.status ?? "inactive",
        planId: subscription?.plan_id ?? null,
        planName: plan?.name ?? "Free",
        maxListings: (plan?.max_listings ?? null) as number | null, // null = illimité
        expiresAt: subscription?.current_period_end ?? null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      };

      console.log("💳 Abonnement récupéré:", subscriptionInfo);
      res.setHeader("Cache-Control", "no-store");
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("❌ Erreur récupération abonnement:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour récupérer un compte professionnel par ID (plus spécifique d'abord)
  app.get("/api/professional-accounts/:id", async (req, res) => {
    console.log(`🔥 ROUTE APPELÉE - professional-accounts/${req.params.id}`);
    try {
      const accountId = parseInt(req.params.id);
      console.log(`🔥 ID parsé: ${accountId}`);
      if (isNaN(accountId)) {
        console.log("❌ ID invalide");
        return res.status(400).json({ error: "ID invalide" });
      }

      console.log(`🏢 Recherche compte professionnel avec ID ${accountId}...`);

      const { data: account, error } = await supabaseServer
        .from("professional_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (error) {
        console.error("❌ Erreur Supabase:", error);
        return res
          .status(404)
          .json({ error: "Compte professionnel non trouvé" });
      }

      if (!account) {
        console.error("❌ Aucun compte trouvé avec cet ID");
        return res
          .status(404)
          .json({ error: "Compte professionnel non trouvé" });
      }

      console.log("✅ Compte professionnel récupéré:", account.company_name);
      res.json(account);
    } catch (error) {
      console.error("❌ Erreur récupération compte professionnel:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour récupérer un compte professionnel par user ID
  app.get("/api/professional-accounts/by-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`🏢 Recherche compte professionnel pour user ${userId}...`);

      const { data: account, error } = await supabaseServer
        .from("professional_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !account) {
        console.error("❌ Compte professionnel non trouvé:", error);
        return res
          .status(404)
          .json({ error: "Compte professionnel non trouvé" });
      }

      console.log("✅ Compte professionnel trouvé:", account.id);
      res.json(account);
    } catch (error) {
      console.error("❌ Erreur récupération compte professionnel:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour mettre à jour les informations d'un compte professionnel
  app.put("/api/professional-accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      console.log(`🏢 Mise à jour compte professionnel ${accountId}...`);

      if (isNaN(accountId)) {
        return res.status(400).json({ error: "ID invalide" });
      }

      const {
        company_name,
        siret,
        company_address,
        phone,
        email,
        website,
        description,
        specialties,
        certifications,
        avatar,
        banner_image,
        brand_colors,
      } = req.body;

      // Validation du nom d'entreprise obligatoire
      if (!company_name?.trim()) {
        return res
          .status(400)
          .json({ error: "Le nom de l'entreprise est obligatoire" });
      }

      // Mettre à jour le compte professionnel
      const { data: updatedAccount, error } = await supabaseServer
        .from("professional_accounts")
        .update({
          company_name: company_name?.trim(),
          siret: siret?.trim() || null,
          company_address: company_address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          website: website?.trim() || null,
          description: description?.trim() || null,
          specialties: specialties || [],
          certifications: certifications || [],
          avatar: avatar?.trim() || null,
          banner_image: banner_image?.trim() || null,
          brand_colors: brand_colors || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur mise à jour compte professionnel:", error);
        return res.status(500).json({ error: "Erreur lors de la mise à jour" });
      }

      if (!updatedAccount) {
        return res
          .status(404)
          .json({ error: "Compte professionnel non trouvé" });
      }

      console.log(
        "✅ Compte professionnel mis à jour:",
        updatedAccount.company_name,
      );
      res.json(updatedAccount);
    } catch (error) {
      console.error("❌ Erreur mise à jour compte professionnel:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour vérifier le statut de vérification d'un utilisateur professionnel
  app.get("/api/professional-accounts/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(
        `📊 Vérification statut professionnel pour user ${userId}...`,
      );

      const { data: proAccount, error } = await supabaseServer
        .from("professional_accounts")
        .select(
          "id, verification_status, is_verified, rejected_reason, created_at",
        )
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("❌ Erreur vérification statut:", error);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (!proAccount) {
        // Aucun compte professionnel trouvé
        console.log(
          "ℹ️ Aucun compte professionnel trouvé pour cet utilisateur",
        );
        return res
          .status(404)
          .json({ error: "Aucun compte professionnel trouvé" });
      }

      console.log(
        `✅ Statut professionnel récupéré: ${proAccount.verification_status}`,
      );
      res.setHeader("Cache-Control", "no-store");
      res.json(proAccount);
    } catch (error) {
      console.error("❌ Erreur vérification statut professionnel:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour récupérer TOUS les utilisateurs (y compris non-vérifiés) pour l'admin
  app.get("/api/admin/all-users", async (req, res) => {
    try {
      console.log(
        "👥 Récupération de TOUS les utilisateurs depuis auth.users...",
      );

      // Récupérer d'abord tous les utilisateurs auth
      const { data: authUsers, error: authError } =
        await supabaseServer.auth.admin.listUsers();

      if (authError) {
        console.error("❌ Erreur récupération auth users:", authError);
        return res.status(500).json({ error: "Erreur auth" });
      }

      // Récupérer aussi les profils utilisateurs publics
      const { data: publicUsers, error: publicError } = await supabaseServer
        .from("users")
        .select("*");

      if (publicError) {
        console.error("❌ Erreur récupération users publics:", publicError);
        // Continuer même si erreur sur les profils publics
      }

      // Récupérer tous les comptes professionnels pour déterminer qui est pro
      const { data: professionalAccounts, error: proError } =
        await supabaseServer
          .from("professional_accounts")
          .select("user_id, company_name, verification_status");

      if (proError) {
        console.error("❌ Erreur récupération comptes pro:", proError);
      }

      // OPTION A : Statut basé uniquement sur email_confirmed_at de Supabase Auth
      const allUsers = authUsers.users.map((authUser) => {
        const publicProfile = publicUsers?.find((pu) => pu.id === authUser.id);
        const professionalAccount = professionalAccounts?.find(
          (pa) => pa.user_id === authUser.id,
        );

        // Logique simplifiée :
        // - OAuth Gmail = email automatiquement confirmé = actif immédiatement
        // - Inscription email = email non confirmé = inactif jusqu'à validation admin
        const isEmailConfirmed = authUser.email_confirmed_at != null; // != null vérifie null ET undefined

        // Déterminer le type de compte : si l'utilisateur a un professional_account, il est pro
        const accountType = professionalAccount
          ? "professional"
          : publicProfile?.account_type || "individual";

        return {
          id: authUser.id,
          name:
            publicProfile?.name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Utilisateur",
          email: authUser.email,
          account_type: accountType,
          verified: isEmailConfirmed, // Statut = email confirmé dans Supabase
          email_verified: isEmailConfirmed,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          phone: authUser.phone,
          // Informations professionnelles si disponibles
          company_name: professionalAccount?.company_name,
          professional_status: professionalAccount?.verification_status,
          // Debug info
          auth_confirmed_at: authUser.email_confirmed_at,
          provider: authUser.app_metadata?.provider, // gmail, email, etc.
        };
      });

      console.log(`✅ ${allUsers.length} utilisateurs auth récupérés`);
      console.log(
        "📧 Emails trouv  ��s:",
        allUsers.map((u) => u.email),
      );
      console.log(
        "🏢 Comptes professionnels trouvés:",
        professionalAccounts?.length || 0,
      );
      console.log(
        "👥 Types de comptes:",
        allUsers.map((u) => `${u.email}: ${u.account_type}`),
      );

      res.json(allUsers);
    } catch (error) {
      console.error("❌ Erreur admin users:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour activer/vérifier manuellement un utilisateur (admin)
  app.patch("/api/admin/users/:userId/verify", async (req, res) => {
    try {
      const { userId } = req.params;
      const { action } = req.body; // 'verify_email' | 'activate' | 'suspend'

      console.log(`🔐 Admin action ${action} pour user ${userId}...`);

      // Mettre à jour le statut auth dans Supabase Auth
      if (action === "verify_email" || action === "activate") {
        console.log("📧 Confirmation de l'email dans Supabase Auth...");

        // Récupérer d'abord l'utilisateur
        const { data: userData, error: getUserError } =
          await supabaseServer.auth.admin.getUserById(userId);
        if (getUserError) {
          console.error("❌ Erreur récupération user:", getUserError);
          return res.status(500).json({ error: "Utilisateur non trouvé" });
        }

        console.log("👤 User avant confirmation:", {
          email: userData.user.email,
          email_confirmed_at: userData.user.email_confirmed_at,
        });

        const { data: authData, error: authError } =
          await supabaseServer.auth.admin.updateUserById(userId, {
            email_confirm: true,
          });

        if (authError) {
          console.error("❌ Erreur confirmation email auth:", authError);
          return res
            .status(500)
            .json({ error: `Erreur confirmation: ${authError.message}` });
        } else {
          console.log("✅ Email confirmé dans Supabase Auth:", {
            email: authData.user.email,
            email_confirmed_at: authData.user.email_confirmed_at,
          });
        }
      }

      // Mettre à jour le profil utilisateur public (s'il existe)
      let updateData: any = {};

      switch (action) {
        case "verify_email":
          updateData = {
            email_verified: true,
            verified: true,
          };
          break;
        case "activate":
          updateData = {
            verified: true,
            email_verified: true,
          };
          break;
        case "suspend":
          // Pour suspendre, on révoque la confirmation email dans Supabase Auth
          const { error: suspendError } =
            await supabaseServer.auth.admin.updateUserById(userId, {
              email_confirm: false,
            });

          if (suspendError) {
            console.error("❌ Erreur suspension auth:", suspendError);
            return res
              .status(500)
              .json({ error: `Erreur suspension: ${suspendError.message}` });
          }

          updateData = {
            verified: false,
            email_verified: false,
          };
          break;
        default:
          return res.status(400).json({ error: "Action invalide" });
      }

      // Vérifier si l'utilisateur existe dans la table publique
      const { data: existingUser } = await supabaseServer
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingUser) {
        // Mettre à jour l'utilisateur existant
        const { error: updateError } = await supabaseServer
          .from("users")
          .update(updateData)
          .eq("id", userId);

        if (updateError) {
          console.error(
            "❌ Erreur mise à jour utilisateur public:",
            updateError,
          );
        } else {
          console.log("✅ Profil utilisateur public mis à jour");
        }
      } else {
        console.log(
          "⚠️ Utilisateur n'existe pas encore dans la table publique",
        );
      }

      console.log(`✅ Utilisateur ${userId} ${action} avec succès`);
      res.json({
        success: true,
        message: `Utilisateur ${action === "verify_email" ? "vérifié" : action === "activate" ? "activé" : "suspendu"} avec succès`,
      });
    } catch (error) {
      console.error("❌ Erreur vérification utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ==========================================
  // BOOST APIs
  // ==========================================

  // Get all boost plans
  app.get("/api/boost/plans", async (req, res) => {
    try {
      const plans = await storage.getAllBoostPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching boost plans:", error);
      res.status(500).json({ error: "Failed to fetch boost plans" });
    }
  });

  // Create Stripe checkout session for boost
  app.post("/api/boost/checkout", async (req, res) => {
    try {
      const { annonceId, planId } = req.body;

      if (!annonceId || !planId) {
        return res
          .status(400)
          .json({ error: "annonceId and planId are required" });
      }

      // Vérifier que l'annonce existe
      const annonce = await storage.getVehicle(annonceId.toString());
      if (!annonce) {
        return res.status(404).json({ error: "Annonce not found" });
      }

      // Vérifier qu'il n'y a pas déjà un boost actif (optionnel - on permet l'empilement)
      const isAlreadyBoosted = await storage.checkBoostAlreadyActive(
        parseInt(annonceId),
      );
      if (isAlreadyBoosted) {
        console.log(
          `ℹ️ Annonce ${annonceId} déjà boostée, on va empiler le nouveau boost`,
        );
      }

      // Récupérer le plan boost
      const plan = await storage.getBoostPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({ error: "Boost plan not found" });
      }

      // 🔐 SÉCURITÉ: Récupérer l'email du propriétaire de l'annonce pour pré-remplir Stripe
      const { data: annonceOwner, error: userError } = await supabaseServer
        .from("users")
        .select("email")
        .eq("id", annonce.userId)
        .single();

      if (userError || !annonceOwner?.email) {
        console.error("❌ Erreur récupération email propriétaire:", userError);
        return res.status(400).json({ error: "Email utilisateur introuvable" });
      }

      // Créer le log d'achat (en attente de confirmation Stripe)
      const logData = {
        annonceId: parseInt(annonceId),
        planId: parseInt(planId),
        stripeSessionId: "", // Sera rempli après création de la session
        action: "purchased",
        amount: plan.priceCents,
        userId: annonce.userId, // ID du propriétaire de l'annonce
      };

      // Créer la session Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const baseUrl = process.env.FRONTEND_URL || "https://" + req.get("host");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        // 🔐 SÉCURITÉ: Pré-remplir l'email pour éviter les fraudes
        customer_email: annonceOwner.email,
        success_url: `${baseUrl}/success-boost?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard?boost_canceled=true`,
        metadata: {
          type: "boost",
          annonceId: annonceId.toString(),
          planId: planId.toString(),
          userId: annonce.userId,
        },
      });

      // Créer le log avec l'ID de session
      await storage.createBoostLog({
        ...logData,
        stripeSessionId: session.id,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating boost checkout:", error);
      res.status(500).json({ error: "Failed to create boost checkout" });
    }
  });

  // Webhook Stripe avec logique boost et abonnement
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).send("Webhook configuration error");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error("⚠️ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log("🎯 Stripe webhook reçu:", event.type);

      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          console.log("✅ Paiement confirmé pour session:", session.id);
          console.log("📊 Metadata:", session.metadata);

          if (session.metadata?.type === "boost") {
            // Activer le boost avec le nouveau système
            console.log("🚀 Activation boost pour session:", session.id);
            const success = await storage.activateBoostWithLog(session.id);
            if (success) {
              console.log(
                "✅ Boost activé avec succès - boosted_until mis à jour",
              );
            } else {
              console.error("❌ Erreur activation boost");
            }
          } else if (session.metadata?.type === "subscription") {
            // Logique abonnement existante (si nécessaire)
            console.log("📋 Traitement abonnement pour session:", session.id);
          }
          break;

        case "invoice.payment_succeeded":
          console.log("💰 Paiement facture réussi");
          // Logique pour les abonnements récurrents si nécessaire
          break;

        case "customer.subscription.deleted":
          console.log("❌ Abonnement supprimé");
          // Logique pour désactiver les abonnements si nécessaire
          break;

        default:
          console.log(`🔔 Événement non géré: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("❌ Erreur webhook Stripe:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // API Historique des achats utilisateur
  app.get("/api/purchase-history/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: purchaseHistory, error } =
        await storage.getUserPurchaseHistory(userId);

      if (error) {
        console.error("Error fetching user purchase history:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch purchase history" });
      }

      res.json(purchaseHistory || []);
    } catch (error) {
      console.error("Error in user purchase history endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API Historique global des achats pour admin
  app.get("/api/admin/purchase-history", async (req, res) => {
    try {
      const { data: allPurchaseHistory, error } =
        await storage.getAllPurchaseHistory();

      if (error) {
        console.error("Error fetching admin purchase history:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch purchase history" });
      }

      res.json(allPurchaseHistory || []);
    } catch (error) {
      console.error("Error in admin purchase history endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API pour vérifier le statut boost d'une annonce
  app.get("/api/boost/status/:annonceId", async (req, res) => {
    try {
      const { annonceId } = req.params;

      const boostStatus = await storage.getBoostStatus(parseInt(annonceId));

      res.json(boostStatus);
    } catch (error) {
      console.error("Error checking boost status:", error);
      res.status(500).json({ error: "Failed to check boost status" });
    }
  });

  // API pour confirmer le succès d’un paiement Boost
  app.get("/api/boost/success", async (req, res) => {
    try {
      const { session_id } = req.query;
      if (!session_id) {
        return res.status(400).json({ error: "session_id is required" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(
        session_id as string,
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (
        session.payment_status === "paid" &&
        session.metadata?.type === "boost"
      ) {
        // Optionnel : activer le boost ici si jamais le webhook n'a pas encore tourné
        await storage.activateBoostWithLog(session.id);
        return res.json({ success: true, message: "Boost activé" });
      }

      res.json({ success: false, message: "Paiement non confirmé" });
    } catch (error) {
      console.error("Error in /api/boost/success:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Setup wishlist migration routes
  setupWishlistMigration(app);
  setupWishlistDirect(app);

  const httpServer = createServer(app);
  return httpServer;
}
