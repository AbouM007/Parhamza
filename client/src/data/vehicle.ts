export type VehicleEquipmentKey =
  | "car"
  | "motorcycle"
  | "utility"
  | "caravan"
  | "trailer"
  | "scooter"
  | "quad"
  | "jetski"
  | "boat"
  | "aircraft";

export type VehicleTypeKey = VehicleEquipmentKey;

export const VEHICLE_EQUIPMENT: Record<VehicleEquipmentKey, string[]> = {
  car: [
    "Toit ouvrant / Toit panoramique",
    "Climatisation",
    "GPS",
    "Sièges chauffants",
    "Caméra de recul",
    "Radar de recul",
    "Jantes alliage",
    "Feux LED / Xénon",
    "Vitres électriques",
    "Airbags",
    "Sièges électriques",
    "Attelage",
    "Régulateur de vitesse",
    "Bluetooth",
    "Système audio premium",
    "Cuir",
  ],
  motorcycle: [
    "ABS",
    "Contrôle de traction",
    "Modes de conduite",
    "Éclairage LED",
    "Quickshifter",
    "Chauffage poignées",
    "Pare-brise",
    "Top case",
    "Sacoches",
    "Antivol",
    "Compteur digital",
    "USB",
  ],
  utility: [
    "Climatisation",
    "GPS",
    "Caméra de recul",
    "Radar de recul",
    "Attelage",
    "Cloison de séparation",
    "Hayon arrière",
    "Porte latérale",
    "Plancher bois",
    "Éclairage LED cargo",
    "Prise 12V",
    "Radio Bluetooth",
  ],
  caravan: [
    "Chauffage",
    "Eau courante",
    "WC",
    "Douche",
    "Frigo",
    "Plaques de cuisson",
    "Four",
    "TV",
    "Auvent",
    "Climatisation",
    "Panneaux solaires",
    "Antenne satellite",
  ],
  trailer: [
    "Bâche de protection",
    "Ridelles amovibles",
    "Rampes de chargement",
    "Sangles d'arrimage",
    "Roue de secours",
    "Éclairage LED",
    "Plancher antidérapant",
    "Support vélo",
  ],
  scooter: [
    "ABS",
    "Coffre sous selle",
    "Éclairage LED",
    "Prise USB",
    "Pare-brise",
    "Top case",
    "Antivol",
    "Compteur digital",
  ],
  quad: [
    "Suspension sport",
    "Freins à disque",
    "Démarreur électrique",
    "Pneus tout-terrain",
    "Treuil",
    "Protection",
    "Éclairage LED",
    "Attelage",
  ],
  jetski: [
    "Système audio",
    "GPS",
    "Éclairage LED",
    "Compartiments étanches",
    "Échelle de remontée",
    "Remorque incluse",
    "Housse de protection",
  ],
  boat: [
    "GPS",
    "Sondeur",
    "Radio VHF",
    "Pilote automatique",
    "Éclairage LED",
    "Taud de soleil",
    "Échelle de bain",
    "Douche de pont",
    "WC",
    "Cuisine",
    "Couchettes",
  ],
  aircraft: [
    "Parachute de secours",
    "GPS",
    "Radio",
    "Variomètre",
    "Sac de portage",
    "Kit d'entretien",
    "Housse de protection",
    "Manuel d'utilisation",
  ],
};

export const VEHICLE_TYPES: Record<VehicleTypeKey, string[]> = {
  car: [
    "Citadine",
    "Berline",
    "SUV",
    "Break",
    "Coupé",
    "Cabriolet",
    "Monospace",
    "Pickup",
  ],
  utility: [
    "Camionnette",
    "Fourgon",
    "Plateau",
    "Benne",
    "Frigorifique",
    "Hayon",
    "Autre",
  ],
  caravan: [
    "Caravane pliante",
    "Caravane rigide",
    "Camping-car",
    "Cellule amovible",
    "Autre",
  ],
  trailer: [
    "Remorque bagagère",
    "Remorque porte-voiture",
    "Remorque plateau",
    "Remorque benne",
    "Remorque fermée",
    "Autre",
  ],
  motorcycle: [
    "Sportive",
    "Routière",
    "Trail",
    "Custom",
    "Roadster",
    "Enduro",
    "Cross",
    "Autre",
  ],
  scooter: [
    "Scooter 50cc",
    "Scooter 125cc",
    "Scooter 250cc",
    "Maxi-scooter",
    "Scooter électrique",
    "Scooter vintage",
    "Autre",
  ],
  quad: [
    "Quad sport",
    "Quad utilitaire",
    "Quad enfant",
    "Side-by-side",
    "Autre",
  ],
  aircraft: [
    "ULM pendulaire",
    "ULM multiaxe",
    "Parapente",
    "Paramoteur",
    "Planeur",
    "Avion léger",
    "Hélicoptère",
    "Autre",
  ],
  boat: [
    "Bateau à moteur",
    "Voilier",
    "Semi-rigide",
    "Pneumatique",
    "Catamaran",
    "Pêche promenade",
    "Runabout",
    "Autre",
  ],
  jetski: ["Jet à bras", "Jet assis", "Jet 3 places", "Jet de course", "Autre"],
};

export const TRANSMISSION_TYPES = [
  { value: "manual", label: "Manuelle" },
  { value: "automatic", label: "Automatique" },
  { value: "semi-automatic", label: "Semi-automatique" },
];

export const COLORS = [
  "Blanc",
  "Noir",
  "Gris",
  "Argent",
  "Rouge",
  "Bleu",
  "Vert",
  "Jaune",
  "Orange",
  "Violet",
  "Marron",
  "Beige",
  "Autre",
];

export const DOORS = [2, 3, 4, 5] as const;

export const UPHOLSTERY_TYPES = [
  { value: "tissu", label: "Tissu" },
  { value: "cuir_partiel", label: "Cuir partiel" },
  { value: "cuir", label: "Cuir" },
  { value: "velours", label: "Velours" },
  { value: "alcantara", label: "Alcantara" },
];

export const EMISSION_CLASSES = [
  { value: "euro1", label: "Euro 1" },
  { value: "euro2", label: "Euro 2" },
  { value: "euro3", label: "Euro 3" },
  { value: "euro4", label: "Euro 4" },
  { value: "euro5", label: "Euro 5" },
  { value: "euro6", label: "Euro 6" },
];

export const LICENSE_TYPES = [
  { value: "A", label: "Permis A" },
  { value: "A1", label: "Permis A1" },
  { value: "A2", label: "Permis A2" },
  { value: "AL", label: "Permis AL" },
  { value: "sans_permis", label: "Sans permis" },
];

export const SERVICE_TYPES = [
  "Réparation mécanique",
  "Réparation carrosserie",
  "Entretien",
  "Révision",
  "Contrôle technique",
  "Remorquage",
  "Dépannage",
  "Autre",
];

export const PART_CATEGORIES = [
  "Moteur",
  "Transmission",
  "Freinage",
  "Suspension",
  "Électronique",
  "Carrosserie",
  "Intérieur",
  "Éclairage",
  "Pneumatiques",
  "Autre",
];

export const PART_CONDITIONS = [
  { value: "new", label: "Neuf" },
  { value: "used", label: "Occasion" },
];

export const VEHICLE_CONDITIONS = [
  {
    value: "en_circulation",
    label: "Roulant",
    description: "Véhicule en état de circulation",
  },
  {
    value: "accidente",
    label: "Accidenté",
    description: "Véhicule accidenté, vendu en l'état",
  },
];
