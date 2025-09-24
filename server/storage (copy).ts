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

// =================================================================
// SECTION: CONFIGURATION & MIDDLEWARES
// =================================================================

// Configuration multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // =================================================================
  // SECTION: AUTHENTIFICATION & UTILISATEURS (Users & Auth)
  // =================================================================

  // --- Users API ---
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
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/by-email/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by email:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/emails", async (req, res) => {
    // Test endpoint
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

  // --- Auth Sync ---
  app.post("/api/users/sync-auth", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Authorization header required" });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const syncedUser = await createUserFromAuth(user.id, user.email || "", user.user_metadata);
      res.status(200).json({ message: "User synchronized successfully", user: syncedUser });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.post("/api/users/sync-from-signup", async (req, res) => {
    try {
      const { authUserId, email, metadata } = req.body;
      if (!authUserId || !email) {
        return res.status(400).json({ error: "authUserId et email requis" });
      }
      console.log("🔄 Sync immédiate demandée pour:", email, "(ID:", authUserId, ")");
      const existingUser = await storage.getUser(authUserId);
      if (existingUser) {
        console.log("✅ Utilisateur existant trouvé:", existingUser.name);
        return res.json({ user: existingUser, created: false });
      }
      const userData = {
        id: authUserId,
        email: email,
        name: metadata?.name || extractNameFromEmail(email),
        type: metadata?.type || "pending",
        phone: metadata?.phone || null,
        whatsapp: metadata?.phone || null,
        companyName: metadata?.companyName || null,
        city: null,
        postal_code: null,
        email_verified: false,
      };
      const newUser = await storage.createUser(userData);
      console.log("✅ Utilisateur synchronisé immédiatement:", newUser.name, `(${newUser.type})`);
      res.json({ user: newUser, created: true });
    } catch (error) {
      console.error("❌ Erreur sync immédiate:", error);
      res.status(500).json({ error: "Erreur de synchronisation" });
    }
  });

  // Helper function
  function extractNameFromEmail(email: string): string {
    const localPart = email.split("@")[0];
    return localPart.replace(/[._]/g, " ").split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ") || "Utilisateur";
  }

  app.post("/api/users/manual-sync", async (req, res) => {
    // DEVELOPMENT ONLY
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      const { data: authUsers, error: listError } = await supabaseServer.auth.admin.listUsers();
      if (listError) {
        return res.status(500).json({ error: "Failed to list auth users" });
      }
      const authUser = authUsers.users.find((u) => u.email === email);
      if (!authUser) {
        return res.status(404).json({ error: "User not found in Supabase Auth" });
      }
      const syncedUser = await createUserFromAuth(authUser.id, authUser.email || "", authUser.user_metadata);
      res.status(200).json({ message: "User manually synchronized successfully", user: syncedUser });
    } catch (error) {
      console.error("Error manually syncing user:", error);
      res.status(500).json({ error: "Failed to manually sync user" });
    }
  });

  // --- Profile Completion ---
  app.post("/api/profile/complete", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // =================================================================
  // SECTION: ANNONCES (Vehicles)
  // =================================================================

  // --- Public Vehicle API ---
  app.get("/api/vehicles", async (req, res) => {
    try {
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

  // --- User-specific Vehicle Management ---
  app.get("/api/vehicles/user/:userId", async (req, res) => {
    try {
      const userVehicles = await storage.getVehiclesByUser(req.params.userId);
      res.json(userVehicles);
    } catch (error) {
      console.error("Error fetching user vehicles:", error);
      res.status(500).json({ error: "Failed to fetch user vehicles" });
    }
  });

  app.get("/api/vehicles/user/:userId/deleted", async (req, res) => {
    try {
      const deletedVehicles = await storage.getDeletedVehiclesByUser(req.params.userId);
      res.json(deletedVehicles);
    } catch (error) {
      console.error("Error fetching deleted user vehicles:", error);
      res.status(500).json({ error: "Failed to fetch deleted user vehicles" });
    }
  });

  app.get("/api/users/:id/quota/check", async (req, res) => {
    try {
      const userId = req.params.id;
      const quotaInfo = await storage.checkListingQuota(userId);
      res.json({
        canCreate: quotaInfo.canCreate,
        remaining: quotaInfo.maxListings ? Math.max(0, quotaInfo.maxListings - quotaInfo.activeListings) : null,
        used: quotaInfo.activeListings,
        maxListings: quotaInfo.maxListings,
        message: quotaInfo.message
      });
    } catch (error) {
      console.error("Error checking user quota:", error);
      res.json({ canCreate: true, remaining: null, used: 0, maxListings: null, message: "Erreur lors de la vérification, autorisation par défaut" });
    }
  });

  app.get("/api/users/:userId/quota", async (req, res) => {
    try {
      const { userId } = req.params;
      const quotaInfo = await storage.checkListingQuota(userId);
      res.json(quotaInfo);
    } catch (error) {
      console.error("❌ Erreur récupération quota:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du quota" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/annonces/:id/toggle-active", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.post("/api/vehicles/:id/delete-with-reason", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    // ... (contenu de la route inchangé)
  });


  // =================================================================
  // SECTION: COMPTES PROFESSIONNELS (Professional Accounts)
  // =================================================================

  // --- Public & User-facing Professional Account API ---
  app.get("/api/professional-account/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/professional-accounts/by-user/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/professional-accounts/:id", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.put("/api/professional-accounts/:id", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/professional-accounts/status/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.post("/api/professional-accounts/verify", upload.fields([{ name: "kbis_document", maxCount: 1 }, { name: "cin_document", maxCount: 2 }]), async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Professional Account Customization ---
  app.post("/api/professional-accounts/upload-image", upload.single("image"), async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/professional-accounts/customization/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.put("/api/professional-accounts/customization", async (req, res) => {
    // ... (contenu de la route inchangé)
  });


  // =================================================================
  // SECTION: MESSAGERIE (Messaging)
  // =================================================================
  app.get("/api/vehicles/:vehicleId/messages", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/users/:userId/messages", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.post("/api/messages", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    // ... (contenu de la route inchangé)
  });


  // =================================================================
  // SECTION: PAIEMENTS (Boosts, Subscriptions & Stripe)
  // =================================================================

  // --- Boosts ---
  app.get("/api/boost/plans", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.post("/api/boost/checkout", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/boost/status/:annonceId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/boost/success", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Subscriptions ---
  app.get("/api/subscriptions/status/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Purchase History ---
  app.get("/api/purchase-history/user/:userId", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Stripe Webhook ---
  app.post("/api/stripe/webhook", async (req, res) => {
    // ... (contenu de la route inchangé)
  });


  // =================================================================
  // SECTION: ADMINISTRATION
  // =================================================================

  // --- Admin - Annonce Management ---
  app.get("/api/admin/pending-annonces", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/admin/annonces/:id/approve", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/admin/annonces/:id/reject", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/admin/annonces/:id/deactivate", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/vehicles", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/deleted-annonces", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Admin - Professional Account Management ---
  app.get("/api/admin/professional-accounts", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/professional-accounts/:id/documents", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/admin/professional-accounts/:id/verify", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/professional-accounts/pending-count", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/documents/:path/signed-url", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Admin - User Management ---
  app.get("/api/admin/all-users", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.patch("/api/admin/users/:userId/verify", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  // --- Admin - Statistics & Reports ---
  app.get("/api/vehicles/deleted/count", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/vehicles-stats", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/performance-stats", async (req, res) => {
    // ... (contenu de la route inchangé)
  });

  app.get("/api/admin/purchase-history", async (req, res) => {
    // ... (contenu de la route inchangé)
  });


  // =================================================================
  // SECTION: MONTAGE DES ROUTERS EXTERNES
  // =================================================================

  // Mount new route handlers
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/saved-searches", savedSearchRoutes);
  app.use("/api/admin", adminRoutes); // Attention : celui-ci peut être redondant si vous migrez les routes admin ci-dessus
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

  // Setup wishlist migration routes
  setupWishlistMigration(app);
  setupWishlistDirect(app);

  const httpServer = createServer(app);
  return httpServer;
}