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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Token d'authentification manquant" });
    }

    const token = authHeader.substring(7);

    // ✅ Vérification du token auprès de Supabase
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Token invalide" });
    }

    // ✅ Vérifier si l'utilisateur existe dans notre DB
    let { data: dbUser, error: userError } = await supabaseServer
      .from("users")
      .select("id, email, type, name, profile_completed")
      .eq("id", user.id)
      .single();

    // 🚀 Auto-création si l'utilisateur n'existe pas encore
    if (userError || !dbUser) {
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

      dbUser = newUser;
    }

    // ✅ Attacher l'utilisateur à la requête
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      type: dbUser.type,
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
