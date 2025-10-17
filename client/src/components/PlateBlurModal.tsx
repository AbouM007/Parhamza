import { useEffect, useRef, useState } from "react";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";
import { Canvas, Rect, FabricImage } from "fabric";

interface PlateBlurModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onConfirm: (maskData: { centerX: number; centerY: number; width: number; height: number; angle: number }) => void;
}

export const PlateBlurModal = ({
  isOpen,
  imageUrl,
  onClose,
  onConfirm,
}: PlateBlurModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [maskRect, setMaskRect] = useState<Rect | null>(null);
  const [imageScale, setImageScale] = useState({ scale: 1, offsetX: 0, offsetY: 0, originalWidth: 1, originalHeight: 1 });
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !containerRef.current) return;

    // Calculer la taille du canvas en fonction de l'écran
    const isMobile = window.innerWidth < 768;
    const maxWidth = isMobile ? window.innerWidth - 32 : 800; // 32px = padding mobile
    const maxHeight = isMobile ? window.innerHeight * 0.6 : 600; // 60% de la hauteur écran sur mobile
    
    const canvasWidth = Math.min(maxWidth, 800);
    const canvasHeight = Math.min(maxHeight, 600);

    // Initialiser le canvas Fabric.js avec taille adaptée
    const canvas = new Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#f3f4f6",
    });

    setFabricCanvas(canvas);

    // Charger l'image
    FabricImage.fromURL(imageUrl).then((img) => {
      // Calculer le ratio pour adapter l'image au canvas (mode contain)
      const imageWidth = img.width || 1;
      const imageHeight = img.height || 1;
      const scale = Math.min(
        canvasWidth / imageWidth,
        canvasHeight / imageHeight
      );

      const offsetX = (canvasWidth - imageWidth * scale) / 2;
      const offsetY = (canvasHeight - imageHeight * scale) / 2;

      // Stocker les infos de scale pour la conversion
      setImageScale({
        scale,
        offsetX,
        offsetY,
        originalWidth: imageWidth,
        originalHeight: imageHeight,
      });

      img.scale(scale);
      img.selectable = false;
      img.evented = false;

      // Centrer l'image
      img.set({
        left: offsetX,
        top: offsetY,
      });

      canvas.add(img);
      canvas.sendObjectToBack(img);

      // Créer le rectangle blanc de masquage (rotation activée)
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
        // Rotation activée - pas de lockRotation
      });

      canvas.add(rect);
      canvas.setActiveObject(rect);
      setMaskRect(rect);

      canvas.renderAll();
    }).catch((err) => {
      console.error("Erreur chargement image:", err);
    });

    // Cleanup: révoquer blob URL si nécessaire
    return () => {
      canvas.dispose();
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, imageUrl]);

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoomLevel * 1.2, 3); // Max zoom 3x
    setZoomLevel(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoomLevel / 1.2, 0.5); // Min zoom 0.5x
    setZoomLevel(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleConfirm = () => {
    if (!maskRect || !fabricCanvas) return;

    // Récupérer le VRAI centre du rectangle avec Fabric.js API (gère la rotation correctement)
    const centerPoint = maskRect.getCenterPoint();
    const canvasCenterX = centerPoint.x / zoomLevel; // Ajuster pour le zoom
    const canvasCenterY = centerPoint.y / zoomLevel;

    // Récupérer les dimensions NON tournées du rectangle
    const rectScaleX = maskRect.scaleX || 1;
    const rectScaleY = maskRect.scaleY || 1;
    const canvasWidth = (maskRect.width || 0) * rectScaleX;
    const canvasHeight = (maskRect.height || 0) * rectScaleY;
    const rotationAngle = maskRect.angle || 0; // Angle en degrés

    // Convertir les coordonnées du centre vers l'image originale
    const originalCenterX = (canvasCenterX - imageScale.offsetX) / imageScale.scale;
    const originalCenterY = (canvasCenterY - imageScale.offsetY) / imageScale.scale;
    const originalWidth = canvasWidth / imageScale.scale;
    const originalHeight = canvasHeight / imageScale.scale;

    // Clamper le centre dans les limites de l'image
    const clampedCenterX = Math.max(0, Math.min(Math.round(originalCenterX), imageScale.originalWidth));
    const clampedCenterY = Math.max(0, Math.min(Math.round(originalCenterY), imageScale.originalHeight));
    const clampedWidth = Math.max(1, Math.round(originalWidth));
    const clampedHeight = Math.max(1, Math.round(originalHeight));

    const maskData = {
      centerX: clampedCenterX,
      centerY: clampedCenterY,
      width: clampedWidth,
      height: clampedHeight,
      angle: rotationAngle,
    };

    onConfirm(maskData);
  };

  if (!isOpen) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
              Masquer la plaque d'immatriculation
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Déplacez et redimensionnez le rectangle blanc pour masquer la plaque
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            data-testid="button-close-blur-modal"
          >
            <X className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
          </button>
        </div>

        {/* Canvas avec scroll et zoom */}
        <div className="flex-1 bg-gray-50 overflow-auto" ref={containerRef}>
          <div className="p-4 md:p-6 min-h-full flex flex-col items-center justify-center">
            <div className="relative">
              <canvas ref={canvasRef} className="border-2 border-gray-300 rounded-lg max-w-full" />
              
              {/* Contrôles de zoom (flottants sur mobile) */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-1">
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-zoom-in"
                  title="Zoom avant"
                >
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="button-zoom-out"
                  title="Zoom arrière"
                >
                  <ZoomOut className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200">
          {!isMobile && (
            <div className="px-6 py-3 text-sm text-gray-600 border-b border-gray-200">
              💡 Astuce : Utilisez les poignées pour redimensionner le rectangle
            </div>
          )}
          <div className="flex items-center justify-end gap-3 p-4 md:p-6">
            <button
              onClick={onClose}
              className="px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base"
              data-testid="button-cancel-blur"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 md:px-6 py-2 bg-primary-bolt-500 text-white rounded-lg hover:bg-primary-bolt-600 transition-colors flex items-center gap-2 text-sm md:text-base"
              data-testid="button-confirm-blur"
            >
              <Check className="h-4 w-4 md:h-5 md:w-5" />
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
