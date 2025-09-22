import React from "react";

interface Subscription {
  id: string;
  plan: "starter" | "business" | "premium";
  status: "active" | "canceled" | "expired";
  renewalDate?: string;
}

interface PremiumSectionProps {
  subscription?: Subscription;
  onUpgrade: () => void;
  onCancel: () => void;
}

const PremiumSection: React.FC<PremiumSectionProps> = ({
  subscription,
  onUpgrade,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mon abonnement</h2>
      {!subscription ? (
        <div className="p-4 border rounded text-center">
          <p className="mb-2">Vous n’avez pas encore d’abonnement premium.</p>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Passer en Premium
          </button>
        </div>
      ) : (
        <div className="p-4 border rounded space-y-2">
          <p>
            Plan actuel : <strong>{subscription.plan}</strong>
          </p>
          <p>
            Statut : <strong>{subscription.status}</strong>
          </p>
          {subscription.renewalDate && (
            <p>Renouvellement : {subscription.renewalDate}</p>
          )}
          <div className="flex space-x-2">
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Changer de plan
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumSection;
