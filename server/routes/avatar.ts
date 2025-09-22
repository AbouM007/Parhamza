import express from "express";
import { supabaseServer } from "../supabase";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import type { Request, Response } from "express";

const router = express.Router();

// Configuration multer pour l'upload d'avatar
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
    files: 1, // Un seul fichier
  },
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est bien une image
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Seuls les formats JPG, PNG et WEBP sont autorisés") as any,
        false,
      );
    }
  },
});

// Route pour uploader un avatar
router.post(
  "/upload/:userId",
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const file = req.file;

      console.log(`🚀 Début upload avatar - userId: ${userId}`);
      console.log(
        `📁 Fichier reçu:`,
        file
          ? {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            }
          : "Aucun fichier",
      );

      if (!file) {
        console.log("❌ Aucun fichier fourni");
        return res.status(400).json({ error: "Aucune image fournie" });
      }

      console.log(`🖼️ Upload d'avatar pour l'utilisateur ${userId}`);

      // Vérifier que l'utilisateur existe et est de type 'individual'
      const { data: existingUser, error: userError } = await supabaseServer
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !existingUser) {
        console.log("❌ Utilisateur non trouvé:", userError);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      /*
      if (existingUser.type !== "individual") {
        console.log("❌ Utilisateur non autorisé:", existingUser.type);
        return res.status(403).json({
          error:
            "Seuls les utilisateurs individuels peuvent uploader un avatar",
        });
      } */

      // Supprimer l'ancien avatar s'il existe
      if (existingUser.avatar) {
        try {
          // Extraire le nom du fichier de l'URL
          const oldAvatarPath = existingUser.avatar.split("/").pop();
          if (oldAvatarPath) {
            const oldFilePath = `avatars/${oldAvatarPath}`;
            await supabaseServer.storage
              .from("vehicle-images")
              .remove([oldFilePath]);
            console.log(`🗑️ Ancien avatar supprimé: ${oldFilePath}`);
          }
        } catch (error) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancien avatar:",
            error,
          );
        }
      }

      // Générer un nom unique pour l'avatar
      const timestamp = Date.now();
      const extension =
        file.originalname.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}-${timestamp}.${extension}`;
      const filePath = `avatars/${fileName}`;

      // Optimiser l'image avec Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseServer.storage
          .from("vehicle-images")
          .upload(filePath, optimizedBuffer, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error("❌ Erreur upload Supabase Storage:", uploadError);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'upload de l'image" });
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabaseServer.storage
        .from("vehicle-images")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Mettre à jour la base de données
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from("users")
        .update({ avatar: avatarUrl })
        .eq("id", userId)
        .select()
        .single();

      if (updateError || !updatedUser) {
        console.error("❌ Erreur mise à jour base de données:", updateError);
        // Supprimer le fichier uploadé en cas d'erreur DB
        await supabaseServer.storage.from("vehicle-images").remove([filePath]);
        return res
          .status(500)
          .json({ error: "Erreur lors de la mise à jour du profil" });
      }

      console.log(`✅ Avatar uploadé avec succès: ${avatarUrl}`);

      res.json({
        success: true,
        avatar_url: avatarUrl,
        message: "Avatar mis à jour avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur serveur upload avatar:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// Route pour supprimer un avatar
router.delete("/remove/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur existe
    const { data: existingUser, error: userError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (!existingUser.avatar) {
      return res.status(400).json({ error: "Aucun avatar à supprimer" });
    }

    // Supprimer le fichier de Supabase Storage
    try {
      const avatarPath = existingUser.avatar.split("/").pop();
      if (avatarPath) {
        const filePath = `avatars/${avatarPath}`;
        await supabaseServer.storage.from("vehicle-images").remove([filePath]);
        console.log(`🗑️ Avatar supprimé: ${filePath}`);
      }
    } catch (error) {
      console.warn("⚠️ Erreur lors de la suppression du fichier:", error);
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabaseServer
      .from("users")
      .update({ avatar: null })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Erreur mise à jour base de données:", updateError);
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du profil" });
    }

    console.log(`✅ Avatar supprimé pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Avatar supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur serveur suppression avatar:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
