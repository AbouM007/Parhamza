import { useState } from "react";
import { AlertCircle, Upload, FileText, CheckCircle, Loader } from "lucide-react";
import { FormLabel } from "../shared/FormLabel";
import { StepButtons } from "../shared/StepButtons";
import { StepProps } from "../../types";
import { useAuth } from "@/contexts/AuthContext";

export const DocsStep = ({
  currentData,
  onComplete,
  onBack,
}: StepProps) => {
  const { session } = useAuth();
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [cinFormat, setCinFormat] = useState<"pdf" | "images">("pdf");
  const [cinFiles, setCinFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [cinError, setCinError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleKbisSelect = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors("Le fichier ne doit pas dépasser 5 MB.");
      return;
    }
    setKbisFile(file);
    setErrors(null);
  };

  const handleContinue = async () => {
    setErrors(null);
    setCinError(null);

    // Validation KBIS
    if (!kbisFile) {
      setErrors("Le document KBIS est obligatoire.");
      return;
    }

    // Validation CIN
    if (cinFormat === "pdf") {
      if (
        cinFiles.length !== 1 ||
        cinFiles[0].type !== "application/pdf" ||
        cinFiles[0].size > MAX_FILE_SIZE
      ) {
        setCinError(
          "Veuillez fournir un fichier PDF (≤ 5 MB) unique pour la CIN."
        );
        return;
      }
    } else {
      if (
        cinFiles.length !== 2 ||
        !cinFiles.every(
          (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE
        )
      ) {
        setCinError(
          "Veuillez fournir 2 images (recto/verso), ≤ 5 MB chacune."
        );
        return;
      }
    }

    // Vérifier la session
    if (!session?.access_token) {
      setErrors("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    // Uploader les documents immédiatement au serveur
    setIsUploading(true);
    try {
      const formData = new FormData();
      
      // Ajouter les infos professionnelles depuis l'étape précédente
      const professional = currentData.professional as any;
      if (professional?.companyName) {
        formData.append("company_name", professional.companyName);
      }
      if (professional?.siret) {
        formData.append("siret", professional.siret);
      }
      
      // Ajouter les documents
      formData.append("kbis_document", kbisFile);
      cinFiles.forEach((file) => {
        formData.append("cin_document", file);
      });

      const response = await fetch("/api/professional-accounts/verify", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${session.access_token}` 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur lors de l'upload des documents");
      }

      // Documents uploadés avec succès, passer à l'étape suivante
      onComplete({
        documents: {
          uploaded: true,
          cinFormat,
        },
      });
    } catch (error) {
      console.error("❌ Erreur upload documents:", error);
      setErrors(error instanceof Error ? error.message : "Erreur lors de l'upload des documents. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documents de vérification
        </h2>
        <p className="text-gray-600">
          Téléchargez vos documents pour vérifier votre entreprise
        </p>
      </div>

      {/* KBIS Document */}
      <div>
        <FormLabel required>Document KBIS</FormLabel>
        <div className="mt-2">
          <label
            htmlFor="kbis-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            data-testid="label-kbis-upload"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {kbisFile ? (
                <>
                  <CheckCircle className="w-10 h-10 mb-2 text-green-500" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{kbisFile.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {(kbisFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Cliquez pour télécharger ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PDF, JPG ou PNG (max. 5MB)</p>
                </>
              )}
            </div>
            <input
              id="kbis-upload"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                e.target.files && handleKbisSelect(e.target.files[0])
              }
              data-testid="input-kbis"
            />
          </label>
        </div>
      </div>

      {/* CIN Document */}
      <div>
        <FormLabel required>Pièce d'identité du gérant (CIN)</FormLabel>

        {/* Format Selection */}
        <div className="flex items-center gap-4 mt-2 mb-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="cinFormat"
              value="pdf"
              checked={cinFormat === "pdf"}
              onChange={() => {
                setCinFormat("pdf");
                setCinFiles([]);
                setCinError(null);
              }}
              className="mr-2"
              data-testid="radio-cin-pdf"
            />
            <span className="text-sm text-gray-700">PDF (un seul fichier)</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="cinFormat"
              value="images"
              checked={cinFormat === "images"}
              onChange={() => {
                setCinFormat("images");
                setCinFiles([]);
                setCinError(null);
              }}
              className="mr-2"
              data-testid="radio-cin-images"
            />
            <span className="text-sm text-gray-700">Images (recto + verso)</span>
          </label>
        </div>

        {/* Upload Input */}
        <div>
          {cinFormat === "pdf" ? (
            <label
              htmlFor="cin-pdf-upload"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {cinFiles.length > 0
                    ? cinFiles[0].name
                    : "Cliquez pour télécharger votre CIN en PDF"}
                </span>
              </div>
              <input
                id="cin-pdf-upload"
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setCinFiles(file ? [file] : []);
                }}
                data-testid="input-cin-pdf"
              />
            </label>
          ) : (
            <label
              htmlFor="cin-images-upload"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {cinFiles.length > 0
                    ? `${cinFiles.length} image(s) sélectionnée(s)`
                    : "Cliquez pour télécharger 2 images (recto/verso)"}
                </span>
              </div>
              <input
                id="cin-images-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                    ? Array.from(e.target.files)
                    : [];
                  setCinFiles(files);
                }}
                data-testid="input-cin-images"
              />
            </label>
          )}

          {/* Files Preview */}
          {cinFiles.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              {cinFiles.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{f.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* CIN Error */}
          {cinError && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {cinError}
            </p>
          )}
        </div>
      </div>

      {/* Global Errors */}
      {errors && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors}
        </p>
      )}

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note :</strong> Vos documents seront examinés par notre équipe
          sous 24-48h. Vous recevrez une notification par email une fois la
          vérification terminée.
        </p>
      </div>

      {/* Navigation Buttons */}
      <StepButtons
        onBack={onBack}
        onContinue={handleContinue}
        continueText={isUploading ? "Upload en cours..." : "Continuer vers le paiement"}
        continueDisabled={isUploading}
      />
      
      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-teal-600">
          <Loader className="animate-spin h-5 w-5" />
          <span>Envoi des documents au serveur...</span>
        </div>
      )}
    </div>
  );
};