import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { Canvas, Rect, FabricImage } from "fabric";

interface PlateBlurModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onConfirm: (maskData: { x: number; y: number; width: number; height: number }) => void;
}

export const PlateBlurModal = ({
  isOpen,
  imageUrl,
  onClose,
  onConfirm,
}: PlateBlurModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [maskRect, setMaskRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Initialiser le canvas Fabric.js
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f3f4f6",
    });

    setFabricCanvas(canvas);

    // Charger l'image
    FabricImage.fromURL(imageUrl).then((img) => {
      const canvasWidth = 800;
      const canvasHeight = 600;

      // Calculer le ratio pour adapter l'image au canvas
      const scale = Math.min(
        canvasWidth / (img.width || 1),
        canvasHeight / (img.height || 1)
      );

      img.scale(scale);
      img.selectable = false;
      img.evented = false;

      // Centrer l'image
      img.set({
        left: (canvasWidth - (img.width || 0) * scale) / 2,
        top: (canvasHeight - (img.height || 0) * scale) / 2,
      });

      canvas.add(img);
      canvas.sendObjectToBack(img);

      // Créer le rectangle blanc de masquage
      const rect = new Rect({
        left: canvasWidth / 2 - 75,
        top: canvasHeight / 2 - 25,
        width: 150,
        height: 50,
        fill: "white",
        stroke: "#3b82f6",
        strokeWidth: 2,
        cornerColor: "#3b82f6",
        cornerSize: 10,
        transparentCorners: false,
        borderColor: "#3b82f6",
      });

      canvas.add(rect);
      canvas.setActiveObject(rect);
      setMaskRect(rect);

      canvas.renderAll();
    }).catch((err) => {
      console.error("Erreur chargement image:", err);
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [isOpen, imageUrl]);

  const handleConfirm = () => {
    if (!maskRect || !fabricCanvas) return;

    const scaleX = maskRect.scaleX || 1;
    const scaleY = maskRect.scaleY || 1;

    const maskData = {
      x: Math.round(maskRect.left || 0),
      y: Math.round(maskRect.top || 0),
      width: Math.round((maskRect.width || 0) * scaleX),
      height: Math.round((maskRect.height || 0) * scaleY),
    };

    onConfirm(maskData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Masquer la plaque d'immatriculation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Déplacez et redimensionnez le rectangle blanc pour masquer la plaque
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="button-close-blur-modal"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="border-2 border-gray-300 rounded-lg" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            💡 Astuce : Utilisez les poignées pour redimensionner le rectangle
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              data-testid="button-cancel-blur"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-primary-bolt-500 text-white rounded-lg hover:bg-primary-bolt-600 transition-colors flex items-center gap-2"
              data-testid="button-confirm-blur"
            >
              <Check className="h-5 w-5" />
              Appliquer le masque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
