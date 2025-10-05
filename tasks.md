
Voici la nouvelle structure des sous-catégories de pièces :
📦 Nouvelles catégories de pièces détachées

    piece-voiture-utilitaire (pour Voitures & Utilitaires)
    piece-moto-scooter (pour Motos & Scooters)
    piece-quad (pour Quads)
    piece-caravane-remorque (pour Caravanes & Remorques)
    piece-jetski-bateau (pour Jetskis & Bateaux)
    piece-aerien (pour Aériens - ULM, hélico, etc.)

Petite suggestion : Je séparerais peut-être piece-jetski-bateau et piece-aerien car les pièces sont très différentes, mais on peut aussi les garder groupées si vous préférez.
🔄 Ce qui change concrètement
Dans le formulaire de création :

    Étape "Sous-famille" : Afficher ces 6 nouvelles catégories au lieu des 3 actuelles
    Suggestions de compatibilité : Adapter selon la nouvelle catégorie sélectionnée
    Validation : S'assurer que la catégorie correspond au type de pièce

Dans le matching des pièces compatibles :

Véhicule quad accidenté → Chercher uniquement dans piece-quad
Véhicule moto accidentée → Chercher uniquement dans piece-moto-scooter

Voulez-vous que je crée le plan d'implémentation complet pour cette refonte ? Ça implique :

    Modifier categories.ts
    Mettre à jour le formulaire
    Adapter la logique de matching dans VehicleDetail.tsx
    Migrer les données existantes (si nécessaire)



 Analysons l'impact complet de ce changement :

Parfait ! J'ai analysé votre structure. Voici l'impact complet :
📊 Impact détaillé du changement
1. BASE DE DONNÉES ✅ Aucun changement structurel

    Colonne category : Stocke déjà la sous-catégorie (TEXT) → piece-voiture, piece-moto, etc.
    Impact : Juste changer les valeurs stockées, pas la structure
    Migration nécessaire :

    UPDATE annonces SET category = 'piece-moto-scooter' WHERE category = 'piece-moto';
    UPDATE annonces SET category = 'piece-voiture-utilitaire' WHERE category = 'piece-voiture';

2. SCHÉMA DRIZZLE ✅ Aucun changement

    La colonne category: text("category").notNull() reste identique
    Pas de migration Drizzle nécessaire
    Le type reste TEXT, seules les valeurs changent

3. TYPES TYPESCRIPT ⚠️ Mise à jour mineure

    SubcategoryId type à mettre à jour avec les nouvelles valeurs :

    type SubcategoryId = 
      | "voiture" | "utilitaire" | "moto" | "scooter" | "quad"
      | "piece-voiture-utilitaire"    // nouveau
      | "piece-moto-scooter"          // nouveau  
      | "piece-quad"                  // nouveau
      | "piece-caravane-remorque"     // nouveau
      | ...

4. FRONTEND 🔧 Modifications importantes
A. categories.ts - Mise à jour des sous-catégories

// Ancien
subcategories: [
  { id: "piece-moto", name: "Pièces moto" },
  { id: "piece-voiture", name: "Pièces voiture" },
]

// Nouveau
subcategories: [
  { id: "piece-voiture-utilitaire", name: "Pièces voiture/utilitaire" },
  { id: "piece-moto-scooter", name: "Pièces moto/scooter" },
  { id: "piece-quad", name: "Pièces quad" },
  { id: "piece-caravane-remorque", name: "Pièces caravane/remorque" },
  { id: "piece-jetski-bateau", name: "Pièces jetski/bateau" },
  { id: "piece-aerien", name: "Pièces aérien" },
]

B. VehicleDetail.tsx - Mapping véhicule → pièce

// Ancien mapping simple
const sparePartsCategory = 
  currentVehicle.category === "moto" ? "piece-moto" : "piece-voiture"

// Nouveau mapping précis
const vehicleToParts = {
  "voiture": "piece-voiture-utilitaire",
  "utilitaire": "piece-voiture-utilitaire",
  "moto": "piece-moto-scooter",
  "scooter": "piece-moto-scooter",
  "quad": "piece-quad",
  "caravane": "piece-caravane-remorque",
  "remorque": "piece-caravane-remorque",
  "jetski": "piece-jetski-bateau",
  "bateau": "piece-jetski-bateau",
  "aerien": "piece-aerien",
}

C. Formulaire de création - Affichage conditionnel

    Pas de changement de logique
    Juste afficher les 6 nouvelles catégories au lieu de 3

5. BACKEND / ROUTES ✅ Aucun changement

    Les routes acceptent déjà n'importe quelle valeur TEXT
    Pas de validation stricte sur les valeurs de category

📝 Résumé de l'impact
Composant	Impact	Complexité
Base de données	Migration des valeurs	🟡 Moyen (UPDATE SQL)
Schéma Drizzle	Aucun	🟢 Facile
Types TS	Mise à jour énumération	🟢 Facile
categories.ts	Modifier liste	🟢 Facile
VehicleDetail.tsx	Nouveau mapping	🟡 Moyen
Formulaire	Afficher nouvelles catégories	🟢 Facile
Backend	Aucun	🟢 Facile

Estimation : 1-2h de travail + test + migration données