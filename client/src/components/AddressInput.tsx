import React, { useState, useEffect, useRef } from "react";
import { MapPin, Check, AlertCircle, Loader } from "lucide-react";

interface City {
  nom: string;
  code: string;
  codePostal: string;
  codeDepartement: string;
  population: number;
}

interface AddressInputProps {
  postalCode: string;
  city: string;
  onPostalCodeChange: (postalCode: string) => void;
  onCityChange: (city: string) => void;
  className?: string;

  // Props optionnelles
  label?: string; // Exemple: "Adresse principale"
  required?: boolean; // Ajoute un astérisque *
  disabled?: boolean; // Rendre les champs non éditables
  showInfo?: boolean; // Afficher ou non le bloc "Adresse validée"
}

export const AddressInput: React.FC<AddressInputProps> = ({
  postalCode,
  city,
  onPostalCodeChange,
  onCityChange,
  className = "",
  label = "Adresse",
  required = true,
  disabled = false,
  showInfo = true,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Valider format du code postal français
  const isValidPostalCodeFormat = (code: string): boolean => {
    return /^\d{5}$/.test(code);
  };

  // Rechercher villes par code postal
  const searchCitiesByPostalCode = async (code: string) => {
    if (!isValidPostalCodeFormat(code)) {
      setError("Le code postal doit contenir 5 chiffres");
      setCities([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${code}&fields=nom,code,codesPostaux,codeDepartement,population&format=json&geometry=centre`,
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data: City[] = await response.json();

      if (data.length === 0) {
        setError("Code postal non trouvé");
        setCities([]);
      } else {
        setCities(data);
        setError("");

        if (data.length === 1) {
          onCityChange(data[0].nom);
          setShowDropdown(false);
        } else {
          setShowDropdown(true);
        }
      }
    } catch (err) {
      setError("Erreur lors de la recherche des villes");
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const [localPostalCode, setLocalPostalCode] = useState(postalCode);

  useEffect(() => {
    if (postalCode !== localPostalCode) {
      setLocalPostalCode(postalCode);
    }
  }, [postalCode]);

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, "").substring(0, 5);

    setLocalPostalCode(numericValue);
    onPostalCodeChange(numericValue);

    if (numericValue !== localPostalCode) {
      onCityChange("");
      setCities([]);
      setShowDropdown(false);
      setError("");
    }

    if (numericValue.length === 5) {
      searchCitiesByPostalCode(numericValue);
    }
  };

  const selectCity = (selectedCity: City) => {
    onCityChange(selectedCity.nom);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusIcon = () => {
    if (loading)
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (city && postalCode.length === 5)
      return <Check className="h-4 w-4 text-green-500" />;
    return <MapPin className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Bloc responsive côte à côte */}
      <div className="flex flex-col md:flex-row md:space-x-4">
        {/* Code Postal */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={localPostalCode}
              onChange={handlePostalCodeChange}
              className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all ${
                error ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              placeholder="Code postal (ex: 75001)"
              maxLength={5}
              disabled={disabled}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {getStatusIcon()}
            </div>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Ville */}
        <div className="flex-1 relative" ref={dropdownRef}>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-bolt-500 focus:border-primary-bolt-500 transition-all ${
              !postalCode || postalCode.length !== 5
                ? "bg-gray-50 text-gray-500"
                : "border-gray-300"
            }`}
            placeholder="Ville"
            disabled={disabled || !postalCode || postalCode.length !== 5}
          />

          {showDropdown && cities.length > 1 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
              <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
                Plusieurs villes trouvées :
              </div>
              {cities.map((cityOption, index) => (
                <button
                  key={`${cityOption.code}-${index}`}
                  onClick={() => selectCity(cityOption)}
                  className="w-full text-left px-4 py-3 hover:bg-primary-bolt-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {cityOption.nom}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cityOption.population.toLocaleString()} habitants
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Infos ville validée */}
      {showInfo && city && cities.length > 0 && !showDropdown && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center space-x-2 text-green-800">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Adresse validée</span>
          </div>
          <div className="mt-1 text-sm text-green-700">
            {city} ({postalCode})
          </div>
        </div>
      )}
    </div>
  );
};
