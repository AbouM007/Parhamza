import React, { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VerificationStepProps {
  onBack: () => void;
  onComplete: () => void;
}

export const VerificationStep: React.FC<VerificationStepProps> = ({
  onBack,
  onComplete,
}) => {
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [cinFormat, setCinFormat] = useState<"pdf" | "images">("pdf");
  const [cinFiles, setCinFiles] = useState<File[]>([]);
  const [cinError, setCinError] = useState<string | null>(null);

  const [errors, setErrors] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Limite de 5 Mo
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleKbisSelect = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors("Format non supporté (PDF, JPG ou PNG uniquement).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors("Le fichier KBIS ne doit pas dépasser 5 Mo.");
      return;
    }
    setKbisFile(file);
    setErrors(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!kbisFile) {
      setErrors("Le document KBIS est obligatoire.");
      return;
    }

    // ✅ Validation CIN
    if (cinFormat === "pdf") {
      if (
        cinFiles.length !== 1 ||
        cinFiles[0].type !== "application/pdf" ||
        cinFiles[0].size > MAX_FILE_SIZE
      ) {
        setCinError("Veuillez fournir un fichier PDF ≤ 5 Mo pour la CIN.");
        return;
      }
    } else {
      if (
        cinFiles.length !== 2 ||
        !cinFiles.every(
          (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE,
        )
      ) {
        setCinError("Veuillez fournir 2 images (recto/verso), ≤ 5 Mo chacune.");
        return;
      }
    }
    setCinError(null);

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");

      const formData = new FormData();
      formData.append("kbis_document", kbisFile);
      cinFiles.forEach((file) => {
        formData.append("cin_document", file);
      });

      const res = await fetch("/api/professional-accounts/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur serveur");
      }

      console.log("✅ Documents soumis avec succès");
      alert("✅ Vos documents ont bien été envoyés pour vérification.");
      onComplete();
    } catch (err) {
      console.error("❌ Erreur soumission:", err);
      setErrors("Erreur lors de l’envoi des documents.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Vérification des documents</h2>
      <p className="text-gray-600">
        Merci de fournir votre extrait KBIS et votre pièce d’identité (CIN).
      </p>

      {/* Upload KBIS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extrait KBIS *
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            e.target.files && handleKbisSelect(e.target.files[0])
          }
        />
        {kbisFile && (
          <p className="text-sm text-green-600 mt-1">📄 {kbisFile.name}</p>
        )}
      </div>

      {/* CIN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pièce d'identité du gérant (CIN) *
        </label>

        {/* Choix format */}
        <div className="flex items-center gap-4 mb-2">
          <label className="flex items-center">
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
            />
            PDF (un seul fichier)
          </label>
          <label className="flex items-center">
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
            />
            Images (recto + verso)
          </label>
        </div>

        {/* Upload fichiers */}
        {cinFormat === "pdf" ? (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setCinFiles(file ? [file] : []);
            }}
          />
        ) : (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setCinFiles(files);
            }}
          />
        )}

        {/* Aperçu fichiers */}
        {cinFiles.length > 0 && (
          <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
            {cinFiles.map((f, i) => (
              <li key={i}>{f.name}</li>
            ))}
          </ul>
        )}

        {cinError && <p className="text-red-500 text-sm mt-1">{cinError}</p>}
      </div>

      {/* Erreurs globales */}
      {errors && (
        <p className="text-sm text-red-600 mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" /> {errors}
        </p>
      )}

      {/* Boutons navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading && <Loader className="animate-spin h-5 w-5 mr-2" />}
          Envoyer mes documents
        </button>
      </div>
    </form>
  );
};
