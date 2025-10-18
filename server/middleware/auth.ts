import { Request, Response, NextFunction } from "express";
import { supabaseServer } from "../supabase";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        type: string;
      };
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('🔐 [AUTH] Headers reçus:', Object.keys(req.headers));
    console.log('🔐 [AUTH] Authorization header:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ [AUTH] Token manquant ou invalide');
      return res
        .status(401)
        .json({ error: "Token d'authentification manquant" });
    }
    
    console.log('✅ [AUTH] Token trouvé, vérification en cours...');

    const token = authHeader.substring(7);

    // ✅ Vérification du token auprès de Supabase
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      console.error('❌ [AUTH] Erreur Supabase getUser:', error);
      console.error('❌ [AUTH] User retourné:', user);
      return res.status(401).json({ error: "Token invalide" });
    }
    
    console.log('✅ [AUTH] Token valide pour user:', user.id);

    // ✅ Vérifier si l'utilisateur existe dans notre DB
    let { data: profile, error: userError } = await supabaseServer
      .from("users")
      .select("id, email, type, name, profile_completed")
      .eq("id", user.id)
      .single();

    // 🚀 Auto-création si l'utilisateur n'existe pas encore
    if (userError || !profile) {
      console.log(
        `⚡ [AUTH] Nouvel utilisateur auto-créé depuis Supabase Auth: ${user.email}`,
      );

      const { data: newUser, error: insertError } = await supabaseServer
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: "", // vide par défaut → sera complété par onboarding
          type: "pending", // valeur safe par défaut
          profile_completed: false,
          created_at: new Date().toISOString(),
        })
        .select("id, email, type, name, profile_completed")
        .single();

      if (insertError) {
        console.error("❌ Erreur lors de la création auto user:", insertError);
        return res
          .status(500)
          .json({ error: "Impossible de créer l'utilisateur" });
      }

      profile = newUser;
    }

    // ✅ Attacher l'utilisateur à la requête
    req.user = {
      id: profile.id,
      email: profile.email,
      type: profile.type,
    };

    next();
  } catch (error) {
    console.error("❌ Erreur middleware authenticateUser:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de l'authentification" });
  }
};

export const requireAuth = authenticateUser;

export const requireProfessional = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await authenticateUser(req, res, () => {
    if (req.user?.type !== "professional") {
      return res.status(403).json({ error: "Compte professionnel requis" });
    }
    next();
  });
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('🔐 [REQUIRE_ADMIN] Vérification admin pour:', req.path);
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ [REQUIRE_ADMIN] Token manquant');
      return res.status(401).json({ error: "Token d'authentification manquant" });
    }
    
    const token = authHeader.substring(7);
    
    // Vérifier le token JWT auprès de Supabase
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ [REQUIRE_ADMIN] Token invalide:', error?.message);
      return res.status(401).json({ error: "Token invalide" });
    }
    
    // Vérifier que l'utilisateur a le type 'admin'
    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("id, email, type")
      .eq("id", user.id)
      .single();
    
    if (profileError || !profile) {
      console.log('❌ [REQUIRE_ADMIN] Profil non trouvé');
      return res.status(404).json({ error: "Profil utilisateur non trouvé" });
    }
    
    if (profile.type !== "admin") {
      console.log('❌ [REQUIRE_ADMIN] Utilisateur non-admin:', profile.email);
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    
    // Tout est OK, attacher l'utilisateur à la requête
    req.user = {
      id: profile.id,
      email: profile.email,
      type: profile.type,
    };
    
    console.log('✅ [REQUIRE_ADMIN] Admin authentifié:', profile.email);
    next();
  } catch (error) {
    console.error("❌ [REQUIRE_ADMIN] Erreur serveur:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la vérification admin" });
  }
};
