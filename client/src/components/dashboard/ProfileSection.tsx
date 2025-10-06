import React from "react";
import { Edit, Upload } from "lucide-react";
import { ProfessionalVerificationBadge } from "../ProfessionalVerificationBadge";
import { User } from "@/types";
import { PhoneInputComponent } from "../PhoneInput";

interface ProfileSectionProps {
  //profile: any;
  profile: User | null;
  user: any;
  professionalAccount?: any;
  profileForm: any;
  setProfileForm: (form: any) => void;
  editingProfile: boolean;
  setEditingProfile: (val: boolean) => void;
  profileSuccess: boolean;
  savingProfile: boolean;
  handleSaveProfile: () => void;
  refreshProfile: () => Promise<void>;
}

// Dans ProfileSection.tsx (ou utils séparé)
const handleAvatarUpload = async (
  file: File,
  userId: string,
  refreshProfile: () => Promise<void>,
) => {
  // Vérifications format + taille
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    alert("Seuls les formats JPG, PNG et WEBP sont autorisés");
    return;
  }

  if (file.size > 1 * 1024 * 1024) {
    alert("L'image ne doit pas dépasser 1 MB");
    return;
  }

  // Compression + Upload
  //const compressedFile = await compressImage(file);
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const response = await fetch(`/api/avatar/upload/${userId}`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await refreshProfile();
      alert("Photo mise à jour avec succès !");
    }
  } catch (error) {
    alert("Erreur lors de l'upload");
  }
};

export default function ProfileSection({
  profile,
  user,
  professionalAccount,
  profileForm,
  setProfileForm,
  editingProfile,
  setEditingProfile,
  profileSuccess,
  savingProfile,
  handleSaveProfile,
  refreshProfile,
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
              {profile?.avatar ? (
                <img src={profile.avatar} />
              ) : (
                <span>Initiales</span>
              )}
            </div>

            {/* Bouton upload avatar pour utilisateurs individuels en mode édition */}
            {editingProfile && (
              <div className="mt-3 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  id="avatar-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && user?.id) {
                      handleAvatarUpload(file, user.id, refreshProfile);
                    }
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>{profile?.avatar ? "Changer" : "Ajouter"} photo</span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  JPG, PNG, WEBP (2MB max)
                </p>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {profile?.type === "professional" && professionalAccount?.company_name
                ? professionalAccount.company_name
                : profile?.name || user?.email?.split("@")[0] || "Utilisateur"}
            </h2>
            {profile?.type === "professional" && professionalAccount?.company_name && profile?.name && (
              <p className="text-gray-600 text-base mt-1">
                Contact: {profile.name}
              </p>
            )}
            <p className="text-gray-600 text-lg mt-1">
              {user?.email || profile?.email}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <ProfessionalVerificationBadge profile={profile} />
              <span className="px-4 py-2 bg-primary-bolt-100 text-primary-bolt-500 rounded-full text-sm font-semibold border border-primary-bolt-200">
                {profile?.type === "professional"
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
                  : profile?.name || user?.email?.split("@")[0] || ""
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
              value={user?.email || profile?.email || ""}
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
              value={(profile as any)?.phone || ""}
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
            {editingProfile ? (
              <PhoneInputComponent
                value={profileForm.whatsapp || ""}
                onChange={(value) => setProfileForm({ ...profileForm, whatsapp: value })}
                placeholder="Numéro WhatsApp"
                testId="input-whatsapp-profile"
              />
            ) : (
              <input
                type="tel"
                value={(profile as any)?.whatsapp || ""}
                disabled={true}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 text-lg"
              />
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
                  : (profile as any)?.postal_code || ""
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
                editingProfile ? profileForm.city : (profile as any)?.city || ""
              }
              onChange={(e) =>
                setProfileForm({ ...profileForm, city: e.target.value })
              }
              disabled={!editingProfile}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 disabled:bg-gray-50 text-lg"
            />
          </div>
        </div>

        {editingProfile && (
          <div className="mt-10 flex justify-end space-x-4">
            <button
              onClick={() => {
                setEditingProfile(false);
                // Réinitialiser le formulaire avec les données originales
                setProfileForm({
                  name: profile?.name || "",
                  phone: (profile as any)?.phone || "",
                  whatsapp: (profile as any)?.whatsapp || "",
                  postalCode: (profile as any)?.postal_code || "",
                  city: (profile as any)?.city || "",
                  companyName: (profile as any)?.company_name || "",
                  address: (profile as any)?.address || "",
                  website: (profile as any)?.website || "",
                  description: (profile as any)?.bio || "",
                  companyLogo: (profile as any)?.company_logo || "",
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
