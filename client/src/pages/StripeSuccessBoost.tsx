// client/src/pages/StripeSuccessBoost.tsx
import React, { useEffect, useState } from "react";
import { Check, AlertCircle, Zap } from "lucide-react";

const StripeSuccessBoost: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleBoostSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get("session_id");

        if (!sessionId) {
          setStatus("error");
          return;
        }

        // Ici on appelle une API côté backend pour confirmer le paiement Boost
        // ⚠️ À toi d’ajouter l’endpoint /api/boost/success (ou d’utiliser uniquement le webhook)
        const response = await fetch(
          `/api/boost/success?session_id=${sessionId}`,
        );

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = await response.json();
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("❌ Erreur lors du succès Boost Stripe:", error);
        setStatus("error");
      }
    };

    handleBoostSuccess();
  }, []);

  // Décompte + redirection
  useEffect(() => {
    if (status === "success") {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const timer = setTimeout(() => {
        window.location.href = "/dashboard?tab=listings";
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Validation de votre boost...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-700">
          Erreur lors du paiement du boost
        </h2>
        <p className="text-red-600 mt-2">
          Une erreur technique est survenue. Veuillez patienter puis réessayer.
        </p>
      </div>
    );
  }

  // ✅ Succès minimaliste avec compteur
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 relative">
      <div className="bg-white shadow-lg rounded-xl p-10 text-center max-w-md">
        <Zap className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Boost activé !
        </h1>
        <p className="text-gray-600">
          Votre annonce est maintenant mise en avant.
          <br />
          Vous allez être redirigé dans{" "}
          <span className="font-semibold text-gray-900">{countdown}</span>{" "}
          seconde{countdown > 1 ? "s" : ""}.
        </p>
      </div>
    </div>
  );
};

export default StripeSuccessBoost;
