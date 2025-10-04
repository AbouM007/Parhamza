🧠 Objectif

Refaire le prompt de refactorisation qui avait déclenché le découpage du CreateListingForm —
mais cette fois, en l’améliorant profondément pour :

✅ Éviter les régressions (comme les steps cassés ou les imports manquants)

✅ Garder la logique conditionnelle originale (navigation dynamique, validation, dépendances)

✅ S’assurer que le code reste exécutable à chaque étape

✅ Maintenir la cohérence des exports/imports (nommés vs default)

✅ Préserver l’architecture métier spécifique à ton projet automobile

⚙️ Voici le prompt amélioré (v3) que tu pourras réutiliser

Tu peux le coller directement à ton agent IA (Replit AI, Claude, Codex, etc.) :

🧩 Prompt : “Refactorisation orchestrée du CreateListingForm”

Rôle attendu :
Tu es un ingénieur logiciel senior chargé de refactoriser un formulaire React monolithique (CreateListingForm.tsx) en architecture modulaire claire et testable, sans perte de logique métier.

🎯 Objectif global :

Transformer le fichier CreateListingForm.tsx (≈3800 lignes) en un système modulaire prêt pour la production comportant :

des hooks clairs (useFormData, useFormNavigation, useFormSubmission),

des composants steps autonomes,

un registry central pour les champs dynamiques,

un orchestrateur principal simplifié (CreateListingForm),

sans casser la logique existante (étapes conditionnelles, validations, compatibilités, etc.).

⚙️ Contraintes strictes à respecter :
1️⃣ Structure du projet

Crée ou conserve :

client/src/components/create-listing/
  ├─ CreateListingForm.tsx           # orchestrateur
  ├─ hooks/
  │   ├─ useFormData.ts
  │   ├─ useFormNavigation.ts
  │   └─ useFormSubmission.ts
  ├─ steps/
  │   ├─ ListingTypeStep.tsx
  │   ├─ CategoryStep.tsx
  │   ├─ SubcategoryStep.tsx
  │   ├─ ConditionStep.tsx
  │   ├─ TitleStep.tsx
  │   ├─ SpecificDetailsStep.tsx
  │   ├─ DescriptionStep.tsx
  │   ├─ PhotosStep.tsx
  │   ├─ PriceStep.tsx
  │   ├─ LocationStep.tsx
  │   ├─ ContactStep.tsx
  │   └─ SummaryStep.tsx
  ├─ specificDetailsRegistry.ts
  └─ types.ts


💡 Tous les Step doivent utiliser export default pour éviter les erreurs d’import.

2️⃣ Navigation dynamique

Le hook useFormNavigation.ts doit :

générer les étapes dynamiquement selon formData.category et formData.transactionType

gérer le saut automatique des steps inutiles (service, piece)

ajouter dynamiquement damageDetails si condition === "damaged"

exposer :

currentStep, currentIndex, steps, progress, nextStep, prevStep, goToStep


et une fonction optionnelle canProceed() (validation par étape, à implémenter plus tard)

3️⃣ Validation par étape (préparée mais non bloquante)

Prépare une fonction :

isStepValid(step: string, formData: FormData): boolean;


Mais ne l’applique pas encore dans le flux (juste un placeholder à connecter plus tard).

4️⃣ Logique métier préservée

Tu dois :

conserver la logique “conditionnelle” :

voiture/moto → steps complets

piece → saute condition

service → saute condition, photos, price

conserver la logique condition = damaged → ajoute damageDetails

maintenir les champs brand → model (dépendance dynamique)

garder immatriculation conditionné à category = véhicule

ne jamais supprimer les listes de mockData.ts (couleurs, marques, modèles, équipements, etc.)

5️⃣ Qualité du code

Aucun import brisé (steps/... → vérifie que les fichiers existent)

Tous les composants doivent être testables individuellement

Aucun hook ne doit dépendre d’un composant (isolation)

Pas de console.log inutiles

Code compilable sans erreur Vite/TypeScript

Les hooks doivent être pur React : pas d’effet global ni de dépendance à Supabase directement

🚀 Processus à suivre (pour l’agent IA)

Lire entièrement le fichier CreateListingForm.tsx existant

Identifier les étapes, hooks internes et sections récurrentes

Créer les 3 hooks (data, navigation, submission)

Créer les 12 fichiers Step correspondants

Créer specificDetailsRegistry.ts pour gérer les champs spécifiques

Réécrire un CreateListingForm.tsx léger (<300 lignes) en orchestrateur

Vérifier la compilation

Exécuter un test minimal sur chaque catégorie (voiture, piece, service)

Générer un rapport final (structure, nombre de lignes, vérification des imports)

💡 Aides contextuelles pour l’agent :

Si une erreur TypeScript is not a function apparaît → vérifier export default / named export.

Si Vite échoue sur un import ./steps/... → suggérer de créer le dossier manquant.

Toujours documenter les fonctions avec /** ... */ explicatif.

🧾 Livraison attendue

Un dossier create-listing/ complet, structuré, et fonctionnel

Une documentation courte en Markdown (README.md) expliquant les hooks et steps

Un résumé des steps dynamiques selon chaque catégorie

✅ Objectif final

Le CreateListingForm doit devenir un orchestrateur de haute qualité,
lisible, testable, et extensible (ajout de compatibilité pièces, boost Stripe, etc.),
sans perdre la logique métier ni casser la navigation.