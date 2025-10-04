# Task Todo

**Réponse de l'agent IA :**

Voici ma version allégée et concrète de la refactorisation :

🎯 Architecture Pragmatique Simplifiée
client/src/components/create-listing/
│
├── CreateListingForm.tsx             # Orchestrateur (~200-300 lignes)
│
├── hooks/
│   ├── useFormNavigation.ts          # Navigation + validation étapes
│   ├── useFormData.ts                # État formulaire + updates
│   └── useFormSubmission.ts          # Soumission + upload photos
│
├── steps/
│   ├── ListingTypeStep.tsx           # ✅ Déjà fait
│   ├── CategoryStep.tsx              # ✅ Déjà fait  
│   ├── SubcategoryStep.tsx           # Renommé de VehicleDetailsStep
│   ├── ConditionStep.tsx             # État du bien
│   ├── TitleStep.tsx                 # Titre + immatriculation
│   ├── SpecificDetailsStep.tsx       # Champs spécifiques (utilise registry)
│   ├── DescriptionStep.tsx           # Description + dommages si accidenté
│   ├── PhotosStep.tsx                # Upload photos
│   ├── PriceStep.tsx                 # Prix
│   ├── LocationStep.tsx              # Localisation (wrapper AddressInput)
│   ├── ContactStep.tsx               # 3 checkboxes simples
│   └── SummaryStep.tsx               # Récapitulatif
│
├── registry/
│   └── specificDetailsRegistry.ts    # Switch simple subcategory → fields
│
└── types.ts                          # Types partagés (FormData, etc.)
🔧 Les 3 Hooks Principaux
1. useFormNavigation.ts
// Responsabilités :
- currentStep, setCurrentStep
- Calcul totalSteps (selon conditions)
- nextStep() / prevStep() avec validation basique
- shouldSkipStep(step) pour étapes conditionnelles
- isStepValid(step) pour activer/désactiver "Suivant"
2. useFormData.ts
// Responsabilités :
- formData state
- updateFormData(field, value)
- Initialisation depuis profil utilisateur
- Pas de persistence localStorage pour l'instant (on garde simple)
3. useFormSubmission.ts
// Responsabilités :
- handleSubmit() final
- Upload photos vers Supabase
- Appel API création annonce
- Gestion modales succès/boost
- Vérification quota
📋 Registry Simplifié
Un seul fichier specificDetailsRegistry.ts :

export function getFieldsForSubcategory(subcategoryId: string) {
  switch(subcategoryId) {
    case 'voiture':
    case 'utilitaire':
      return ['brand', 'model', 'year', 'mileage', 'fuelType', 'transmission'];

    case 'moto':
    case 'scooter':
      return ['brand', 'model', 'year', 'mileage', 'cylindree'];

    case 'piece-moteur':
    case 'piece-carrosserie':
      return ['partType', 'brand', 'compatibleModels', 'condition'];

    // ... etc
    default:
      return [];
  }
}
Simple et efficace. Le composant SpecificDetailsStep fera le switch/if pour render les bons champs.

🚀 ContactStep Simplifié
// Trois simples checkboxes :
☑️ Afficher mon téléphone
☑️ Afficher WhatsApp  
☑️ Messagerie interne (toujours activée par défaut)
// Pas de formatage, pas de validation téléphone
// Les valeurs viennent du profil, on choisit juste la visibilité
📦 Ce qui EST dans cette version
✅ 12 composants steps bien découpés
✅ 3 hooks concentrés sur l'essentiel
✅ Registry simple et fonctionnel
✅ Logique métier extraite du monolithe
✅ Code testable et maintenable
✅ Base solide pour itérations futures

🚫 Ce qui N'EST PAS (phase 2+)
❌ Persistence localStorage automatique
❌ Système déclaratif complet avec FieldConfig
❌ Formatage/validation téléphone complexe
❌ Hook dédié vehicleDataFetch (reste inline pour l'instant)
❌ Composants UI atomiques (StepHeader, SelectableCard...)
❌ Arborescence profonde avec sous-dossiers

🎯 Plan d'Exécution
Créer les 3 hooks (extraire logique existante)
Créer types.ts (interface FormData + props)
Créer les 9 nouveaux steps (un par un, UI simple)
Créer le registry (switch basique)
Refactoriser CreateListingForm (devient orchestrateur léger)
Tests manuels de chaque étape
Nettoyage du code commenté
Estimation : Version fonctionnelle livrée rapidement, ~60% de réduction de complexité, prête pour évolutions futures.



**Mon Message :**
Ta version allégée de la refactorisation du CreateListingForm me convient parfaitement.

Je valide cette architecture pragmatique et je souhaite que tu la mettes en œuvre progressivement et sans sur-découpage.

⚙️ Priorités :

Respecte strictement la structure simplifiée que tu proposes (12 steps, 3 hooks, 1 registry, 1 fichier types).

Le CreateListingForm reste l’unique orchestrateur.

Ne crée aucun sous-dossier ou composant supplémentaire pour l’instant.

Les hooks doivent rester simples et lisibles (<150 lignes).

Commence par extraire la logique métier avant de toucher au rendu UI pour éviter toute régression.

L’objectif est d’obtenir une base claire, fonctionnelle et stable, qui réduise la complexité du code sans tout réécrire.

Peux-tu me confirmer que tu as bien compris cette approche et que tu vas t’y tenir avant de commencer ?