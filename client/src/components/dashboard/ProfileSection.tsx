import React from "react";
import { Edit, Upload, Building2 } from "lucide-react";
import { CompanyNameDisplay } from "../CompanyNameDisplay";
import { ProfessionalVerificationBadge } from "../ProfessionalVerificationBadge";

interface ProfileSectionProps {
  dbUser: any;
  user: any;
  profileForm: any;
  setProfileForm: (form: any) => void;
  editingProfile: boolean;
  setEditingProfile: (val: boolean) => void;
  profileSuccess: boolean;
  savingProfile: boolean;
  handleSaveProfile: () => void;
  refreshDbUser: () => void;
}

export default function ProfileSection({
  dbUser,
  user,
  profileForm,
  setProfileForm,
  editingProfile,
  setEditingProfile,
  profileSuccess,
  savingProfile,
  handleSaveProfile,
  refreshDbUser,
}: ProfileSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Gérez vos informations personnelles
          </p>
        </div>
        <button
          onClick={() => setEditingProfile(!editingProfile)}
          className="bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Edit className="h-4 w-4" />
          <span>{editingProfile ? "Annuler" : "Modifier"}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Message de succès */}
        {profileSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-green-800 font-medium">
              Profil mis à jour avec succès !
            </p>
          </div>
        )}

        <div className="flex items-center space-x-8 mb-10">
          {/* Avatar avec upload pour utilisateurs individuels */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {dbUser?.type === "individual" && dbUser?.avatar ? (
                <img
                  src={dbUser.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : dbUser?.type === "professional" &&
                (dbUser as any)?.company_logo ? (
                <img
                  src={(dbUser as any).company_logo}
                  alt="Logo entreprise"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-3xl">
                  {(dbUser?.name || user?.email || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Bouton upload avatar pour utilisateurs individuels en mode édition */}
            {editingProfile && dbUser?.type === "individual" && (
              <div className="mt-3 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  id="avatar-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user?.id) return;

                    // Vérifier le format
                    const allowedTypes = [
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/webp",
                    ];
                    if (!allowedTypes.includes(file.type)) {
                      alert(
                        "Seuls les formats JPG, PNG et WEBP sont autorisés",
                      );
                      return;
                    }

                    // Vérifier la taille (1MB max pour Replit)
                    if (file.size > 1 * 1024 * 1024) {
                      alert("L'image ne doit pas dépasser 1 MB pour Replit");
                      return;
                    }

                    // Fonction pour compresser l'image
                    const compressImage = (file: File): Promise<File> => {
                      return new Promise((resolve) => {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const img = new Image();

                        img.onload = () => {
                          // Redimensionner à 200x200 max
                          const maxSize = 200;
                          let { width, height } = img;

                          if (width > height) {
                            if (width > maxSize) {
                              height = (height * maxSize) / width;
                              width = maxSize;
                            }
                          } else {
                            if (height > maxSize) {
                              width = (width * maxSize) / height;
                              height = maxSize;
                            }
                          }

                          canvas.width = width;
                          canvas.height = height;

                          ctx?.drawImage(img, 0, 0, width, height);

                          canvas.toBlob(
                            (blob) => {
                              if (blob) {
                                const compressedFile = new File(
                                  [blob],
                                  file.name,
                                  {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                  },
                                );
                                resolve(compressedFile);
                              } else {
                                resolve(file);
                              }
                            },
                            "image/jpeg",
                            0.8,
                          );
                        };

                        img.src = URL.createObjectURL(file);
                      });
                    };

                    // Compresser l'image avant upload
                    const compressedFile = await compressImage(file);

                    const formData = new FormData();
                    formData.append("avatar", compressedFile);

                    console.log("🚀 Début upload avatar");
                    console.log("📁 Fichier original:", {
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    });
                    console.log("📁 Fichier compressé:", {
                      name: compressedFile.name,
                      size: compressedFile.size,
                      type: compressedFile.type,
                    });
                    console.log("👤 User ID:", user.id);

                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(
                        () => controller.abort(),
                        30000,
                      ); // 30s timeout

                      const response = await fetch(
                        `/api/avatar/upload/${user.id}`,
                        {
                          method: "POST",
                          body: formData,
                          signal: controller.signal,
                        },
                      );

                      clearTimeout(timeoutId);

                      console.log("Statut de la réponse:", response.status);
                      console.log("Headers de la réponse:", [
                        ...response.headers.entries(),
                      ]);

                      // Vérifier si la réponse est OK avant de parser JSON
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                          "Erreur HTTP:",
                          response.status,
                          errorText,
                        );
                        alert(`Erreur HTTP ${response.status}: ${errorText}`);
                        return;
                      }

                      const result = await response.json();

                      console.log("Statut de la réponse:", response.status);
                      console.log("Résultat complet:", result);

                      if (response.ok) {
                        // Mettre à jour le profil localement - rafraîchir les données utilisateur
                        await refreshDbUser();
                        alert("Photo de profil mise à jour avec succès !");
                      } else {
                        console.error("Erreur API:", result);
                        alert(
                          `Erreur: ${result.error || result.message || "Erreur inconnue"}`,
                        );
                      }
                    } catch (error) {
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : "Erreur inconnue";
                      const errorStack =
                        error instanceof Error ? error.stack : undefined;

                      console.error(
                        "Erreur upload avatar - Message:",
                        errorMessage,
                      );
                      console.error(
                        "Erreur upload avatar - Stack:",
                        errorStack,
                      );
                      console.error(
                        "Erreur upload avatar - Type:",
                        typeof error,
                      );
                      console.error(
                        "Erreur upload avatar - Name:",
                        error instanceof Error ? error.name : "Unknown",
                      );

                      // Gestion spécifique des erreurs
                      if (
                        error instanceof Error &&
                        error.name === "AbortError"
                      ) {
                        alert(
                          "Timeout: L'upload a pris trop de temps. Essayez avec une image plus petite.",
                        );
                      } else if (errorMessage.includes("Failed to fetch")) {
                        alert(
                          "Erreur de connexion au serveur. Vérifiez votre connexion et réessayez.",
                        );
                      } else {
                        alert(
                          `Erreur lors de l'upload de l'avatar: ${errorMessage}`,
                        );
                      }
                    }
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>{dbUser?.avatar ? "Changer" : "Ajouter"} photo</span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  JPG, PNG, WEBP (2MB max)
                </p>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {dbUser?.name || user?.email?.split("@")[0] || "Utilisateur"}
            </h2>
            <CompanyNameDisplay userId={dbUser?.id} userType={dbUser?.type} />
            <p className="text-gray-600 text-lg mt-1">
              {user?.email || dbUser?.email}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <ProfessionalVerificationBadge dbUser={dbUser} />
              <span className="px-4 py-2 bg-primary-bolt-100 text-primary-bolt-500 rounded-full text-sm font-semibold border border-primary-bolt-200">
                {dbUser?.type === "professional"
                  ? "🏢 Professionnel"
                  : "👤 Particulier"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pseudo ou Nom Prénom (Sera affiché en public)
            </label>
            <input
              type="text"
              value={
                editingProfile
                  ? profileForm.name
                  : dbUser?.name || user?.email?.split("@")[0] || ""
              }
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              disabled={!editingProfile}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Email
            </label>
            <input
              type="email"
              value={user?.email || dbUser?.email || ""}
              disabled={true}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 text-lg cursor-not-allowed"
              title="L'email ne peut pas être modifié"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Téléphone
            </label>
            <input
              type="tel"
              value={(dbUser as any)?.phone || ""}
              disabled={true} // ✅ Toujours désactivé
              className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 text-lg cursor-not-allowed"
              title="Le téléphone ne peut pas être modifié après la création du compte"
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 Le numéro de téléphone ne peut pas être modifié après la
              création du compte
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              WhatsApp
            </label>
            <input
              type="tel"
              value={
                editingProfile
                  ? profileForm.whatsapp
                  : (dbUser as any)?.whatsapp || ""
              }
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // ✅ Supprimer tout sauf les chiffres
                if (value.length <= 10) {
                  // ✅ Limiter à exactement 10 chiffres
                  setProfileForm({ ...profileForm, whatsapp: value });
                }
              }}
              disabled={!editingProfile}
              maxLength={10} // ✅ Limite HTML exacte
              placeholder="0612345678"
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg ${
                editingProfile &&
                profileForm.whatsapp &&
                profileForm.whatsapp.length !== 10 &&
                profileForm.whatsapp.length > 0
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {editingProfile && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  Entrez exactement 10 chiffres (ex: 0612345678)
                </p>
                {profileForm.whatsapp &&
                  profileForm.whatsapp.length > 0 &&
                  profileForm.whatsapp.length !== 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      ❌ Le numéro WhatsApp doit contenir exactement 10 chiffres
                      ({profileForm.whatsapp.length}/10)
                    </p>
                  )}
                {profileForm.whatsapp && profileForm.whatsapp.length === 10 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Numéro valide
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Code postal
            </label>
            <input
              type="text"
              value={
                editingProfile
                  ? profileForm.postalCode
                  : (dbUser as any)?.postal_code || ""
              }
              onChange={(e) =>
                setProfileForm({ ...profileForm, postalCode: e.target.value })
              }
              disabled={!editingProfile}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ville
            </label>
            <input
              type="text"
              value={
                editingProfile ? profileForm.city : (dbUser as any)?.city || ""
              }
              onChange={(e) =>
                setProfileForm({ ...profileForm, city: e.target.value })
              }
              disabled={!editingProfile}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
            />
          </div>
        </div>

        {/* Section Entreprise pour les professionnels */}
        {dbUser?.type === "professional" && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">
                Informations Entreprise
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom entreprise - Lecture seule */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={(dbUser as any)?.company_name || "Non renseigné"}
                  disabled={true}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 text-lg cursor-not-allowed"
                  title="Le nom de l'entreprise ne peut pas être modifié"
                />
              </div>

              {/* SIRET - Lecture seule */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  SIRET
                </label>
                <input
                  type="text"
                  value={(dbUser as any)?.siret || "Non renseigné"}
                  disabled={true}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 text-lg cursor-not-allowed"
                  title="Le SIRET ne peut pas être modifié"
                />
              </div>

              {/* Adresse entreprise - Éditable */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Adresse entreprise
                </label>
                <input
                  type="text"
                  value={
                    editingProfile
                      ? profileForm.address
                      : (dbUser as any)?.address || ""
                  }
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  disabled={!editingProfile}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
                  placeholder="Adresse de votre entreprise"
                />
              </div>

              {/* Site web - Éditable */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Site web
                </label>
                <input
                  type="url"
                  value={
                    editingProfile
                      ? profileForm.website
                      : (dbUser as any)?.website || ""
                  }
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  disabled={!editingProfile}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
                  placeholder="https://www.monentreprise.com"
                />
              </div>

              {/* Logo d'entreprise - Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Logo de l'entreprise
                </label>
                <div className="flex items-start space-x-4">
                  {/* Affichage du logo actuel */}
                  {(editingProfile
                    ? profileForm.companyLogo
                    : (dbUser as any)?.company_logo || "") && (
                    <div className="flex-shrink-0">
                      <img
                        src={
                          editingProfile
                            ? profileForm.companyLogo
                            : (dbUser as any)?.company_logo || ""
                        }
                        alt="Logo entreprise"
                        className="w-20 h-20 rounded-xl object-cover border border-gray-300"
                      />
                    </div>
                  )}

                  {/* Bouton d'upload en mode édition */}
                  {editingProfile && (
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="logo-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !dbUser?.id) return;

                          const formData = new FormData();
                          formData.append("logo", file);

                          try {
                            const response = await fetch(
                              `/api/images/upload-logo/${dbUser.id}`,
                              {
                                method: "POST",
                                body: formData,
                              },
                            );

                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.logo) {
                                setProfileForm({
                                  ...profileForm,
                                  companyLogo: data.logo.url,
                                });
                              }
                            } else {
                              alert("Erreur lors de l'upload du logo");
                            }
                          } catch (error) {
                            console.error("Erreur upload logo:", error);
                            alert("Erreur lors de l'upload du logo");
                          }
                        }}
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Upload className="h-4 w-4" />
                        <span>
                          {profileForm.companyLogo
                            ? "Changer le logo"
                            : "Ajouter un logo"}
                        </span>
                      </label>
                      <p className="text-sm text-gray-600 mt-2">
                        Image carrée recommandée (200x200px max, formats: JPG,
                        PNG, WebP)
                      </p>
                    </div>
                  )}

                  {/* Message si pas de logo et pas en mode édition */}
                  {!editingProfile &&
                    !((dbUser as any)?.company_logo || "") && (
                      <div className="flex-1 text-gray-600 italic">
                        Aucun logo d'entreprise configuré
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {editingProfile && (
          <div className="mt-10 flex justify-end space-x-4">
            <button
              onClick={() => {
                setEditingProfile(false);
                // Réinitialiser le formulaire avec les données originales
                setProfileForm({
                  name: dbUser?.name || "",
                  phone: (dbUser as any)?.phone || "",
                  whatsapp: (dbUser as any)?.whatsapp || "",
                  postalCode: (dbUser as any)?.postal_code || "",
                  city: (dbUser as any)?.city || "",
                  companyName: (dbUser as any)?.company_name || "",
                  address: (dbUser as any)?.address || "",
                  website: (dbUser as any)?.website || "",
                  description: (dbUser as any)?.bio || "",
                  companyLogo: (dbUser as any)?.company_logo || "",
                });
              }}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-8 py-3 bg-gradient-to-r from-primary-bolt-500 to-primary-bolt-600 hover:from-primary-bolt-600 hover:to-primary-bolt-700 disabled:bg-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {savingProfile ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
