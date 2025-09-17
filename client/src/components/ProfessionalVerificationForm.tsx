import React, { useState } from "react";
import {
  Building2,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const ProfessionalVerificationForm: React.FC = () => {
  const { session } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrors("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors("Le fichier ne doit pas dépasser 5 MB.");
      return;
    }
    setUploadedFile(file);
    setErrors(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) {
      alert("❌ Votre session a expiré, veuillez vous reconnecter.");
      return;
    }
    if (!companyName.trim() || !siret.trim() || !uploadedFile) {
      setErrors("Tous les champs sont obligatoires.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("company_name", companyName);
      formData.append("siret", siret);
      formData.append("kbis_document", uploadedFile);

      const res = await fetch("/api/professional-accounts/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (res.ok) {
        alert(
          "✅ Votre demande est envoyée. Elle sera examinée dans les 24-48 heures",
        );
        window.location.href = "/dashboard";
      } else {
        const err = await res.json();
        alert(`❌ Erreur: ${err.error || "Une erreur est survenue"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        {errors && (
          <p className="text-sm text-red-600 mt-1 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" /> {errors}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center"
      >
        {isLoading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
        Envoyer ma demande
      </button>
    </form>
  );
};
