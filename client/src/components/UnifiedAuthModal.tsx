import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { resetPassword } from "@/lib/supabase";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const UnifiedAuthModal: React.FC = () => {
  // ⬇️ on retire authMode/setAuthMode (non utilisés ici)
  const {
    showAuthModal,
    setShowAuthModal,
    runAuthCallbackAfterLogin, // ✅ on l'utilise après login réussi
    refreshQuota,              // ✅ on l'appelle pour mettre à jour le quota
  } = useApp();

  const { signInWithOAuth, signUp, signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // ⚠️ on garde ton switch local (isSignUp) pour gérer les vues
  const [isSignUp, setIsSignUp] = useState(false);
  const [notification, setNotification] = useState<{
    title: string;
    description: string;
    variant: "default" | "destructive";
  } | null>(null);

  const resetForm = () => {
    setFormData({ email: "", password: "", confirmPassword: "" });
    setErrors({});
    setSuccessMessage("");
    setIsPasswordReset(false);
  };

  useEffect(() => {
    if (showAuthModal) resetForm();
  }, [showAuthModal]);

  if (!showAuthModal) return null;

  const showToast = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default",
  ) => {
    setNotification({ title, description, variant });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = "L'email est requis";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Format d'email invalide";

    if (!isPasswordReset && !formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (!isPasswordReset && formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (isSignUp && !isPasswordReset) {
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: keyof typeof formData; value: string };
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isPasswordReset) {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setErrors({ general: `Erreur : ${error.message}` });
          return;
        }
        setSuccessMessage("Un email de réinitialisation a été envoyé.");
        showToast("Email envoyé", "Vérifiez votre boîte mail.");
        setTimeout(() => {
          setIsPasswordReset(false);
          resetForm();
        }, 3000);
        return;
      }

      if (isSignUp) {
        // Inscription → on NE lance PAS la callback (souvent on veut une vérif email)
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          if (error.message?.includes("already registered")) {
            setErrors({ general: "Cet email est déjà utilisé. Essayez de vous connecter." });
            setIsSignUp(false);
          } else {
            setErrors({ general: `Erreur d'inscription : ${error.message}` });
          }
          return;
        }
        // ✅ Si pas d'erreur, l'inscription a réussi
        setSuccessMessage("Compte créé ! Un email de confirmation vous a été envoyé.");
        setTimeout(() => {
          runAuthCallbackAfterLogin();
          setShowAuthModal(false);
        }, 3000);
      } else {
        // Connexion → on lance la callback stockée + on rafraîchit le quota
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (
            error.message?.includes("Invalid login credentials") ||
            error.message?.includes("Email not confirmed")
          ) {
            setErrors({
              general:
                "Email ou mot de passe incorrect. Ou email non confirmé.",
            });
          } else {
            setErrors({ general: `Erreur de connexion : ${error.message}` });
          }
          return;
        }
        // ✅ Si pas d'erreur, la connexion a réussi
        runAuthCallbackAfterLogin();
        showToast("Connexion réussie", "Bienvenue !");
        // ✅ mise à jour du quota + exécution de la callback (ouvre le formulaire, etc.)
        await refreshQuota();
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error("Erreur auth:", error);
      setErrors({ general: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithOAuth("google");
      if (error) {
        setErrors({ general: `Erreur connexion Google : ${error.message}` });
      } else {
        // Redirection → la suite se gère dans ton callback d’auth côté app
      }
    } catch (error) {
      setErrors({ general: "Erreur lors de la connexion avec Google" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isPasswordReset ? "Réinitialiser le mot de passe" : isSignUp ? "Créer un compte" : "Se connecter"}
          </h2>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-4 rounded-lg border-l-4 ${
              notification.variant === "destructive"
                ? "bg-red-50 border-red-400 text-red-700"
                : "bg-green-50 border-green-400 text-green-700"
            }`}
          >
            <div className="flex">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm">{notification.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                className={`w-full pl-10 pr-3 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-[#0CBFDE] focus:border-[#0CBFDE]`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          {!isPasswordReset && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe {isSignUp && <span className="text-gray-500">(min. 6 caractères)</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0CBFDE] focus:border-[#0CBFDE]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {/* Confirm password (signup only) */}
          {!isPasswordReset && isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-3 py-3 rounded-lg border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0CBFDE] focus:border-[#0CBFDE]`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0CBFDE] hover:bg-[#0CBFDE]/90 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : isPasswordReset ? (
              "Envoyer l'email"
            ) : isSignUp ? (
              "Créer le compte"
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Links */}
          <div className="space-y-2 text-center text-sm">
            {!isPasswordReset && (
              <>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#0CBFDE] hover:underline"
                >
                  {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un compte"}
                </button>

                <div className="border-t pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordReset(true)}
                    className="text-gray-600 hover:text-gray-800 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </>
            )}

            {isPasswordReset && (
              <button
                type="button"
                onClick={() => setIsPasswordReset(false)}
                className="text-[#0CBFDE] hover:underline"
              >
                ← Retour à la connexion
              </button>
            )}
          </div>

          {/* Google */}
          {!isPasswordReset && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">ou</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {/* logo G */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  "Continuer avec Google"
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
