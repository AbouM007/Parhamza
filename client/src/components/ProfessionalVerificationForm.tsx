import React, { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const ProfessionalVerificationForm: React.FC = () => {
  const { session } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gestion des erreurs globales
  const [errors, setErrors] = useState<string | null>(null);

  // Pour la CIN
  const [cinFormat, setCinFormat] = useState<"pdf" | "images">("pdf");
  const [cinFiles, setCinFiles] = useState<File[]>([]);
  const [cinError, setCinError] = useState<string | null>(null);

  // ✅ Limite : 5 Mo
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors("Le fichier ne doit pas dépasser 5 MB.");
      return;
    }
    setUploadedFile(file);
    setErrors(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (!session?.access_token) {
      setErrors("❌ Votre session a expiré, veuillez vous reconnecter.");
      return;
    }
    if (!companyName.trim() || !siret.trim() || !uploadedFile) {
      setErrors("Tous les champs sont obligatoires.");
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
          "Veuillez fournir un fichier PDF (≤ 5 MB) unique pour la CIN.",
        );
        return;
      }
    } else {
      if (
        cinFiles.length !== 2 ||
        !cinFiles.every(
          (f) => f.type.startsWith("image/") && f.size <= MAX_FILE_SIZE,
        )
      ) {
        setCinError("Veuillez fournir 2 images (recto/verso), ≤ 5 MB chacune.");
        return;
      }
    }
    setCinError(null);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("company_name", companyName);
      formData.append("siret", siret);
      formData.append("kbis_document", uploadedFile);
      cinFiles.forEach((file) => {
        formData.append("cin_document", file);
      });

      const res = await fetch("/api/professional-accounts/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // ✅ Message inline de succès (tu peux aussi rediriger si tu veux)
        setErrors(null);
        alert(
          "✅ Votre demande de vérification sera examinée par nos équipes en moins de 24 heures.",
        );
        window.location.href = "/dashboard";
      } else {
        const err = await res.json();
        setErrors(err.error || "Une erreur est survenue côté serveur.");
      }
    } catch (err) {
      console.error(err);
      setErrors("❌ Une erreur est survenue, merci de réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom entreprise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom de l'entreprise *
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border rounded-lg p-3"
          placeholder="Garage Dupont"
        />
      </div>

      {/* SIRET */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numéro SIRET *
        </label>
        <input
          type="text"
          value={siret}
          onChange={(e) =>
            setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))
          }
          className="w-full border rounded-lg p-3"
          placeholder="12345678901234"
        />
      </div>

      {/* KBIS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document KBIS *
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            e.target.files && handleFileSelect(e.target.files[0])
          }
        />
        {uploadedFile && (
          <p className="text-sm text-green-600 mt-1">📄 {uploadedFile.name}</p>
        )}
      </div>

      {/* CIN */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pièce d'identité du gérant (CIN)
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

        {/* Upload */}
        {cinFormat === "pdf" ? (
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setCinFiles(file ? [file] : []);
            }}
            className="block w-full text-sm text-gray-700"
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
            className="block w-full text-sm text-gray-700"
          />
        )}

        {/* Aperçu */}
        {cinFiles.length > 0 && (
          <ul className="mt-2 text-sm text-gray-600 list-disc pl-5">
            {cinFiles.map((f, i) => (
              <li key={i}>{f.name}</li>
            ))}
          </ul>
        )}

        {/* Erreur CIN */}
        {cinError && <p className="text-red-500 text-sm mt-1">{cinError}</p>}
      </div>

      {/* Erreurs globales */}
      {errors && (
        <p className="text-sm text-red-600 mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" /> {errors}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center"
      >
        {isLoading && <Loader className="animate-spin h-5 w-5 mr-2" />}
        Envoyer ma demande
      </button>
    </form>
  );
};
