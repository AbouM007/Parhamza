import express from "express";
import { supabaseServer } from "../supabase";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import type { Request, Response } from "express";

const router = express.Router();

// Configuration multer pour gérer les uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB par fichier
    files: 4, // Maximum 4 fichiers par upload
  },
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est bien une image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées") as any, false);
    }
  },
});

// Upload multiple images pour une annonce
router.post(
  "/upload/:userId/:annonceId?",
  upload.array("images", 4),
  async (req: Request, res: Response) => {
    try {
      const { userId, annonceId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucune image fournie" });
      }

      console.log(
        `📸 Upload de ${files.length} images pour utilisateur ${userId}`,
      );

      // 🚀 OPTIMISATION PERFORMANCE: Traitement en parallèle des images
      console.log("⚡ Traitement parallèle des images démarré...");
      const startTime = Date.now();

      // Créer une promesse de traitement pour chaque image
      const uploadPromises = files.map(async (file) => {
        // Générer un nom unique pour l'image
        const imageId = uuidv4();
        const extension =
          file.originalname.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${imageId}.webp`; // Forcer extension WebP
        const filePath = `annonces/${userId}/${fileName}`;

        try {
          // Optimiser l'image : WebP + Redimensionnement + Filigrane
          console.log(
            `📊 Traitement image: ${file.originalname} (${Math.round(file.size / 1024)}KB)`,
          );

          const image = sharp(file.buffer);
          const metadata = await image.metadata();

          // Déterminer les dimensions optimales
          const isMainImage =
            file.originalname.toLowerCase().includes("main") ||
            file.originalname.toLowerCase().includes("principal");
          const maxWidth = isMainImage ? 1200 : 800;
          const maxHeight = isMainImage ? 900 : 600;

          let processedImage = image;

          // 1. Redimensionnement si nécessaire
          if (
            metadata.width &&
            metadata.height &&
            (metadata.width > maxWidth || metadata.height > maxHeight)
          ) {
            console.log(
              `🔧 Redimensionnement: ${metadata.width}x${metadata.height} → max ${maxWidth}x${maxHeight}`,
            );
            processedImage = processedImage.resize(maxWidth, maxHeight, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          // 2. Ajout du filigrane texte translucide au centre  
          const watermarkSvg = `
          <svg width="600" height="100" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="50%" 
                  font-family="Arial, sans-serif" 
                  font-size="44" 
                  font-weight="bold"
                  text-anchor="middle" 
                  dominant-baseline="middle"
                  fill="grey" 
                  fill-opacity="0.2">
              PassionAuto2Roues.com
            </text>
          </svg>`;

          const watermarkBuffer = Buffer.from(watermarkSvg);

          // 3. Conversion WebP avec filigrane au centre
          const processedBuffer = await processedImage
            .composite([
              {
                input: watermarkBuffer,
                gravity: "center", // 👈 place au centre automatiquement
                blend: "over",
              },
            ])
            .webp({
              quality: 85,
              effort: 5, // ⚡ OPTIMISATION: Réduire effort de 6 à 5 pour plus de vitesse
              smartSubsample: true,
            })
            .toBuffer();

          const savings = Math.round(
            (1 - processedBuffer.length / file.size) * 100,
          );
          const newSize = Math.round(processedBuffer.length / 1024);

          // Upload vers Supabase Storage
          const { data, error } = await supabaseServer.storage
            .from("vehicle-images")
            .upload(filePath, processedBuffer, {
              contentType: "image/webp", // Type WebP
              cacheControl: "31536000", // Cache 1 an
            });

          if (error) {
            console.error(`❌ Erreur upload image ${fileName}:`, error);
            return null; // Retourner null au lieu de continue
          }

          // Obtenir l'URL publique
          const { data: publicUrlData } = supabaseServer.storage
            .from("vehicle-images")
            .getPublicUrl(filePath);

          console.log(`✅ Image uploadée: ${fileName} (${newSize}KB, -${savings}%)`);
          
          return {
            id: imageId,
            url: publicUrlData.publicUrl,
            path: filePath,
            originalName: file.originalname,
            size: processedBuffer.length,
          };
        } catch (imageError) {
          console.error(
            `❌ Erreur traitement image ${file.originalname}:`,
            imageError,
          );
          return null; // Retourner null en cas d'erreur
        }
      });

      // 🚀 Traiter toutes les images EN PARALLÈLE
      const results = await Promise.all(uploadPromises);
      const uploadedImages = results.filter((result): result is {
        id: string;
        url: string;
        path: string;
        originalName: string;
        size: number;
      } => result !== null); // Type-safe filter des échecs
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Traitement parallèle terminé en ${processingTime}ms (${uploadedImages.length}/${files.length} succès)`);

      if (uploadedImages.length === 0) {
        return res
          .status(500)
          .json({ error: "Échec de l'upload de toutes les images" });
      }

      res.json({
        success: true,
        images: uploadedImages,
        message: `${uploadedImages.length}/${files.length} images uploadées avec succès`,
      });
    } catch (error) {
      console.error("❌ Erreur upload images:", error);
      res.status(500).json({ error: "Erreur serveur lors de l'upload" });
    }
  },
);

// Supprimer une image
router.delete("/delete/:userId/:imagePath", async (req, res) => {
  try {
    const { userId, imagePath } = req.params;
    const fullPath = `annonces/${userId}/${imagePath}`;

    console.log(`🗑️ Suppression image: ${fullPath}`);

    const { error } = await supabaseServer.storage
      .from("vehicle-images")
      .remove([fullPath]);

    if (error) {
      console.error("❌ Erreur suppression image:", error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }

    console.log(`✅ Image supprimée: ${fullPath}`);
    res.json({ success: true, message: "Image supprimée avec succès" });
  } catch (error) {
    console.error("❌ Erreur suppression image:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

// Obtenir les images d'une annonce
router.get("/annonce/:annonceId", async (req, res) => {
  try {
    const { annonceId } = req.params;

    // Récupérer l'annonce pour obtenir les images
    const { data: annonce, error } = await supabaseServer
      .from("annonces")
      .select("images, userId")
      .eq("id", annonceId)
      .single();

    if (error || !annonce) {
      return res.status(404).json({ error: "Annonce non trouvée" });
    }

    const images = annonce.images || [];

    // 🔧 AMÉLIORATION: Transformer les chemins en URLs publiques avec gestion d'erreurs robuste
    const imageUrls = images
      .map((imagePath: string) => {
        try {
          // Vérifier que le chemin est valide
          if (!imagePath || typeof imagePath !== 'string') {
            console.warn(`⚠️ Chemin d'image invalide:`, imagePath);
            return null;
          }

          // Si c'est déjà une URL complète, la valider
          if (imagePath.startsWith("http")) {
            try {
              new URL(imagePath); // Valider l'URL
              return imagePath;
            } catch {
              console.warn(`⚠️ URL malformée:`, imagePath);
              return null;
            }
          }

          // Construire l'URL publique Supabase
          const { data: publicUrlData } = supabaseServer.storage
            .from("vehicle-images")
            .getPublicUrl(imagePath);

          // Vérifier que l'URL a été générée correctement
          if (!publicUrlData?.publicUrl) {
            console.warn(`⚠️ Impossible de générer l'URL publique pour:`, imagePath);
            return null;
          }

          return publicUrlData.publicUrl;
        } catch (error) {
          console.error(`❌ Erreur traitement image ${imagePath}:`, error);
          return null;
        }
      })
      .filter(Boolean); // Filtrer les URLs nulles

    res.json({ success: true, images: imageUrls });
  } catch (error) {
    console.error("❌ Erreur récupération images:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Upload logo d'entreprise
/*
router.post(
  "/upload-logo/:userId",
  upload.single("logo"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const file = req.file as Express.Multer.File;

      if (!file) {
        return res.status(400).json({ error: "Aucun logo fourni" });
      }

      console.log(`🏢 Upload logo entreprise pour utilisateur ${userId}`);

      // Générer un nom unique pour le logo
      const imageId = uuidv4();
      const fileName = `${imageId}.webp`;
      const filePath = `company-logos/${userId}/${fileName}`;

      try {
        // Optimiser le logo : WebP + Redimensionnement pour logo (carré)
        console.log(
          `📊 Traitement logo: ${file.originalname} (${Math.round(file.size / 1024)}KB)`,
        );

        const image = sharp(file.buffer);
        const metadata = await image.metadata();

        // Dimensions optimales pour un logo (carré 200x200)
        const logoSize = 200;

        let processedImage = image;

        // Redimensionner en carré et centrer
        console.log(
          `🔧 Redimensionnement logo: ${metadata.width}x${metadata.height} → ${logoSize}x${logoSize}`,
        );
        processedImage = processedImage.resize(logoSize, logoSize, {
          fit: "cover",
          position: "center",
        });

        // Conversion WebP avec qualité optimisée pour logo
        const processedBuffer = await processedImage
          .webp({ quality: 90 }) // Qualité plus élevée pour les logos
          .toBuffer();

        const finalSizeMB = processedBuffer.length / (1024 * 1024);
        console.log(`✅ Logo optimisé: ${Math.round(finalSizeMB * 1000)}KB`);

        // Upload vers Supabase Storage
        const { data, error } = await supabaseServer.storage
          .from("vehicle-images")
          .upload(filePath, processedBuffer, {
            contentType: "image/webp",
            cacheControl: "31536000", // Cache 1 an
          });

        if (error) {
          console.error(`❌ Erreur upload logo ${fileName}:`, error);
          return res
            .status(500)
            .json({ error: "Erreur lors de l'upload du logo" });
        }

        // Obtenir l'URL publique
        const { data: publicUrlData } = supabaseServer.storage
          .from("vehicle-images")
          .getPublicUrl(filePath);

        const logoData = {
          id: imageId,
          url: publicUrlData.publicUrl,
          path: filePath,
          originalName: file.originalname,
          size: processedBuffer.length,
        };

        console.log(`✅ Logo uploadé: ${fileName}`);

        res.json({
          success: true,
          logo: logoData,
          message: "Logo uploadé avec succès",
        });
      } catch (imageError) {
        console.error(
          `❌ Erreur traitement logo ${file.originalname}:`,
          imageError,
        );
        return res
          .status(500)
          .json({ error: "Erreur lors du traitement du logo" });
      }
    } catch (error) {
      console.error("❌ Erreur upload logo:", error);
      res
        .status(500)
        .json({ error: "Erreur serveur lors de l'upload du logo" });
    }
  }, 
);*/

// Appliquer un masque blanc sur une image (pour cacher plaque d'immatriculation)
router.post("/apply-mask", async (req: Request, res: Response) => {
  try {
    const { imageUrl, mask, userId } = req.body;

    if (!imageUrl || !mask) {
      return res.status(400).json({ error: "Image URL et données de masque requis" });
    }

    console.log(`🎨 Application masque blanc sur image pour utilisateur ${userId}`);
    console.log(`📐 Coordonnées masque:`, mask);

    // Télécharger l'image depuis l'URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return res.status(400).json({ error: "Impossible de charger l'image" });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Créer le rectangle blanc SVG
    const maskSvg = `
      <svg width="${mask.width}" height="${mask.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
      </svg>
    `;

    const maskBuffer = Buffer.from(maskSvg);

    // Appliquer le masque blanc sur l'image
    const maskedImageBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: maskBuffer,
          top: mask.y,
          left: mask.x,
          blend: "over",
        },
      ])
      .toBuffer();

    // Générer un nouveau nom pour l'image masquée
    const imageId = uuidv4();
    const fileName = `${imageId}-masked.webp`;
    const filePath = `annonces/${userId}/${fileName}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from("vehicle-images")
      .upload(filePath, maskedImageBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });

    if (error) {
      console.error(`❌ Erreur upload image masquée:`, error);
      return res.status(500).json({ error: "Erreur lors de l'upload de l'image masquée" });
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabaseServer.storage
      .from("vehicle-images")
      .getPublicUrl(filePath);

    console.log(`✅ Image masquée uploadée: ${fileName}`);

    res.json({
      success: true,
      maskedImageUrl: publicUrlData.publicUrl,
      message: "Masque appliqué avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur application masque:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'application du masque" });
  }
});

export default router;
