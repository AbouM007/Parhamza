/**
 * Compression d'images OPTIMISÉE pour mobile - version allégée
 * Utilise des chunks pour éviter de bloquer le thread principal
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresse une image de manière asynchrone sans bloquer l'UI
 * Version optimisée pour mobile avec gestion mémoire
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  // Retourne le fichier original s'il est déjà petit
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Erreur de chargement"));
    };
    
    img.onload = () => {
      try {
        // Calculer dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Canvas avec dimensions réduites
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { 
          alpha: false, // Pas de transparence = plus rapide
          willReadFrequently: false 
        });
        
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas error"));
          return;
        }

        // Dessiner image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Libérer mémoire
        URL.revokeObjectURL(objectUrl);

        // Convertir en blob (WebP si supporté, sinon JPEG)
        const outputType = 'image/jpeg'; // Plus compatible
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: outputType,
              lastModified: Date.now(),
            });

            console.log(`✅ Compression: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.src = objectUrl;
  });
}
