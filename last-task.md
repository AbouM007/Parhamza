# Last Task: Onboarding Persistence (Particuliers & Pros)

## 🎯 Problème identifié
- L’onboarding ne se rappelle pas d’un particulier qui n’a pas complété son profil.
- Cause : `onboarding_state` n’est pas sauvegardé en base pour les particuliers (seulement `profile_completed: true`).
- Résultat : si l’utilisateur ferme le navigateur avant d’avoir fini → il repart de zéro.

---

## 🧪 Discussions & pistes

### Première analyse de l’agent
- Solution naïve (Option 1) : marquer directement `onboarding_state: "completed"` quand le particulier soumet le formulaire.
- ❌ Limite : si l’utilisateur quitte avant de soumettre, il est perdu.

### Révision après contestation
- **Option 2 retenue** : sauvegarder l’état à chaque étape.
  - ChoiceStep (Particulier) → `type: "individual", onboarding_state: "personal"`
  - PersonalStep complété → `profile_completed: true, onboarding_state: "completed"`

---

## 📋 Plan révisé (Particuliers + Pros)

### Particuliers
- ChoiceStep → `type: "individual", onboarding_state: "personal"`
- PersonalStep validé → `profile_completed: true, onboarding_state: "completed"`

### Professionnels
- ChoiceStep → `type: "professional", onboarding_state: "professional"`
- ProfessionalStep validé → `onboarding_state: "docs"`
- Documents uploadés → `onboarding_state: "payment"`
- Paiement Stripe validé → `profile_completed: true, onboarding_state: "completed"`

---

## ✅ Étapes techniques à implémenter
1. **Backend**
   - Route `POST /api/onboarding/save-state` pour persister uniquement `type` et `onboarding_state`.
2. **Frontend**
   - ChoiceStep → appelle `/save-state` selon le type choisi.
   - ProfessionalStep → sauvegarde `docs`.
   - DocsStep → sauvegarde `payment`.
   - PersonalStep ou Stripe success → marque `completed`.
3. **checkOnboarding**
   - Détecte les états intermédiaires et renvoie l’utilisateur à la bonne étape.
4. **useOnboardingV2**
   - Initialise le flux avec l’état DB (sinon fallback sur `choice`).

---

## 📌 Prochaines actions
- Implémenter la route `/api/onboarding/save-state`.
- Mettre à jour ChoiceStep pour sauvegarder dès le choix.
- Vérifier la logique de redirection dans `checkOnboarding`.
- Tester le flux complet pour :
  - Particulier qui ferme sans finir (→ revient sur PersonalStep).
  - Particulier qui termine (→ plus d’onboarding).
  - Pro qui s’arrête à chaque étape (→ reprend correctement).
