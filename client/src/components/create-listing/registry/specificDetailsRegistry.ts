export interface FieldDescriptor {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

const FUEL_TYPE_OPTIONS = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "electrique", label: "Électrique" },
  { value: "hybride", label: "Hybride" },
  { value: "gpl", label: "GPL" },
  { value: "ethanol", label: "Éthanol" },
];

const TRANSMISSION_OPTIONS = [
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
  { value: "semi-automatique", label: "Semi-automatique" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "berline", label: "Berline" },
  { value: "suv", label: "SUV/4x4" },
  { value: "break", label: "Break" },
  { value: "coupe", label: "Coupé" },
  { value: "monospace", label: "Monospace" },
  { value: "citadine", label: "Citadine" },
  { value: "cabriolet", label: "Cabriolet" },
];

const MOTORCYCLE_TYPE_OPTIONS = [
  { value: "sportive", label: "Sportive" },
  { value: "roadster", label: "Roadster" },
  { value: "trail", label: "Trail" },
  { value: "custom", label: "Custom" },
  { value: "touring", label: "Touring" },
  { value: "125cc", label: "125cc" },
];

const PART_CONDITION_OPTIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "occasion", label: "Occasion" },
  { value: "reconditionné", label: "Reconditionné" },
];

export function getFieldsForSubcategory(subcategoryId: string): FieldDescriptor[] {
  switch (subcategoryId) {
    case "voiture":
    case "utilitaire":
      return [
        { id: "brand", label: "Marque", type: "text", required: true, placeholder: "Ex: Renault" },
        { id: "model", label: "Modèle", type: "text", required: true, placeholder: "Ex: Clio" },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "mileage", label: "Kilométrage", type: "number", required: true, min: 0, placeholder: "En km" },
        { id: "fuelType", label: "Carburant", type: "select", required: true, options: FUEL_TYPE_OPTIONS },
        { id: "transmission", label: "Transmission", type: "select", required: true, options: TRANSMISSION_OPTIONS },
        { id: "vehicleType", label: "Type de véhicule", type: "select", required: subcategoryId === "voiture", options: VEHICLE_TYPE_OPTIONS },
        { id: "power", label: "Puissance (ch)", type: "number", required: false, min: 0 },
        { id: "displacement", label: "Cylindrée (cm³)", type: "number", required: false, min: 0 },
        { id: "doors", label: "Nombre de portes", type: "number", required: false, min: 2, max: 5 },
        { id: "color", label: "Couleur", type: "text", required: false },
      ];

    case "moto":
    case "scooter":
      return [
        { id: "brand", label: "Marque", type: "text", required: true, placeholder: "Ex: Yamaha" },
        { id: "model", label: "Modèle", type: "text", required: true, placeholder: "Ex: MT-07" },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "mileage", label: "Kilométrage", type: "number", required: true, min: 0, placeholder: "En km" },
        { id: "motorcycleType", label: "Type de moto", type: "select", required: true, options: MOTORCYCLE_TYPE_OPTIONS },
        { id: "displacement", label: "Cylindrée (cm³)", type: "number", required: false, min: 0 },
        { id: "power", label: "Puissance (ch)", type: "number", required: false, min: 0 },
        { id: "color", label: "Couleur", type: "text", required: false },
      ];

    case "quad":
      return [
        { id: "brand", label: "Marque", type: "text", required: true },
        { id: "model", label: "Modèle", type: "text", required: true },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "mileage", label: "Kilométrage", type: "number", required: false, min: 0 },
        { id: "displacement", label: "Cylindrée (cm³)", type: "number", required: false, min: 0 },
        { id: "power", label: "Puissance (ch)", type: "number", required: false, min: 0 },
      ];

    case "caravane":
      return [
        { id: "brand", label: "Marque", type: "text", required: true },
        { id: "model", label: "Modèle", type: "text", required: true },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "sleeps", label: "Nombre de couchages", type: "number", required: true, min: 1, max: 12 },
        { id: "length", label: "Longueur (m)", type: "number", required: false, min: 1 },
      ];

    case "remorque":
      return [
        { id: "trailerType", label: "Type de remorque", type: "text", required: true },
        { id: "capacity", label: "Capacité (kg)", type: "number", required: false, min: 0 },
      ];

    case "bateau":
      return [
        { id: "brand", label: "Marque", type: "text", required: true },
        { id: "model", label: "Modèle", type: "text", required: true },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "length", label: "Longueur (m)", type: "number", required: true, min: 1 },
        { id: "motorPower", label: "Puissance moteur (ch)", type: "number", required: false, min: 0 },
      ];

    case "jetski":
      return [
        { id: "brand", label: "Marque", type: "text", required: true },
        { id: "model", label: "Modèle", type: "text", required: true },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "power", label: "Puissance (ch)", type: "number", required: false, min: 0 },
        { id: "hoursUsed", label: "Heures d'utilisation", type: "number", required: false, min: 0 },
      ];

    case "aerien":
      return [
        { id: "brand", label: "Marque", type: "text", required: true },
        { id: "model", label: "Modèle", type: "text", required: true },
        { id: "year", label: "Année", type: "number", required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { id: "flightHours", label: "Heures de vol", type: "number", required: false, min: 0 },
      ];

    case "piece-voiture":
    case "piece-moto":
    case "autre-piece":
      return [
        { id: "partCategory", label: "Catégorie de pièce", type: "text", required: true, placeholder: "Ex: Moteur, Carrosserie..." },
        { id: "partCondition", label: "État de la pièce", type: "select", required: true, options: PART_CONDITION_OPTIONS },
        { id: "brand", label: "Marque", type: "text", required: false },
        { id: "compatibleModels", label: "Modèles compatibles", type: "textarea", required: false, placeholder: "Ex: Renault Clio 3, Megane 2..." },
        { id: "reference", label: "Référence", type: "text", required: false },
      ];

    case "reparation":
    case "remorquage":
    case "entretien":
    case "autre-service":
      return [
        { id: "serviceType", label: "Type de service", type: "text", required: true },
        { id: "serviceArea", label: "Zone d'intervention", type: "text", required: true, placeholder: "Ex: Paris et région parisienne" },
        { id: "availability", label: "Disponibilité", type: "text", required: false, placeholder: "Ex: Du lundi au samedi" },
      ];

    default:
      return [];
  }
}

export function getRequiredFields(subcategoryId: string): string[] {
  const fields = getFieldsForSubcategory(subcategoryId);
  return fields.filter(f => f.required).map(f => f.id);
}
