// client/src/pages/StripeSuccess.tsx
import React, { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StripeSuccess: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { profile } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleStripeSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get("session_id");

        if (!sessionId) {
          setStatus("error");
          return;
        }

        // Traitement du paiement
        const response = await fetch("/api/subscriptions/handle-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch (error) {
        console.error("❌ Erreur lors du succès Stripe:", error);
        setStatus("error");
      }
    };

    handleStripeSuccess();
  }, []);

  // Décompte + redirection
  useEffect(() => {
    //    if (status === "success" && dbUser?.type === "professional") {
    if (status === "success") {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [status, profile]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Traitement de votre paiement...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-700">
          Erreur lors du paiement
        </h2>
        <p className="text-red-600 mt-2">
          Une erreur technique est survenue. Veuillez patienter puis réssayer.
        </p>
      </div>
    );
  }

  // ✅ Succès minimaliste avec compteur
  /*  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative">
      {/* Logo en haut à gauche */ /*}

      <div className="bg-white shadow-lg rounded-xl p-10 text-center max-w-md">
        <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Paiement réussi !
        </h1>
        <p className="text-gray-600">
          Merci pour votre Achat.
          <br />
          Vous allez être redirigé dans{" "}
          <span className="font-semibold text-gray-900">{countdown}</span>{" "}
          seconde
          {countdown > 1 ? "s" : ""}.
        </p>
      </div>
    </div>
  );
};

export default StripeSuccess;

*/
  // ✅ Succès avec compteur + bouton
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative">
      <div className="bg-white shadow-lg rounded-xl p-10 text-center max-w-md">
        <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Paiement réussi !
        </h1>
        <p className="text-gray-600 mb-4">
          Merci pour votre achat.
          <br />
          Vous allez être redirigé dans{" "}
          <span className="font-semibold text-gray-900">{countdown}</span>{" "}
          seconde{countdown > 1 ? "s" : ""}.
        </p>

        {/* 🚀 Bouton manuel */}
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Aller au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default StripeSuccess;
