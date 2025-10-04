interface ContactStepProps {
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    showPhone: boolean;
    showWhatsapp: boolean;
    showInternal: boolean;
  };
  onContactChange: (field: string, value: any) => void;
}

export const ContactStep: React.FC<ContactStepProps> = ({
  contact,
  onContactChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Moyens de contact
        </h2>
        <p className="text-gray-600">
          Choisissez comment les acheteurs peuvent vous contacter
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Vos informations de contact
          </h3>
          <div className="space-y-3 text-sm">
            {contact.phone && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Téléphone:</span>
                <span className="font-medium">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{contact.email}</span>
              </div>
            )}
            {contact.whatsapp && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">WhatsApp:</span>
                <span className="font-medium">{contact.whatsapp}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Modes de contact visibles
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={contact.showPhone}
                onChange={(e) =>
                  onContactChange("showPhone", e.target.checked)
                }
                className="mt-1 h-5 w-5 text-primary-bolt-500 rounded focus:ring-2 focus:ring-primary-bolt-500"
                data-testid="checkbox-show-phone"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Afficher mon téléphone
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Les acheteurs pourront vous appeler directement
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={contact.showWhatsapp}
                onChange={(e) =>
                  onContactChange("showWhatsapp", e.target.checked)
                }
                className="mt-1 h-5 w-5 text-primary-bolt-500 rounded focus:ring-2 focus:ring-primary-bolt-500"
                data-testid="checkbox-show-whatsapp"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Afficher WhatsApp
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Les acheteurs pourront vous contacter via WhatsApp
                </p>
              </div>
            </label>

            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-green-50">
              <input
                type="checkbox"
                checked={contact.showInternal}
                onChange={(e) =>
                  onContactChange("showInternal", e.target.checked)
                }
                className="mt-1 h-5 w-5 text-primary-bolt-500 rounded focus:ring-2 focus:ring-primary-bolt-500"
                data-testid="checkbox-show-internal"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Messagerie interne
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Recommandé - Messages sécurisés sur la plateforme
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Conseil
          </h3>
          <p className="text-sm text-blue-800">
            Activer plusieurs moyens de contact augmente vos chances d'être
            contacté rapidement par les acheteurs intéressés.
          </p>
        </div>
      </div>
    </div>
  );
};
