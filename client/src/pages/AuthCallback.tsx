import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PasswordResetForm } from "../components/PasswordResetForm";

// Page de callback pour OAuth (Google, Apple, Facebook)
export const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState("processing");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(
          window.location.hash.replace("#", ""),
        );
        const accessToken = urlParams.get("access_token");
        const refreshToken = urlParams.get("refresh_token");
        const type = urlParams.get("type");

        console.log("🔄 Traitement callback auth - Type:", type);
        console.log("🔄 Access token présent:", !!accessToken);

        // Si c'est un reset de mot de passe, on affiche le formulaire
        if (type === "recovery" && accessToken) {
          console.log("🔑 Réinitialisation de mot de passe détectée");

          // Vérifier que la session est valide pour le reset
          const { data, error } = await supabase.auth.getSession();

          if (error || !data.session) {
            console.error("❌ Erreur session pour reset:", error);
            setStatus("error");
            setTimeout(() => {
              window.location.href = "/?auth=error";
            }, 2000);
            return;
          }

          // Afficher le formulaire de reset
          setIsPasswordReset(true);
          setStatus("success");
          return;
        }

        // Si on a un access_token dans l'URL (magic link ou OAuth)
        if (accessToken) {
          console.log("✨ Magic link détecté, traitement...");

          // Supabase détecte automatiquement le token depuis l'URL
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("❌ Erreur récupération session:", error);
            setStatus("error");
            setTimeout(() => {
              window.location.href = "/?auth=error";
            }, 2000);
            return;
          }
        } else {
          // Tentative avec exchangeCodeForSession pour OAuth classique
          console.log("🔄 Tentative échange code OAuth...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.href,
          );

          if (error) {
            console.error("❌ Erreur échange code:", error);
            setStatus("error");
            setTimeout(() => {
              window.location.href = "/?auth=error";
            }, 2000);
            return;
          }
        }

        // Vérifier qu'on a bien une session maintenant
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          console.error("❌ Aucune session trouvée après callback");
          setStatus("error");
          setTimeout(() => {
            window.location.href = "/?auth=error";
          }, 2000);
          return;
        }

        const user = sessionData.session.user;
        if (user) {
          console.log("✅ Session créée pour:", user.email);

          // Synchroniser l'utilisateur dans nos tables
          try {
            const syncResponse = await fetch("/api/auth/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.id,
                userData: user.user_metadata || {},
              }),
            });

            if (syncResponse.ok) {
              console.log("✅ Utilisateur synchronisé");
            } else {
              console.log("⚠️ Sync échouée, mais session créée");
            }
          } catch (syncError) {
            console.error("⚠️ Erreur sync:", syncError);
          }

          setStatus("success");

          // Nettoyer l'URL et rediriger
          window.history.replaceState({}, document.title, "/");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setStatus("error");
          setTimeout(() => {
            window.location.href = "/?auth=error";
          }, 2000);
        }
      } catch (error) {
        console.error("❌ Erreur callback OAuth:", error);
        setStatus("error");
        setTimeout(() => {
          window.location.href = "/?auth=error";
        }, 2000);
      }
    };

    handleAuthCallback();
  }, []);

  // Gestionnaires pour le formulaire de reset
  /*const handlePasswordResetSuccess = () => {
    console.log('✅ Mot de passe mis à jour avec succès');
    setStatus('success');
    setTimeout(() => {
      window.location.href = '/?auth=password-updated';
    }, 2000);
  };
  */

  // Gestionnaires pour le formulaire de reset
  const handlePasswordResetSuccess = () => {
    setStatus("password-updated"); // 👉 état spécial uniquement pour le reset
    // Redirection automatique après 3 secondes
    setTimeout(() => {
      window.location.href = "/dashboard"; // ou "/" si tu préfères accueil
    }, 3000);
  };

  const handlePasswordResetError = (error: string) => {
    console.error("❌ Erreur reset password:", error);
    setResetError(error);
  };

  // ✅ Ici on insère le bloc succès après reset
  if (status === "password-updated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Mot de passe mis à jour ✅
          </h2>
          <p className="text-gray-600 mb-2">
            Votre nouveau mot de passe a été enregistré avec succès.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Vous allez être redirigé vers votre tableau de bord dans quelques
            secondes...
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Aller au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Si c'est un reset de mot de passe, afficher le formulaire
  if (isPasswordReset) {
    return (
      <div>
        <PasswordResetForm
          onSuccess={handlePasswordResetSuccess}
          onError={handlePasswordResetError}
        />
        {resetError && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <div className="flex items-center">
              <div className="h-5 w-5 text-red-500 mr-2">⚠️</div>
              <p className="text-red-700 text-sm">{resetError}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Affichage Loader par défaut

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0CBFDE] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {status === "processing" && "Connexion en cours..."}
          {status === "success" && "Connexion réussie !"}
          {status === "error" && "Erreur de connexion"}
        </h2>
        <p className="text-gray-500">
          {status === "processing" &&
            "Nous finalisons votre connexion, veuillez patienter."}
          {status === "success" && "Redirection vers votre tableau de bord..."}
          {status === "error" && "Une erreur est survenue, redirection..."}
        </p>
      </div>
    </div>
  );
};
