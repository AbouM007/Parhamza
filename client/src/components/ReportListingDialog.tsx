import { useState } from "react";
import { Flag, AlertTriangle, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ReportListingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "fraud", label: "🚨 Arnaque / Prix suspect" },
  { value: "wrong_photos", label: "📸 Photos ne correspondent pas au véhicule" },
  { value: "sold", label: "✅ Véhicule déjà vendu (non retiré)" },
  { value: "wrong_info", label: "🔧 Informations techniques erronées" },
  { value: "inappropriate", label: "🚫 Contenu inapproprié/offensant" },
  { value: "duplicate", label: "📋 Doublon d'une autre annonce" },
  { value: "other", label: "❓ Autre raison" },
];

export function ReportListingDialog({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  onSuccess,
}: ReportListingDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const showToast = (message: string, isError: boolean = false) => {
    const toastDiv = document.createElement('div');
    toastDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white ${isError ? 'bg-red-500' : 'bg-green-500'} shadow-lg`;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => document.body.removeChild(toastDiv), 3000);
  };

  const reportMutation = useMutation({
    mutationFn: async (data: { listingId: number; reason: string; description: string }) => {
      return apiRequest("/api/reports", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      showToast("✅ Merci, votre signalement a bien été transmis à notre équipe.");
      setReason("");
      setDescription("");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const message = error.message || "Une erreur est survenue";
      showToast(message, true);
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      showToast("Veuillez sélectionner une raison", true);
      return;
    }

    reportMutation.mutate({
      listingId,
      reason,
      description: description.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Flag className="h-6 w-6" />
              <h3 className="text-xl font-bold">Signaler cette annonce</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              data-testid="button-close-report"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-2">
            Aidez-nous à maintenir la qualité de la plateforme
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Alert info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-semibold">Annonce : </span>
              {listingTitle}
            </div>
          </div>

          {/* Raison */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Raison du signalement *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              data-testid="select-report-reason"
            >
              <option value="">Choisissez une raison</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Décrivez brièvement le problème..."
              maxLength={200}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              data-testid="textarea-report-description"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/200 caractères
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={reportMutation.isPending}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            data-testid="button-cancel-report"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={reportMutation.isPending || !reason}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-report"
          >
            {reportMutation.isPending ? "Envoi..." : "Envoyer le signalement"}
          </button>
        </div>
      </div>
    </div>
  );
}
