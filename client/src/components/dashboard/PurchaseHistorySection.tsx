import React from "react";

interface Purchase {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: "paid" | "refunded" | "pending";
}

interface PurchaseHistorySectionProps {
  purchases: Purchase[];
  onRefundRequest?: (purchaseId: string) => void;
}

const PurchaseHistorySection: React.FC<PurchaseHistorySectionProps> = ({
  purchases,
  onRefundRequest,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Historique des achats</h2>
      {purchases.length === 0 ? (
        <p className="text-gray-500">Aucun achat effectué pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{purchase.description}</p>
                <p className="text-sm text-gray-500">
                  {purchase.date} — {purchase.amount} €
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm capitalize">{purchase.status}</span>
                {purchase.status === "paid" && onRefundRequest && (
                  <button
                    onClick={() => onRefundRequest(purchase.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Demander un remboursement
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PurchaseHistorySection;
