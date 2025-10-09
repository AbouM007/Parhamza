import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  onBeforeClose?: () => boolean; // Retourne false pour empêcher la fermeture
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  onBeforeClose
}) => {
  if (!isOpen) return null;

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Si une validation est définie, l'exécuter
    if (onBeforeClose) {
      const canClose = onBeforeClose();
      if (!canClose) {
        return; // Ne pas fermer si la validation retourne false
      }
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={(e) => e.preventDefault()} // pas de fermeture sur clic backdrop
      />

      {/* Modal */}
      <div
        className={`
          absolute top-1/2 left-1/2 
          w-[95vw] max-w-4xl 
          max-h-[90vh] 
          bg-white rounded-xl shadow-2xl 
          transform -translate-x-1/2 -translate-y-1/2
          ${className}
        `}
        style={{
          transform: "translate(-50%, -50%)"
        }}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-between p-4 border-b border-gray-200 rounded-t-xl
            bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 text-white
            cursor-default
          `}
        >
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            type="button"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DraggableModal;
