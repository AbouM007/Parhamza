/**
 * Compression d'images pour éviter les crashs sur mobile
 * Réduit la taille des images avant preview/upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 2,
};

/**
 * Compresse une image pour éviter les problèmes de mémoire sur mobile
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error("Erreur de chargement de l'image"));
      
      img.onload = () => {
        try {
          // Calculer les nouvelles dimensions
          let { width, height } = img;
          const maxWidth = opts.maxWidth!;
          const maxHeight = opts.maxHeight!;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Créer un canvas pour la compression
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Impossible de créer le contexte canvas"));
            return;
          }

          // Dessiner l'image redimensionnée
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir en Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Erreur de compression"));
                return;
              }

              // Créer un nouveau fichier
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Crée une URL d'aperçu sécurisée pour mobile
 * Compresse l'image si nécessaire avant de créer l'URL
 */
export async function createSafePreviewURL(file: File): Promise<string> {
  // Si le fichier est petit (< 500KB), pas besoin de compression
  if (file.size < 500 * 1024) {
    return URL.createObjectURL(file);
  }

  try {
    // Compression pour les gros fichiers
    const compressed = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
    });
    return URL.createObjectURL(compressed);
  } catch (error) {
    console.error("Erreur de compression:", error);
    // Fallback: utiliser le fichier original
    return URL.createObjectURL(file);
  }
}

/**
 * Libère la mémoire d'une URL de preview
 */
export function revokePreviewURL(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
